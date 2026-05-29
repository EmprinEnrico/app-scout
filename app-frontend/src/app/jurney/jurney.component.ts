import { CommonModule } from '@angular/common';
import { TextFieldModule } from '@angular/cdk/text-field';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { AlertController, ToastController } from '@ionic/angular/standalone';
import {
  DatahandlerService,
  Goal,
  GoalWithSteps,
  ReminderEndMode,
  ReminderIntervalUnit,
  ReminderRule,
  StepWithTasks,
  Task,
} from '../services/datahandler.service';
import { BrowserLogService } from '../services/browser-log.service';
import { ReminderNotificationService } from '../services/reminder-notification.service';

type ReminderPreset =
  'none'
  | 'once'
  | 'daily'
  | 'weekly'
  | 'yearly-may-29'
  | 'weekdays'
  | 'custom';

@Component({
  selector: 'app-jurney',
  standalone: true,
  imports: [
    CommonModule,
    TextFieldModule,
    FormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatDividerModule,
    MatIconModule,
    MatProgressBarModule,
  ],
  templateUrl: './jurney.component.html',
  styleUrl: './jurney.component.less',
})
export class JurneyComponent implements OnInit {
  goals: Goal[] = [];
  selectedGoal: GoalWithSteps | undefined;
  loading = true;
  errorMessage = '';
  private readonly collapsedStepIds = new Set<number>();

  constructor(
    private datahandler: DatahandlerService,
    private browserLog: BrowserLogService,
    private alertController: AlertController,
    private toastController: ToastController,
    private reminderNotifications: ReminderNotificationService,
  ) {}

  async ngOnInit(): Promise<void> {
    await this.load();
  }

  async load(goalId?: number): Promise<void> {
    try {
      this.loading = true;
      this.errorMessage = '';
      this.browserLog.info('Journey load start', { goalId });
      await this.datahandler.initialize();
      this.goals = await this.datahandler.getGoals();
      const selectedGoalId = goalId ?? await this.datahandler.getSelectedGoalId();
      await this.selectGoal(selectedGoalId, false);
      this.browserLog.info('Journey load complete', { goals: this.goals.length, selectedGoalId });
    } catch (error) {
      this.browserLog.error('Journey load failed', error);
      this.errorMessage = this.toErrorMessage('Unable to load goals', error);
    } finally {
      this.loading = false;
    }
  }

  async selectGoal(goalId: number, persist = true): Promise<void> {
    try {
      if (persist) {
        await this.datahandler.setSelectedGoalId(goalId);
      }
      this.selectedGoal = await this.datahandler.getGoalWithSteps(goalId);
      await this.ensureEditableTaskRows();
    } catch (error) {
      this.browserLog.error('Journey select goal failed', { goalId, error });
      this.errorMessage = this.toErrorMessage('Unable to select goal', error);
    }
  }

  async addGoal(): Promise<void> {
    try {
      const goalId = await this.datahandler.createGoal();
      this.browserLog.info('Journey goal created', { goalId });
      await this.load(goalId);
      await this.showToast('Goal created');
    } catch (error) {
      this.browserLog.error('Journey create goal failed', error);
      this.errorMessage = this.toErrorMessage('Unable to create goal', error);
      await this.showToast('Unable to create goal', 'danger');
    }
  }

  async saveGoal(): Promise<void> {
    if (!this.selectedGoal) {
      return;
    }
    try {
      await this.datahandler.updateGoal(this.selectedGoal);
      this.browserLog.info('Journey goal saved', { goalId: this.selectedGoal.id });
      this.goals = this.goals.map(goal => goal.id === this.selectedGoal?.id
        ? { ...goal, title: this.selectedGoal.title, description: this.selectedGoal.description, statusOverride: this.selectedGoal.statusOverride }
        : goal
      );
    } catch (error) {
      this.browserLog.error('Journey save goal failed', error);
      this.errorMessage = this.toErrorMessage('Unable to save goal', error);
    }
  }

