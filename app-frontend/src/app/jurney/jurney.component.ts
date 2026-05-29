import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import {
  DatahandlerService,
  Goal,
  GoalWithSteps,
  StatusOverride,
  StepWithTasks,
  Task,
} from '../services/datahandler.service';
import { BrowserLogService } from '../services/browser-log.service';

@Component({
  selector: 'app-jurney',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatDividerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressBarModule,
    MatSelectModule,
  ],
  templateUrl: './jurney.component.html',
  styleUrl: './jurney.component.less',
})
export class JurneyComponent implements OnInit {
  goals: Goal[] = [];
  selectedGoal: GoalWithSteps | undefined;
  loading = true;
  errorMessage = '';

  readonly statusOptions: { value: StatusOverride; label: string }[] = [
    { value: 'auto', label: 'Auto' },
    { value: 'active', label: 'Active' },
    { value: 'paused', label: 'Paused' },
    { value: 'completed', label: 'Completed' },
  ];

  constructor(
    private datahandler: DatahandlerService,
    private browserLog: BrowserLogService,
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
    } catch (error) {
      this.browserLog.error('Journey create goal failed', error);
      this.errorMessage = this.toErrorMessage('Unable to create goal', error);
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
    if (!this.selectedGoal || !confirm(`Delete "${this.selectedGoal.title}"?`)) {
      return;
    }
    try {
      await this.datahandler.deleteGoal(this.selectedGoal.id);
      this.browserLog.info('Journey goal deleted', { goalId: this.selectedGoal.id });
      await this.load();
    } catch (error) {
      this.browserLog.error('Journey delete goal failed', error);
      this.errorMessage = this.toErrorMessage('Unable to delete goal', error);
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
    } catch (error) {
      this.browserLog.error('Journey create step failed', error);
      this.errorMessage = this.toErrorMessage('Unable to create step', error);
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
    if (!this.selectedGoal || !confirm(`Delete step "${step.title}"?`)) {
      return;
    }
    try {
      await this.datahandler.deleteStep(step.id);
      this.browserLog.info('Journey step deleted', { stepId: step.id });
      await this.refreshSelectedGoal();
    } catch (error) {
      this.browserLog.error('Journey delete step failed', error);
      this.errorMessage = this.toErrorMessage('Unable to delete step', error);
    }
  }

  async addTask(step: StepWithTasks): Promise<void> {
    try {
      const taskId = await this.datahandler.createTask(step.id);
      this.browserLog.info('Journey task created', { stepId: step.id, taskId });
      await this.refreshSelectedGoal();
    } catch (error) {
      this.browserLog.error('Journey create task failed', error);
      this.errorMessage = this.toErrorMessage('Unable to create task', error);
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

  async deleteTask(task: Task): Promise<void> {
    if (!confirm('Delete this task?')) {
      return;
    }
    try {
      await this.datahandler.deleteTask(task.id);
      this.browserLog.info('Journey task deleted', { taskId: task.id });
      await this.refreshSelectedGoal();
    } catch (error) {
      this.browserLog.error('Journey delete task failed', error);
      this.errorMessage = this.toErrorMessage('Unable to delete task', error);
    }
  }

  async toggleTask(task: Task): Promise<void> {
    task.done = !task.done;
    await this.saveTask(task);
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

  private toErrorMessage(prefix: string, error: unknown): string {
    const message = error instanceof Error ? error.message : String(error);
    return `${prefix}: ${message}`;
  }

  trackById(_: number, item: { id: number }): number {
    return item.id;
  }
}
