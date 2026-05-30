import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import {
  CapacitorSQLite,
  SQLiteConnection,
  SQLiteDBConnection,
} from '@capacitor-community/sqlite';
import { PreferencesService } from './preferences.service';
import { BrowserLogService } from './browser-log.service';

export type StatusOverride = 'auto' | 'active' | 'paused' | 'completed';
export type ReminderFrequency =
  'none' | 'once' | 'daily' | 'weekly' | 'yearly' | 'weekdays' | 'custom';
export type ReminderIntervalUnit = 'week' | 'month' | 'year';
export type ReminderEndMode = 'never' | 'date' | 'count';

export interface ReminderRule {
  frequency: ReminderFrequency;
  time: string;
  date?: string;
  weekday?: number;
  month?: number;
  dayOfMonth?: number;
  interval?: number;
  intervalUnit?: ReminderIntervalUnit;
  weekdays?: number[];
  endMode?: ReminderEndMode;
  endDate?: string;
  occurrenceCount?: number;
}

export interface Goal {
  id: number;
  title: string;
  description: string;
  statusOverride: StatusOverride;
  sortOrder: number;
  createdAt: string;
  archivedAt: string | null;
  updatedAt: string;
}

export interface Step {
  id: number;
  goalId: number;
  title: string;
  description: string;
  statusOverride: StatusOverride;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: number;
  stepId: number;
  body: string;
  done: boolean;
  dueDate: string | null;
  reminderFrequency: ReminderFrequency;
  reminderTime: string | null;
  reminderWeekday: number | null;
  reminderRule: ReminderRule | null;
  notificationId: number | null;
  sortOrder: number;
  createdAt: string;
  completedAt: string | null;
  updatedAt: string;
}

export interface StepWithTasks extends Step {
  tasks: Task[];
  progress: ProgressStats;
}

export interface GoalWithSteps extends Goal {
  steps: StepWithTasks[];
  progress: ProgressStats;
}

export interface ProgressStats {
  totalTasks: number;
  completedTasks: number;
  percent: number;
  isComplete: boolean;
}

export interface GoalSummary extends GoalWithSteps {
  openTasks: number;
  overdueTasks: number;
  upcomingTasks: number;
}

interface LocalGoalStore {
  nextGoalId: number;
  nextStepId: number;
  nextTaskId: number;
  goals: Goal[];
  steps: Step[];
  tasks: Task[];
}

@Injectable({
  providedIn: 'root',
})
export class DatahandlerService {
  private readonly dbName = 'path_tracker';
  private readonly selectedGoalKey = 'selectedGoalId';
  private readonly localStoreKey = 'pathTrackerLocalStore';
  private readonly sqlite = new SQLiteConnection(CapacitorSQLite);
  private db: SQLiteDBConnection | undefined;
  private initPromise: Promise<void> | undefined;
  private webStorePromise: Promise<void> | undefined;
  private useLocalStore = false;

  constructor(
    private preferencesService: PreferencesService,
    private browserLog: BrowserLogService,
  ) {}

  async initialize(): Promise<void> {
    if (!this.initPromise) {
      this.browserLog.info('DatahandlerService.initialize start', { platform: Capacitor.getPlatform() });
      this.initPromise = this.openStorage().catch(error => {
        this.browserLog.error('DatahandlerService.initialize failed', error);
        this.initPromise = undefined;
        throw error;
      });
    }
    return this.initPromise;
  }

  async getGoals(includeArchived = false): Promise<Goal[]> {
    if (this.useLocalStore) {
      const store = await this.getLocalStore();
      return store.goals
        .filter(goal => includeArchived || !goal.archivedAt)
        .sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
    }

    const db = await this.getDb();
    const result = await db.query(
      `SELECT id, title, description, status_override, sort_order, created_at, archived_at, updated_at
       FROM goals
       WHERE ? = 1 OR archived_at IS NULL
       ORDER BY sort_order, id`,
      [includeArchived ? 1 : 0]
    );
    return (result.values ?? []).map(row => this.mapGoal(row));
  }

  async getSelectedGoalId(): Promise<number> {
    await this.initialize();
    const storedGoalId = await this.preferencesService.get<number>(this.selectedGoalKey);
    const goals = await this.getGoals();
    if (goals.length === 0) {
      await this.seedStarterGoal();
      return this.getSelectedGoalId();
    }
    const selectedGoal = goals.find(goal => goal.id === storedGoalId);
    if (selectedGoal) {
      return selectedGoal.id;
    }

    const firstGoalId = goals[0].id;
    await this.setSelectedGoalId(firstGoalId);
    return firstGoalId;
  }