  async deleteGoal(): Promise<void> {
    if (!this.selectedGoal) {
      return;
    }
    const shouldDelete = await this.confirmDelete(
      'Delete goal',
      `Delete "${this.selectedGoal.title}" and all of its steps and tasks?`
    );
    if (!shouldDelete) {
      return;
    }
    try {
      await this.datahandler.deleteGoal(this.selectedGoal.id);
      this.browserLog.info('Journey goal deleted', { goalId: this.selectedGoal.id });
      await this.load();
      await this.showToast('Goal deleted');
    } catch (error) {
      this.browserLog.error('Journey delete goal failed', error);
      this.errorMessage = this.toErrorMessage('Unable to delete goal', error);
      await this.showToast('Unable to delete goal', 'danger');
    }
  }

  async addStep(): Promise<void> {
    if (!this.selectedGoal) {
      return;
    }
    try {
      const stepId = await this.datahandler.createStep(this.selectedGoal.id);
      this.browserLog.info('Journey step created', { goalId: this.selectedGoal.id, stepId });
      await this.refreshSelectedGoal();
      await this.showToast('Step added');
    } catch (error) {
      this.browserLog.error('Journey create step failed', error);
      this.errorMessage = this.toErrorMessage('Unable to create step', error);
      await this.showToast('Unable to create step', 'danger');
    }
  }

  async saveStep(step: StepWithTasks): Promise<void> {
    try {
      await this.datahandler.updateStep(step);
      this.browserLog.info('Journey step saved', { stepId: step.id });
      this.recalculateProgress();
    } catch (error) {
      this.browserLog.error('Journey save step failed', error);
      this.errorMessage = this.toErrorMessage('Unable to save step', error);
    }
  }

  async deleteStep(step: StepWithTasks): Promise<void> {
    if (!this.selectedGoal) {
      return;
    }
    const shouldDelete = await this.confirmDelete(
      'Delete step',
      `Delete "${step.title}" and all of its tasks?`
    );
    if (!shouldDelete) {
      return;
    }
    try {
      await this.datahandler.deleteStep(step.id);
      this.browserLog.info('Journey step deleted', { stepId: step.id });
      await this.refreshSelectedGoal();
      await this.showToast('Step deleted');
    } catch (error) {
      this.browserLog.error('Journey delete step failed', error);
      this.errorMessage = this.toErrorMessage('Unable to delete step', error);
      await this.showToast('Unable to delete step', 'danger');
    }
  }

  async addTask(step: StepWithTasks): Promise<void> {
    try {
      const taskId = await this.datahandler.createTask(step.id);
      this.browserLog.info('Journey task created', { stepId: step.id, taskId });
      await this.refreshSelectedGoal();
      await this.showToast('Task added');
    } catch (error) {
      this.browserLog.error('Journey create task failed', error);
      this.errorMessage = this.toErrorMessage('Unable to create task', error);
      await this.showToast('Unable to create task', 'danger');
    }
  }

  async saveTask(task: Task): Promise<void> {
    try {
      await this.datahandler.updateTask(task);
      this.browserLog.info('Journey task saved', { taskId: task.id, done: task.done });
      this.recalculateProgress();
    } catch (error) {
      this.browserLog.error('Journey save task failed', error);
      this.errorMessage = this.toErrorMessage('Unable to save task', error);
    }
  }

  async handleTaskBlur(step: StepWithTasks, task: Task): Promise<void> {
    if (task.body.trim() === '') {
      await this.removeEmptyTaskIfPossible(step, task);
      return;
    }

    await this.saveTask(task);
    await this.ensureStepHasEmptyTask(step);
  }

