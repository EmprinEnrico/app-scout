import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatDivider } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { DatahandlerService, GoalSummary, ReminderIntervalUnit, Task } from '../services/datahandler.service';
import { LottieAnimationComponent } from '../lottie-animation/lottie-animation.component';
import { BrowserLogService } from '../services/browser-log.service';

@Component({
  selector: 'app-archive',
  standalone: true,
  imports: [CommonModule, LottieAnimationComponent, MatDivider, MatIconModule],
  templateUrl: './archive.component.html',
  styleUrl: './archive.component.less',
})
export class ArchiveComponent implements OnInit {
  summaries: GoalSummary[] = [];
  loading = true;
  errorMessage = '';

  constructor(
    private datahandler: DatahandlerService,
    private browserLog: BrowserLogService,
  ) {}

  async ngOnInit(): Promise<void> {
    await this.load();
  }

  async load(): Promise<void> {
    try {
      this.loading = true;
      this.errorMessage = '';
      this.browserLog.info('Archive load start');
      await this.datahandler.initialize();
      this.summaries = await this.datahandler.getGoalSummaries();
      this.browserLog.info('Archive load complete', { goals: this.summaries.length });
    } catch (error) {
      this.browserLog.error('Archive load failed', error);
      this.errorMessage = `Unable to load archive: ${error}`;
    } finally {
      this.loading = false;
    }
  }

  trackById(_: number, item: { id: number }): number {
    return item.id;
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
    return '';
  }

  private weekdayLabel(weekday: number | null): string {
    return ['Domenica', 'Lunedi', 'Martedi', 'Mercoledi', 'Giovedi', 'Venerdi', 'Sabato'][(weekday ?? 1) - 1] ?? 'Settimanale';
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
}