  async setSelectedGoalId(goalId: number): Promise<void> {
    await this.preferencesService.set(this.selectedGoalKey, goalId);
  }

  async getGoalWithSteps(goalId: number, includeArchived = false): Promise<GoalWithSteps | undefined> {
    const goal = (await this.getGoals(includeArchived)).find(item => item.id === goalId);
    if (!goal) {
      return undefined;
    }

    const steps = await this.getStepsForGoal(goalId);
    const stepsWithTasks = await Promise.all(
      steps.map(async step => {
        const tasks = await this.getTasksForStep(step.id);
        return {
          ...step,
          tasks,
          progress: this.getProgress(tasks, step.statusOverride),
        };
      })
    );

    return {
      ...goal,
      steps: stepsWithTasks,
      progress: this.getProgress(
        stepsWithTasks.flatMap(step => step.tasks),
        goal.statusOverride
      ),
    };
  }

  async getGoalSummaries(): Promise<GoalSummary[]> {
    const goals = await this.getGoals(true);
    const summaries = await Promise.all(
      goals.map(async goal => {
        const goalWithSteps = await this.getGoalWithSteps(goal.id, true);
        if (!goalWithSteps) {
          throw new Error(`Goal ${goal.id} could not be loaded`);
        }

        const tasks = goalWithSteps.steps.flatMap(step => step.tasks);
        return {
          ...goalWithSteps,
          openTasks: tasks.filter(task => this.isMeaningfulTask(task) && !task.done).length,
          overdueTasks: 0,
          upcomingTasks: tasks.filter(task => this.hasReminder(task)).length,
        };
      })
    );
    return summaries;
  }