  async deleteTask(task: Task): Promise<void> {
    const shouldDelete = await this.confirmDelete('Delete task', 'Delete this task?');
    if (!shouldDelete) {
      return;
    }
    try {
      await this.datahandler.deleteTask(task.id);
      this.browserLog.info('Journey task deleted', { taskId: task.id });
      await this.refreshSelectedGoal();
      await this.showToast('Task deleted');
    } catch (error) {
      this.browserLog.error('Journey delete task failed', error);
      this.errorMessage = this.toErrorMessage('Unable to delete task', error);
      await this.showToast('Unable to delete task', 'danger');
    }
  }

  async configureReminder(task: Task): Promise<void> {
    const preset = await this.askReminderPreset(task);
    if (!preset) {
      return;
    }

    if (preset === 'none') {
      await this.reminderNotifications.cancelTaskReminder(task);
      task.reminderFrequency = 'none';
      task.reminderTime = null;
      task.reminderWeekday = null;
      task.reminderRule = null;
      task.dueDate = null;
      await this.saveTask(task);
      await this.showToast('Reminder removed');
      return;
    }

    const rule = await this.buildReminderRule(preset, task);
    if (!rule) {
      return;
    }

    task.reminderFrequency = rule.frequency;
    task.reminderTime = rule.time;
    task.reminderWeekday = rule.weekday ?? rule.weekdays?.[0] ?? null;
    task.reminderRule = rule;
    task.notificationId = task.notificationId ?? this.getNotificationId(task.id);
    task.dueDate = null;

    await this.saveTask(task);
    const result = await this.reminderNotifications.scheduleTaskReminder(task);
    if (result === 'scheduled') {
      await this.showToast('Reminder scheduled');
    } else if (result === 'denied') {
      await this.showToast('Notifications are disabled', 'danger');
    } else {
      await this.showToast('Reminder saved for mobile notifications');
    }
  }

  async toggleTask(task: Task): Promise<void> {
    task.done = !task.done;
    await this.saveTask(task);
  }

  isStepCollapsed(step: StepWithTasks): boolean {
    return this.collapsedStepIds.has(step.id);
  }

  toggleStepCollapsed(step: StepWithTasks): void {
    if (this.collapsedStepIds.has(step.id)) {
      this.collapsedStepIds.delete(step.id);
      return;
    }
    this.collapsedStepIds.add(step.id);
  }

  async refreshSelectedGoal(): Promise<void> {
    if (!this.selectedGoal) {
      return;
    }
    await this.selectGoal(this.selectedGoal.id, false);
    this.goals = await this.datahandler.getGoals();
  }

  recalculateProgress(): void {
    if (!this.selectedGoal) {
      return;
    }

    this.selectedGoal.steps = this.selectedGoal.steps.map(step => ({
      ...step,
      progress: this.datahandler.getProgress(step.tasks, step.statusOverride),
    }));
    this.selectedGoal.progress = this.datahandler.getProgress(
      this.selectedGoal.steps.flatMap(step => step.tasks),
      this.selectedGoal.statusOverride
    );
  }

  private async ensureEditableTaskRows(): Promise<void> {
    if (!this.selectedGoal) {
      return;
    }

    let changed = false;
    for (const step of this.selectedGoal.steps) {
      const emptyTasks = step.tasks.filter(task => task.body.trim() === '');
      if (emptyTasks.length === 0) {
        await this.datahandler.createTask(step.id);
        changed = true;
        continue;
      }

      const removableEmptyTasks = emptyTasks.slice(0, -1);
      for (const task of removableEmptyTasks) {
        await this.reminderNotifications.cancelTaskReminder(task);
        await this.datahandler.deleteTask(task.id);
        changed = true;
      }
    }

    if (changed) {
      this.selectedGoal = await this.datahandler.getGoalWithSteps(this.selectedGoal.id);
      this.recalculateProgress();
    }
  }

  private async ensureStepHasEmptyTask(step: StepWithTasks): Promise<void> {
    if (step.tasks.some(task => task.body.trim() === '')) {
      return;
    }

    await this.datahandler.createTask(step.id);
    await this.refreshSelectedGoal();
  }