  async createGoal(title = 'New goal'): Promise<number> {
    if (this.useLocalStore) {
      const store = await this.getLocalStore();
      const now = this.now();
      const goalId = store.nextGoalId++;
      store.goals.push({
        id: goalId,
        title,
        description: '',
        statusOverride: 'auto',
        sortOrder: this.getNextLocalSortOrder(store.goals),
        createdAt: now,
        archivedAt: null,
        updatedAt: now,
      });
      await this.saveLocalStore(store);
      await this.createStep(goalId, 'First step');
      await this.setSelectedGoalId(goalId);
      return goalId;
    }

    const db = await this.getDb();
    const now = this.now();
    const sortOrder = await this.getNextSortOrder('goals', 'WHERE deleted_at IS NULL');
    const result = await db.run(
      `INSERT INTO goals (title, description, status_override, sort_order, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [title, '', 'auto', sortOrder, now, now]
    );
    const goalId = Number(result.changes?.lastId);
    await this.createStep(goalId, 'First step');
    await this.setSelectedGoalId(goalId);
    await this.persistWebStore();
    return goalId;
  }

  async updateGoal(goal: Pick<Goal, 'id' | 'title' | 'description' | 'statusOverride'>): Promise<void> {
    if (this.useLocalStore) {
      const store = await this.getLocalStore();
      const storedGoal = store.goals.find(item => item.id === goal.id);
      if (storedGoal) {
        storedGoal.title = goal.title;
        storedGoal.description = goal.description;
        storedGoal.statusOverride = goal.statusOverride;
        storedGoal.updatedAt = this.now();
        await this.saveLocalStore(store);
      }
      return;
    }

    const db = await this.getDb();
    await db.run(
      `UPDATE goals
       SET title = ?, description = ?, status_override = ?, updated_at = ?
      WHERE id = ?`,
      [goal.title, goal.description, goal.statusOverride, this.now(), goal.id]
    );
    await this.persistWebStore();
  }

  async archiveGoal(goalId: number): Promise<void> {
    const now = this.now();
    if (this.useLocalStore) {
      const store = await this.getLocalStore();
      const goal = store.goals.find(item => item.id === goalId);
      if (goal) {
        goal.archivedAt = now;
        goal.updatedAt = now;
        await this.saveLocalStore(store);
      }
      const remainingGoals = await this.getGoals();
      if (remainingGoals.length === 0) {
        await this.seedStarterGoal();
        return;
      }
      await this.setSelectedGoalId(remainingGoals[0].id);
      return;
    }

    const db = await this.getDb();
    await db.run(
      `UPDATE goals
       SET archived_at = ?, updated_at = ?
       WHERE id = ?`,
      [now, now, goalId]
    );
    await this.persistWebStore();
    const remainingGoals = await this.getGoals();
    if (remainingGoals.length === 0) {
      await this.seedStarterGoal();
      return;
    }
    await this.setSelectedGoalId(remainingGoals[0].id);
  }

  async deleteGoal(goalId: number): Promise<void> {
    if (this.useLocalStore) {
      const store = await this.getLocalStore();
      const stepIds = store.steps.filter(step => step.goalId === goalId).map(step => step.id);
      store.goals = store.goals.filter(goal => goal.id !== goalId);
      store.steps = store.steps.filter(step => step.goalId !== goalId);
      store.tasks = store.tasks.filter(task => !stepIds.includes(task.stepId));
      await this.saveLocalStore(store);
      const remainingGoals = await this.getGoals();
      if (remainingGoals.length === 0) {
        await this.seedStarterGoal();
        return;
      }
      await this.setSelectedGoalId(remainingGoals[0].id);
      return;
    }

    const db = await this.getDb();
    await db.run('DELETE FROM goals WHERE id = ?', [goalId]);
    await this.persistWebStore();
    const remainingGoals = await this.getGoals();
    if (remainingGoals.length === 0) {
      await this.seedStarterGoal();
      return;
    }
    await this.setSelectedGoalId(remainingGoals[0].id);
  }

  async createStep(goalId: number, title = 'New step'): Promise<number> {
    if (this.useLocalStore) {
      const store = await this.getLocalStore();
      const now = this.now();
      const stepId = store.nextStepId++;
      store.steps.push({
        id: stepId,
        goalId,
        title,
        description: '',
        statusOverride: 'auto',
        sortOrder: this.getNextLocalSortOrder(store.steps.filter(step => step.goalId === goalId)),
        createdAt: now,
        updatedAt: now,
      });
      await this.saveLocalStore(store);
      await this.createTask(stepId, 'Describe the next concrete action.');
      return stepId;
    }

    const db = await this.getDb();
    const now = this.now();
    const sortOrder = await this.getNextSortOrder('steps', 'WHERE goal_id = ?', [goalId]);
    const result = await db.run(
      `INSERT INTO steps (goal_id, title, description, status_override, sort_order, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [goalId, title, '', 'auto', sortOrder, now, now]
    );
    await this.persistWebStore();
    const stepId = Number(result.changes?.lastId);
    await this.createTask(stepId, 'Describe the next concrete action.');
    return stepId;
  }

  async updateStep(step: Pick<Step, 'id' | 'title' | 'description' | 'statusOverride'>): Promise<void> {
    if (this.useLocalStore) {
      const store = await this.getLocalStore();
      const storedStep = store.steps.find(item => item.id === step.id);
      if (storedStep) {
        storedStep.title = step.title;
        storedStep.description = step.description;
        storedStep.statusOverride = step.statusOverride;
        storedStep.updatedAt = this.now();
        await this.saveLocalStore(store);
      }
      return;
    }

    const db = await this.getDb();
    await db.run(
      `UPDATE steps
       SET title = ?, description = ?, status_override = ?, updated_at = ?
      WHERE id = ?`,
      [step.title, step.description, step.statusOverride, this.now(), step.id]
    );
    await this.persistWebStore();
  }

  async deleteStep(stepId: number): Promise<void> {
    if (this.useLocalStore) {
      const store = await this.getLocalStore();
      store.steps = store.steps.filter(step => step.id !== stepId);
      store.tasks = store.tasks.filter(task => task.stepId !== stepId);
      await this.saveLocalStore(store);
      return;
    }

    const db = await this.getDb();
    await db.run('DELETE FROM steps WHERE id = ?', [stepId]);
    await this.persistWebStore();
  }

  async createTask(stepId: number, body = ''): Promise<number> {
    if (this.useLocalStore) {
      const store = await this.getLocalStore();
      const now = this.now();
      const taskId = store.nextTaskId++;
      store.tasks.push({
        id: taskId,
        stepId,
        body,
        done: false,
        dueDate: null,
        reminderFrequency: 'none',
        reminderTime: null,
        reminderWeekday: null,
        reminderRule: null,
        notificationId: this.getNotificationId(taskId),
        sortOrder: this.getNextLocalSortOrder(store.tasks.filter(task => task.stepId === stepId)),
        createdAt: now,
        completedAt: null,
        updatedAt: now,
      });
      await this.saveLocalStore(store);
      return taskId;
    }

    const db = await this.getDb();
    const now = this.now();
    const sortOrder = await this.getNextSortOrder('tasks', 'WHERE step_id = ?', [stepId]);
    const result = await db.run(
      `INSERT INTO tasks (step_id, body, done, due_date, reminder_frequency, reminder_time, reminder_weekday, reminder_rule, notification_id, sort_order, created_at, completed_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [stepId, body, 0, null, 'none', null, null, null, null, sortOrder, now, null, now]
    );
    await this.persistWebStore();
    return Number(result.changes?.lastId);
  }

  async updateTask(task: Pick<Task, 'id' | 'body' | 'done' | 'dueDate' | 'reminderFrequency' | 'reminderTime' | 'reminderWeekday' | 'reminderRule' | 'notificationId'>): Promise<void> {
    if (this.useLocalStore) {
      const store = await this.getLocalStore();
      const storedTask = store.tasks.find(item => item.id === task.id);
      if (storedTask) {
        const wasDone = storedTask.done;
        storedTask.body = task.body;
        storedTask.done = task.done;
        storedTask.dueDate = task.dueDate;
        storedTask.reminderFrequency = task.reminderFrequency;
        storedTask.reminderTime = task.reminderTime;
        storedTask.reminderWeekday = task.reminderWeekday;
        storedTask.reminderRule = task.reminderRule;
        storedTask.notificationId = task.notificationId;
        if (task.done && !wasDone) {
          storedTask.completedAt = this.today();
        } else if (!task.done) {
          storedTask.completedAt = null;
        }
        storedTask.updatedAt = this.now();
        await this.saveLocalStore(store);
      }
      return;
    }

    const db = await this.getDb();
    const existing = await db.query('SELECT done, completed_at FROM tasks WHERE id = ?', [task.id]);
    const existingTask = existing.values?.[0];
    const wasDone = Number(existingTask?.done ?? 0) === 1;
    const currentCompletedAt = existingTask?.completed_at ? String(existingTask.completed_at) : null;
    const completedAt = task.done ? (wasDone ? currentCompletedAt : this.today()) : null;
    await db.run(
      `UPDATE tasks
       SET body = ?, done = ?, due_date = ?, reminder_frequency = ?, reminder_time = ?, reminder_weekday = ?, reminder_rule = ?, notification_id = ?, completed_at = ?, updated_at = ?
      WHERE id = ?`,
      [
        task.body,
        task.done ? 1 : 0,
        task.dueDate,
        task.reminderFrequency,
        task.reminderTime,
        task.reminderWeekday,
        this.stringifyReminderRule(task.reminderRule),
        task.notificationId,
        completedAt,
        this.now(),
        task.id,
      ]
    );
    await this.persistWebStore();
  }

  async deleteTask(taskId: number): Promise<void> {
    if (this.useLocalStore) {
      const store = await this.getLocalStore();
      store.tasks = store.tasks.filter(task => task.id !== taskId);
      await this.saveLocalStore(store);
      return;
    }

    const db = await this.getDb();
    await db.run('DELETE FROM tasks WHERE id = ?', [taskId]);
    await this.persistWebStore();
  }

  getProgress(tasks: Task[], statusOverride: StatusOverride = 'auto'): ProgressStats {
    const meaningfulTasks = tasks.filter(task => this.isMeaningfulTask(task));
    const totalTasks = meaningfulTasks.length;
    const completedTasks = meaningfulTasks.filter(task => task.done).length;
    const computedPercent = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
    const isComplete = statusOverride === 'completed' || (totalTasks > 0 && completedTasks === totalTasks);

    return {
      totalTasks,
      completedTasks,
      percent: statusOverride === 'completed' ? 100 : computedPercent,
      isComplete,
    };
  }

  private async openStorage(): Promise<void> {
    if (Capacitor.getPlatform() === 'web') {
      this.useLocalStore = true;
      await this.ensureLocalStarterData();
      this.browserLog.info('DatahandlerService local web store ready');
      return;
    }

    await this.openDatabase();
  }

  private async openDatabase(): Promise<void> {
    await this.prepareWebStore();
    const hasConnection = (await this.sqlite.isConnection(this.dbName, false)).result;
    this.db = hasConnection
      ? await this.sqlite.retrieveConnection(this.dbName, false)
      : await this.sqlite.createConnection(this.dbName, false, 'no-encryption', 1, false);
    await this.db.open();
    await this.createSchema();
    await this.ensureStarterData();
    await this.persistWebStore();
    this.browserLog.info('DatahandlerService.openDatabase complete', { platform: Capacitor.getPlatform() });
  }

  private async getDb(): Promise<SQLiteDBConnection> {
    await this.initialize();
    if (!this.db) {
      throw new Error('Database is not initialized');
    }
    return this.db;
  }

  private async prepareWebStore(): Promise<void> {
    if (Capacitor.getPlatform() !== 'web') {
      return;
    }

    if (!this.webStorePromise) {
      this.webStorePromise = this.initializeWebStore().catch(error => {
        this.webStorePromise = undefined;
        throw error;
      });
    }
    await this.webStorePromise;
  }

  private async persistWebStore(): Promise<void> {
    if (Capacitor.getPlatform() === 'web') {
      await this.sqlite.saveToStore(this.dbName);
    }
  }

  private async initializeWebStore(): Promise<void> {
    this.browserLog.info('SQLite web store initialization start');
    let jeepSqlite = document.querySelector('jeep-sqlite') as (HTMLElement & {
      componentOnReady?: () => Promise<unknown>;
      isStoreOpen?: () => Promise<boolean>;
    }) | null;
    if (!jeepSqlite) {
      jeepSqlite = document.createElement('jeep-sqlite');
      jeepSqlite.setAttribute('autoSave', 'true');
      jeepSqlite.setAttribute('wasmPath', '/assets');
      document.body.prepend(jeepSqlite);
    }

    await customElements.whenDefined('jeep-sqlite');
    customElements.upgrade(jeepSqlite);
    await jeepSqlite.componentOnReady?.();
    await this.waitForJeepStore(jeepSqlite);
    await this.sqlite.initWebStore();
    this.browserLog.info('SQLite web store initialization complete');
  }

  private async waitForJeepStore(jeepSqlite: { isStoreOpen?: () => Promise<boolean> }): Promise<void> {
    const timeoutMs = 5000;
    const startedAt = Date.now();

    while (Date.now() - startedAt < timeoutMs) {
      const isOpen = await jeepSqlite.isStoreOpen?.();
      if (isOpen) {
        return;
      }
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    throw new Error('SQLite web store did not open within 5 seconds');
  }

  private async createSchema(): Promise<void> {
    const db = await this.getOpenDb();
    await db.execute(`
      PRAGMA foreign_keys = ON;

      CREATE TABLE IF NOT EXISTS goals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        status_override TEXT NOT NULL DEFAULT 'auto',
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        archived_at TEXT,
        updated_at TEXT NOT NULL,
        deleted_at TEXT
      );

      CREATE TABLE IF NOT EXISTS steps (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        goal_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        status_override TEXT NOT NULL DEFAULT 'auto',
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        deleted_at TEXT,
        FOREIGN KEY(goal_id) REFERENCES goals(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        step_id INTEGER NOT NULL,
        body TEXT NOT NULL,
        done INTEGER NOT NULL DEFAULT 0,
        due_date TEXT,
        reminder_frequency TEXT NOT NULL DEFAULT 'none',
        reminder_time TEXT,
        reminder_weekday INTEGER,
        reminder_rule TEXT,
        notification_id INTEGER,
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        completed_at TEXT,
        updated_at TEXT NOT NULL,
        deleted_at TEXT,
        FOREIGN KEY(step_id) REFERENCES steps(id) ON DELETE CASCADE
      );
    `);
    await this.ensureGoalArchiveColumns(db);
    await this.ensureTaskReminderColumns(db);
  }

  private async ensureGoalArchiveColumns(db: SQLiteDBConnection): Promise<void> {
    const result = await db.query('PRAGMA table_info(goals)');
    const columns = new Set((result.values ?? []).map(row => String(row.name)));
    if (!columns.has('archived_at')) {
      await db.execute('ALTER TABLE goals ADD COLUMN archived_at TEXT');
    }
  }

  private async ensureTaskReminderColumns(db: SQLiteDBConnection): Promise<void> {
    const result = await db.query('PRAGMA table_info(tasks)');
    const columns = new Set((result.values ?? []).map(row => String(row.name)));
    const additions = [
      { name: 'reminder_frequency', sql: "ALTER TABLE tasks ADD COLUMN reminder_frequency TEXT NOT NULL DEFAULT 'none'" },
      { name: 'reminder_time', sql: 'ALTER TABLE tasks ADD COLUMN reminder_time TEXT' },
      { name: 'reminder_weekday', sql: 'ALTER TABLE tasks ADD COLUMN reminder_weekday INTEGER' },
      { name: 'reminder_rule', sql: 'ALTER TABLE tasks ADD COLUMN reminder_rule TEXT' },
      { name: 'notification_id', sql: 'ALTER TABLE tasks ADD COLUMN notification_id INTEGER' },
      { name: 'completed_at', sql: 'ALTER TABLE tasks ADD COLUMN completed_at TEXT' },
    ];

    for (const addition of additions) {
      if (!columns.has(addition.name)) {
        await db.execute(addition.sql);
      }
    }
  }

  private async ensureStarterData(): Promise<void> {
    const db = await this.getOpenDb();
    const result = await db.query('SELECT COUNT(*) AS count FROM goals');
    const count = Number(result.values?.[0]?.count ?? 0);
    if (count === 0) {
      await this.seedStarterGoal();
    }
  }

  private async seedStarterGoal(): Promise<void> {
    if (this.useLocalStore) {
      await this.seedLocalStarterGoal();
      return;
    }

    const db = await this.getOpenDb();
    const now = this.now();
    const goalResult = await db.run(
      `INSERT INTO goals (title, description, status_override, sort_order, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        'Build my path',
        '',
        'auto',
        1,
        now,
        now,
      ]
    );
    const goalId = Number(goalResult.changes?.lastId);

    const stepTitles = ['Clarify the direction', 'Make progress concrete', 'Review and adjust'];
    for (let i = 0; i < stepTitles.length; i++) {
      const stepResult = await db.run(
        `INSERT INTO steps (goal_id, title, description, status_override, sort_order, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [goalId, stepTitles[i], '', 'auto', i + 1, now, now]
      );
      const stepId = Number(stepResult.changes?.lastId);
      await db.run(
        `INSERT INTO tasks (step_id, body, done, due_date, sort_order, created_at, completed_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [stepId, 'Write one concrete action for this step.', 0, null, 1, now, null, now]
      );
    }

    await this.setSelectedGoalId(goalId);
    await this.persistWebStore();
  }

  private async getStepsForGoal(goalId: number): Promise<Step[]> {
    if (this.useLocalStore) {
      const store = await this.getLocalStore();
      return store.steps
        .filter(step => step.goalId === goalId)
        .sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
    }

    const db = await this.getDb();
    const result = await db.query(
      `SELECT id, goal_id, title, description, status_override, sort_order, created_at, updated_at
       FROM steps
       WHERE goal_id = ?
       ORDER BY sort_order, id`,
      [goalId]
    );
    return (result.values ?? []).map(row => this.mapStep(row));
  }

  private async getTasksForStep(stepId: number): Promise<Task[]> {
    if (this.useLocalStore) {
      const store = await this.getLocalStore();
      return store.tasks
        .filter(task => task.stepId === stepId)
        .sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
    }

    const db = await this.getDb();
    const result = await db.query(
      `SELECT id, step_id, body, done, due_date, reminder_frequency, reminder_time, reminder_weekday, reminder_rule, notification_id, sort_order, created_at, completed_at, updated_at
       FROM tasks
       WHERE step_id = ?
       ORDER BY sort_order, id`,
      [stepId]
    );
    return (result.values ?? []).map(row => this.mapTask(row));
  }

  private async getNextSortOrder(table: string, whereClause: string, values: unknown[] = []): Promise<number> {
    const db = await this.getDb();
    const result = await db.query(`SELECT COALESCE(MAX(sort_order), 0) + 1 AS nextOrder FROM ${table} ${whereClause}`, values);
    return Number(result.values?.[0]?.nextOrder ?? 1);
  }

  private getOpenDb(): SQLiteDBConnection {
    if (!this.db) {
      throw new Error('Database connection has not been opened');
    }
    return this.db;
  }

  private async ensureLocalStarterData(): Promise<void> {
    const store = await this.getLocalStore();
    if (store.goals.length === 0) {
      await this.seedLocalStarterGoal(store);
    }
  }

  private async seedLocalStarterGoal(existingStore?: LocalGoalStore): Promise<void> {
    const store = existingStore ?? await this.getLocalStore();
    const now = this.now();
    const goalId = store.nextGoalId++;
    store.goals.push({
      id: goalId,
      title: 'Build my path',
      description: '',
      statusOverride: 'auto',
      sortOrder: this.getNextLocalSortOrder(store.goals),
      createdAt: now,
      archivedAt: null,
      updatedAt: now,
    });

    const stepTitles = ['Clarify the direction', 'Make progress concrete', 'Review and adjust'];
    for (let i = 0; i < stepTitles.length; i++) {
      const stepId = store.nextStepId++;
      store.steps.push({
        id: stepId,
        goalId,
        title: stepTitles[i],
        description: '',
        statusOverride: 'auto',
        sortOrder: i + 1,
        createdAt: now,
        updatedAt: now,
      });
      const taskId = store.nextTaskId++;
      store.tasks.push({
        id: taskId,
        stepId,
        body: 'Write one concrete action for this step.',
        done: false,
        dueDate: null,
        reminderFrequency: 'none',
        reminderTime: null,
        reminderWeekday: null,
        reminderRule: null,
        notificationId: this.getNotificationId(taskId),
        sortOrder: 1,
        createdAt: now,
        completedAt: null,
        updatedAt: now,
      });
    }

    await this.saveLocalStore(store);
    await this.setSelectedGoalId(goalId);
  }

  private async getLocalStore(): Promise<LocalGoalStore> {
    const stored = await this.preferencesService.get<LocalGoalStore>(this.localStoreKey);
    const store = stored ?? {
      nextGoalId: 1,
      nextStepId: 1,
      nextTaskId: 1,
      goals: [],
      steps: [],
      tasks: [],
    };
    store.goals = store.goals.map(goal => this.normalizeLocalGoal(goal));
    store.tasks = store.tasks.map(task => this.normalizeLocalTask(task));
    return store;
  }

  private async saveLocalStore(store: LocalGoalStore): Promise<void> {
    await this.preferencesService.set(this.localStoreKey, store);
  }

  private getNextLocalSortOrder(items: Array<{ sortOrder: number }>): number {
    return Math.max(0, ...items.map(item => item.sortOrder)) + 1;
  }

  private normalizeLocalGoal(goal: Partial<Goal> & Pick<Goal, 'id' | 'title' | 'description' | 'statusOverride' | 'sortOrder' | 'createdAt' | 'updatedAt'>): Goal {
    return {
      ...goal,
      statusOverride: this.mapStatus(goal.statusOverride),
      archivedAt: goal.archivedAt ?? null,
    };
  }

  private mapGoal(row: any): Goal {
    return {
      id: Number(row.id),
      title: String(row.title),
      description: String(row.description ?? ''),
      statusOverride: this.mapStatus(row.status_override),
      sortOrder: Number(row.sort_order),
      createdAt: String(row.created_at),
      archivedAt: row.archived_at ? String(row.archived_at) : null,
      updatedAt: String(row.updated_at),
    };
  }

  private mapStep(row: any): Step {
    return {
      id: Number(row.id),
      goalId: Number(row.goal_id),
      title: String(row.title),
      description: String(row.description ?? ''),
      statusOverride: this.mapStatus(row.status_override),
      sortOrder: Number(row.sort_order),
      createdAt: String(row.created_at),
      updatedAt: String(row.updated_at),
    };
  }

  private mapTask(row: any): Task {
    return {
      id: Number(row.id),
      stepId: Number(row.step_id),
      body: String(row.body),
      done: Number(row.done) === 1,
      dueDate: row.due_date ? String(row.due_date) : null,
      reminderFrequency: this.mapReminderFrequency(row.reminder_frequency),
      reminderTime: row.reminder_time ? String(row.reminder_time) : null,
      reminderWeekday: row.reminder_weekday ? Number(row.reminder_weekday) : null,
      reminderRule: this.parseReminderRule(row.reminder_rule),
      notificationId: row.notification_id ? Number(row.notification_id) : this.getNotificationId(Number(row.id)),
      sortOrder: Number(row.sort_order),
      createdAt: String(row.created_at),
      completedAt: row.completed_at ? String(row.completed_at) : null,
      updatedAt: String(row.updated_at),
    };
  }

  private normalizeLocalTask(task: Partial<Task> & Pick<Task, 'id' | 'stepId' | 'body' | 'done' | 'sortOrder' | 'createdAt' | 'updatedAt'>): Task {
    return {
      ...task,
      dueDate: task.dueDate ?? null,
      reminderFrequency: this.mapReminderFrequency(task.reminderFrequency),
      reminderTime: task.reminderTime ?? null,
      reminderWeekday: task.reminderWeekday ?? null,
      reminderRule: this.normalizeReminderRule(task.reminderRule ?? null),
      notificationId: task.notificationId ?? this.getNotificationId(task.id),
      completedAt: task.completedAt ?? null,
    };
  }

  private mapStatus(value: unknown): StatusOverride {
    return value === 'active' || value === 'paused' || value === 'completed' ? value : 'auto';
  }

  private isOverdue(task: Task): boolean {
    if (!task.dueDate || task.done) {
      return false;
    }
    return task.dueDate < this.today();
  }

  private isUpcoming(task: Task): boolean {
    if (!task.dueDate || task.done || this.isOverdue(task)) {
      return false;
    }
    return task.dueDate >= this.today();
  }

  private hasReminder(task: Task): boolean {
    return task.reminderFrequency !== 'none' && (!!task.reminderTime || !!task.reminderRule);
  }

  private isMeaningfulTask(task: Task): boolean {
    return task.body.trim() !== '';
  }

  private mapReminderFrequency(value: unknown): ReminderFrequency {
    const allowed: ReminderFrequency[] = [
      'none',
      'once',
      'daily',
      'weekly',
      'yearly',
      'weekdays',
      'custom',
    ];
    return allowed.includes(value as ReminderFrequency) ? value as ReminderFrequency : 'none';
  }

  private parseReminderRule(value: unknown): ReminderRule | null {
    if (!value) {
      return null;
    }

    try {
      return this.normalizeReminderRule(JSON.parse(String(value)));
    } catch {
      return null;
    }
  }

  private stringifyReminderRule(rule: ReminderRule | null): string | null {
    const normalized = this.normalizeReminderRule(rule);
    return normalized ? JSON.stringify(normalized) : null;
  }

  private normalizeReminderRule(rule: Partial<ReminderRule> | null): ReminderRule | null {
    if (!rule || !rule.time) {
      return null;
    }

    const frequency = this.mapReminderFrequency(rule.frequency);
    if (frequency === 'none') {
      return null;
    }

    const normalized: ReminderRule = {
      frequency,
      time: String(rule.time),
      endMode: this.mapReminderEndMode(rule.endMode),
    };
    if (rule.date) normalized.date = String(rule.date);
    if (rule.weekday) normalized.weekday = Number(rule.weekday);
    if (rule.month) normalized.month = Number(rule.month);
    if (rule.dayOfMonth) normalized.dayOfMonth = Number(rule.dayOfMonth);
    if (rule.interval) normalized.interval = Math.max(1, Number(rule.interval));
    if (this.isReminderIntervalUnit(rule.intervalUnit)) normalized.intervalUnit = rule.intervalUnit;
    if (Array.isArray(rule.weekdays)) normalized.weekdays = rule.weekdays.map(Number).filter(day => day >= 1 && day <= 7);
    if (rule.endDate) normalized.endDate = String(rule.endDate);
    if (rule.occurrenceCount) normalized.occurrenceCount = Math.max(1, Number(rule.occurrenceCount));
    return normalized;
  }

  private mapReminderEndMode(value: unknown): ReminderEndMode {
    return value === 'date' || value === 'count' ? value : 'never';
  }

  private isReminderIntervalUnit(value: unknown): value is ReminderIntervalUnit {
    return value === 'week' || value === 'month' || value === 'year';
  }

  private getNotificationId(taskId: number): number {
    return 100000 + taskId;
  }

  private now(): string {
    return new Date().toISOString();
  }

  private today(): string {
    return new Date().toISOString().slice(0, 10);
  }
}