  private async removeEmptyTaskIfPossible(step: StepWithTasks, task: Task): Promise<void> {
    const stepTasks = step.tasks.filter(item => item.stepId === step.id);
    if (stepTasks.length <= 1) {
      await this.saveTask(task);
      return;
    }

    await this.reminderNotifications.cancelTaskReminder(task);
    await this.datahandler.deleteTask(task.id);
    this.browserLog.info('Journey empty task removed', { taskId: task.id, stepId: step.id });
    await this.refreshSelectedGoal();
  }

  private toErrorMessage(prefix: string, error: unknown): string {
    const message = error instanceof Error ? error.message : String(error);
    return `${prefix}: ${message}`;
  }

  private async confirmDelete(header: string, message: string): Promise<boolean> {
    let confirmed = false;
    const alert = await this.alertController.create({
      header,
      message,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: 'Delete',
          role: 'destructive',
          handler: () => {
            confirmed = true;
          },
        },
      ],
    });

    await alert.present();
    await alert.onDidDismiss();
    return confirmed;
  }

  private async showToast(message: string, color: 'success' | 'danger' = 'success'): Promise<void> {
    const toast = await this.toastController.create({
      message,
      color,
      duration: 1600,
      position: 'bottom',
    });
    await toast.present();
  }

  private async askReminderPreset(task: Task): Promise<ReminderPreset | undefined> {
    const current = this.currentReminderPreset(task);
    let value: ReminderPreset | undefined;
    const alert = await this.alertController.create({
      header: 'Reminder',
      inputs: [
        { label: 'Non si ripete', type: 'radio', value: 'once', checked: current === 'once' },
        { label: 'Ogni giorno', type: 'radio', value: 'daily', checked: current === 'daily' },
        { label: 'Ogni settimana...', type: 'radio', value: 'weekly', checked: current === 'weekly' },
        { label: 'Ogni anno il 29 maggio', type: 'radio', value: 'yearly-may-29', checked: current === 'yearly-may-29' },
        { label: 'Dal lunedi al venerdi', type: 'radio', value: 'weekdays', checked: current === 'weekdays' },
        { label: 'Personalizza...', type: 'radio', value: 'custom', checked: current === 'custom' },
        { label: 'Rimuovi reminder', type: 'radio', value: 'none', checked: current === 'none' },
      ],
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Next',
          handler: selected => {
            value = this.toReminderPreset(selected);
          },
        },
      ],
    });

    await alert.present();
    await alert.onDidDismiss();
    return value;
  }

  private async buildReminderRule(preset: ReminderPreset, task: Task): Promise<ReminderRule | undefined> {
    const defaultTime = task.reminderRule?.time ?? task.reminderTime ?? '09:00';
    if (preset === 'once') {
      const dateTime = await this.askReminderDateTime(task.reminderRule?.date ?? this.today(), defaultTime);
      return dateTime ? { frequency: 'once', date: dateTime.date, time: dateTime.time } : undefined;
    }

    const time = await this.askReminderTime(defaultTime);
    if (!time) {
      return undefined;
    }

    if (preset === 'daily') {
      return { frequency: 'daily', time, endMode: 'never' };
    }
    if (preset === 'weekly') {
      const weekday = await this.askReminderWeekday(task.reminderRule?.weekday ?? task.reminderWeekday ?? this.todayWeekday());
      return weekday ? { frequency: 'weekly', time, weekday, endMode: 'never' } : undefined;
    }
    if (preset === 'yearly-may-29') {
      return { frequency: 'yearly', time, month: 5, dayOfMonth: 29, endMode: 'never' };
    }
    if (preset === 'weekdays') {
      return { frequency: 'weekdays', time, weekdays: [2, 3, 4, 5, 6], endMode: 'never' };
    }

    return this.askCustomReminderRule(task, time);
  }

  private async askReminderDateTime(currentDate: string, currentTime: string): Promise<{ date: string; time: string } | undefined> {
    let value: { date: string; time: string } | undefined;
    const alert = await this.alertController.create({
      header: 'Quando',
      inputs: [
        { name: 'date', type: 'date', value: currentDate },
        { name: 'time', type: 'time', value: currentTime },
      ],
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Save',
          handler: data => {
            if (typeof data?.date === 'string' && typeof data?.time === 'string' && data.date && data.time) {
              value = { date: data.date, time: data.time };
            }
          },
        },
      ],
    });

    await alert.present();
    await alert.onDidDismiss();
    return value;
  }

  private async askCustomReminderRule(task: Task, time: string): Promise<ReminderRule | undefined> {
    const interval = await this.askReminderInterval(task.reminderRule?.interval ?? 1);
    if (!interval) {
      return undefined;
    }

    const intervalUnit = await this.askReminderIntervalUnit(task.reminderRule?.intervalUnit ?? 'week');
    if (!intervalUnit) {
      return undefined;
    }

    const weekdays = await this.askReminderWeekdays(task.reminderRule?.weekdays ?? [this.todayWeekday()]);
    if (!weekdays?.length) {
      return undefined;
    }

    const endMode = await this.askReminderEndMode(task.reminderRule?.endMode ?? 'never');
    if (!endMode) {
      return undefined;
    }

    const rule: ReminderRule = {
      frequency: 'custom',
      time,
      interval,
      intervalUnit,
      weekdays,
      endMode,
    };

    if (endMode === 'date') {
      const endDate = await this.askReminderEndDate(task.reminderRule?.endDate ?? this.today());
      if (!endDate) {
        return undefined;
      }
      rule.endDate = endDate;
    }
    if (endMode === 'count') {
      const occurrenceCount = await this.askReminderOccurrenceCount(task.reminderRule?.occurrenceCount ?? 5);
      if (!occurrenceCount) {
        return undefined;
      }
      rule.occurrenceCount = occurrenceCount;
    }

    return rule;
  }

  private async askReminderTime(currentTime: string): Promise<string | undefined> {
    let value: string | undefined;
    const alert = await this.alertController.create({
      header: 'Reminder time',
      inputs: [
        {
          name: 'time',
          type: 'time',
          value: currentTime,
        },
      ],
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Save',
          handler: data => {
            value = typeof data?.time === 'string' && data.time ? data.time : undefined;
          },
        },
      ],
    });

    await alert.present();
    await alert.onDidDismiss();
    return value;
  }

  private async askReminderInterval(currentInterval: number): Promise<number | undefined> {
    let value: number | undefined;
    const alert = await this.alertController.create({
      header: 'Ripeti ogni',
      inputs: [
        {
          name: 'interval',
          type: 'number',
          min: 1,
          value: String(currentInterval),
        },
      ],
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Next',
          handler: data => {
            const interval = Number(data?.interval);
            value = Number.isFinite(interval) && interval > 0 ? Math.floor(interval) : undefined;
          },
        },
      ],
    });

    await alert.present();
    await alert.onDidDismiss();
    return value;
  }

  private async askReminderIntervalUnit(currentUnit: ReminderIntervalUnit): Promise<ReminderIntervalUnit | undefined> {
    let value: ReminderIntervalUnit | undefined;
    const alert = await this.alertController.create({
      header: 'Unita',
      inputs: [
        { label: 'Settimana', type: 'radio', value: 'week', checked: currentUnit === 'week' },
        { label: 'Mese', type: 'radio', value: 'month', checked: currentUnit === 'month' },
        { label: 'Anno', type: 'radio', value: 'year', checked: currentUnit === 'year' },
      ],
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Next',
          handler: selected => {
            value = this.toReminderIntervalUnit(selected);
          },
        },
      ],
    });

    await alert.present();
    await alert.onDidDismiss();
    return value;
  }

  private async askReminderWeekdays(currentWeekdays: number[]): Promise<number[] | undefined> {
    let value: number[] | undefined;
    const alert = await this.alertController.create({
      header: 'Si ripete il',
      inputs: [
        { label: 'L', type: 'checkbox', value: 2, checked: currentWeekdays.includes(2) },
        { label: 'M', type: 'checkbox', value: 3, checked: currentWeekdays.includes(3) },
        { label: 'M', type: 'checkbox', value: 4, checked: currentWeekdays.includes(4) },
        { label: 'G', type: 'checkbox', value: 5, checked: currentWeekdays.includes(5) },
        { label: 'V', type: 'checkbox', value: 6, checked: currentWeekdays.includes(6) },
        { label: 'S', type: 'checkbox', value: 7, checked: currentWeekdays.includes(7) },
        { label: 'D', type: 'checkbox', value: 1, checked: currentWeekdays.includes(1) },
      ],
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Next',
          handler: selected => {
            value = Array.isArray(selected) ? selected.map(Number).filter(day => day >= 1 && day <= 7) : undefined;
          },
        },
      ],
    });

    await alert.present();
    await alert.onDidDismiss();
    return value;
  }

  private async askReminderWeekday(currentWeekday: number): Promise<number | undefined> {
    let value: number | undefined;
    const alert = await this.alertController.create({
      header: 'Si ripete il',
      inputs: [
        { label: 'Lunedi', type: 'radio', value: 2, checked: currentWeekday === 2 },
        { label: 'Martedi', type: 'radio', value: 3, checked: currentWeekday === 3 },
        { label: 'Mercoledi', type: 'radio', value: 4, checked: currentWeekday === 4 },
        { label: 'Giovedi', type: 'radio', value: 5, checked: currentWeekday === 5 },
        { label: 'Venerdi', type: 'radio', value: 6, checked: currentWeekday === 6 },
        { label: 'Sabato', type: 'radio', value: 7, checked: currentWeekday === 7 },
        { label: 'Domenica', type: 'radio', value: 1, checked: currentWeekday === 1 },
      ],
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Save',
          handler: selected => {
            const weekday = Number(selected);
            value = weekday >= 1 && weekday <= 7 ? weekday : undefined;
          },
        },
      ],
    });

    await alert.present();
    await alert.onDidDismiss();
    return value;
  }

  private async askReminderEndMode(currentEndMode: ReminderEndMode): Promise<ReminderEndMode | undefined> {
    let value: ReminderEndMode | undefined;
    const alert = await this.alertController.create({
      header: 'Fine',
      inputs: [
        { label: 'Mai', type: 'radio', value: 'never', checked: currentEndMode === 'never' },
        { label: 'Data', type: 'radio', value: 'date', checked: currentEndMode === 'date' },
        { label: 'Dopo 5 occorrenze', type: 'radio', value: 'count', checked: currentEndMode === 'count' },
      ],
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Next',
          handler: selected => {
            value = this.toReminderEndMode(selected);
          },
        },
      ],
    });

    await alert.present();
    await alert.onDidDismiss();
    return value;
  }

  private async askReminderEndDate(currentDate: string): Promise<string | undefined> {
    let value: string | undefined;
    const alert = await this.alertController.create({
      header: 'Data fine',
      inputs: [{ name: 'date', type: 'date', value: currentDate }],
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Save',
          handler: data => {
            value = typeof data?.date === 'string' && data.date ? data.date : undefined;
          },
        },
      ],
    });

    await alert.present();
    await alert.onDidDismiss();
    return value;
  }

  private async askReminderOccurrenceCount(currentCount: number): Promise<number | undefined> {
    let value: number | undefined;
    const alert = await this.alertController.create({
      header: 'Occorrenze',
      inputs: [{ name: 'count', type: 'number', min: 1, value: String(currentCount) }],
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Save',
          handler: data => {
            const count = Number(data?.count);
            value = Number.isFinite(count) && count > 0 ? Math.floor(count) : undefined;
          },
        },
      ],
    });

    await alert.present();
    await alert.onDidDismiss();
    return value;
  }

  reminderLabel(task: Task): string {
    const rule = task.reminderRule;
    if (rule) {
      if (rule.frequency === 'once') return `${this.formatDate(rule.date)} ${rule.time}`;
      if (rule.frequency === 'daily') return `Ogni giorno ${rule.time}`;
      if (rule.frequency === 'weekly') return `${this.weekdayLabel(rule.weekday ?? null)} ${rule.time}`;
      if (rule.frequency === 'yearly') return `Ogni anno ${this.pad(rule.dayOfMonth)}/${this.pad(rule.month)} ${rule.time}`;
      if (rule.frequency === 'weekdays') return `Lun-ven ${rule.time}`;
      if (rule.frequency === 'custom') return `Ogni ${rule.interval ?? 1} ${this.intervalUnitLabel(rule.intervalUnit)} ${rule.time}`;
    }

    if (task.reminderFrequency === 'daily' && task.reminderTime) {
      return `Ogni giorno ${task.reminderTime}`;
    }
    if (task.reminderFrequency === 'weekly' && task.reminderTime) {
      return `${this.weekdayLabel(task.reminderWeekday)} ${task.reminderTime}`;
    }
    return 'Reminder';
  }

  private currentReminderPreset(task: Task): ReminderPreset {
    const rule = task.reminderRule;
    if (!rule) {
      if (task.reminderFrequency === 'daily') return 'daily';
      if (task.reminderFrequency === 'weekly') return 'weekly';
      return 'once';
    }
    if (rule.frequency === 'weekly') return 'weekly';
    if (rule.frequency === 'yearly' && rule.month === 5 && rule.dayOfMonth === 29) return 'yearly-may-29';
    if (rule.frequency === 'once' || rule.frequency === 'daily' || rule.frequency === 'weekdays' || rule.frequency === 'custom') {
      return rule.frequency;
    }
    return 'custom';
  }

  private toReminderPreset(value: unknown): ReminderPreset {
    const allowed: ReminderPreset[] = [
      'none',
      'once',
      'daily',
      'weekly',
      'yearly-may-29',
      'weekdays',
      'custom',
    ];
    return allowed.includes(value as ReminderPreset) ? value as ReminderPreset : 'none';
  }

  private toReminderIntervalUnit(value: unknown): ReminderIntervalUnit {
    return value === 'month' || value === 'year' ? value : 'week';
  }

  private toReminderEndMode(value: unknown): ReminderEndMode {
    return value === 'date' || value === 'count' ? value : 'never';
  }

  private weekdayLabel(weekday: number | null): string {
    return ['Domenica', 'Lunedi', 'Martedi', 'Mercoledi', 'Giovedi', 'Venerdi', 'Sabato'][(weekday ?? 1) - 1] ?? 'Settimanale';
  }

  private todayWeekday(): number {
    const day = new Date().getDay();
    return day === 0 ? 1 : day + 1;
  }

  private today(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private formatDate(date: string | undefined): string {
    if (!date) {
      return 'Non si ripete';
    }
    const [year, month, day] = date.split('-');
    return day && month && year ? `${day}/${month}/${year}` : date;
  }

  private intervalUnitLabel(unit: ReminderIntervalUnit | undefined): string {
    if (unit === 'month') return 'mesi';
    if (unit === 'year') return 'anni';
    return 'settimane';
  }

  private pad(value: number | undefined): string {
    return String(value ?? '').padStart(2, '0');
  }

  private getNotificationId(taskId: number): number {
    return 100000 + taskId;
  }

  trackById(_: number, item: { id: number }): number {
    return item.id;
  }
}
