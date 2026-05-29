import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { BrowserLogService } from './browser-log.service';
import { ReminderRule, Task } from './datahandler.service';

type ScheduleResult = 'scheduled' | 'unsupported' | 'denied' | 'off';

@Injectable({
  providedIn: 'root',
})
export class ReminderNotificationService {
  private readonly maxScheduledOccurrences = 64;

  constructor(private browserLog: BrowserLogService) {}

  async scheduleTaskReminder(task: Task): Promise<ScheduleResult> {
    if (task.reminderFrequency === 'none' || !task.notificationId) {
      await this.cancelTaskReminder(task);
      return 'off';
    }

    const rule = task.reminderRule ?? this.legacyRule(task);
    if (!rule) {
      await this.cancelTaskReminder(task);
      return 'off';
    }

    const permission = await this.ensurePermission();
    if (permission === 'unsupported' || permission === 'denied') {
      return permission;
    }

    const occurrences = this.buildOccurrences(rule);
    if (occurrences.length === 0) {
      return 'off';
    }

    try {
      await this.cancelTaskReminder(task);
      await LocalNotifications.schedule({
        notifications: occurrences.map((date, index) => ({
          id: task.notificationId! + index,
          title: 'Path Tracker reminder',
          body: task.body.trim() || 'You planned something to do.',
          schedule: { at: date, allowWhileIdle: true },
          extra: {
            taskId: task.id,
            frequency: rule.frequency,
          },
        })),
      });
      this.browserLog.info('Task reminders scheduled', {
        taskId: task.id,
        frequency: rule.frequency,
        occurrences: occurrences.length,
      });
      return 'scheduled';
    } catch (error) {
      this.browserLog.warn('Task reminder schedule unsupported', { taskId: task.id, error });
      return 'unsupported';
    }
  }

  async cancelTaskReminder(task: Pick<Task, 'id' | 'notificationId'>): Promise<void> {
    if (!task.notificationId) {
      return;
    }

    try {
      await LocalNotifications.cancel({
        notifications: Array.from({ length: this.maxScheduledOccurrences }, (_, index) => ({
          id: task.notificationId! + index,
        })),
      });
      this.browserLog.info('Task reminders cancelled', { taskId: task.id });
    } catch (error) {
      this.browserLog.warn('Task reminder cancel unsupported', { taskId: task.id, error });
    }
  }

  private async ensurePermission(): Promise<'granted' | 'unsupported' | 'denied'> {
    if (Capacitor.getPlatform() === 'web') {
      return 'unsupported';
    }

    try {
      const current = await LocalNotifications.checkPermissions();
      if (current.display === 'granted') {
        return 'granted';
      }

      const requested = await LocalNotifications.requestPermissions();
      return requested.display === 'granted' ? 'granted' : 'denied';
    } catch (error) {
      this.browserLog.warn('Notification permission unavailable', error);
      return 'unsupported';
    }
  }

  private buildOccurrences(rule: ReminderRule): Date[] {
    const [hour, minute] = this.parseTime(rule.time);
    const occurrences: Date[] = [];
    const start = new Date();
    start.setSeconds(0, 0);

    if (rule.frequency === 'once' && rule.date) {
      const date = this.dateAt(rule.date, hour, minute);
      return date > start ? [date] : [];
    }

    const scanLimit = new Date(start);
    scanLimit.setFullYear(scanLimit.getFullYear() + 3);

    for (const date = new Date(start); date <= scanLimit && occurrences.length < this.maxScheduledOccurrences; date.setDate(date.getDate() + 1)) {
      const candidate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour, minute);
      if (candidate <= start || !this.matchesRule(candidate, rule, start)) {
        continue;
      }
      if (rule.endMode === 'date' && rule.endDate && candidate > this.dateAt(rule.endDate, 23, 59)) {
        break;
      }
      occurrences.push(candidate);
      if (rule.endMode === 'count' && rule.occurrenceCount && occurrences.length >= rule.occurrenceCount) {
        break;
      }
    }

    return occurrences;
  }

  private matchesRule(date: Date, rule: ReminderRule, start: Date): boolean {
    const weekday = this.pluginWeekday(date);
    if (rule.frequency === 'daily') {
      return true;
    }
    if (rule.frequency === 'weekly') {
      return weekday === (rule.weekday ?? this.pluginWeekday(start));
    }
    if (rule.frequency === 'yearly') {
      return date.getMonth() + 1 === rule.month && date.getDate() === rule.dayOfMonth;
    }
    if (rule.frequency === 'weekdays') {
      return [2, 3, 4, 5, 6].includes(weekday);
    }
    if (rule.frequency === 'custom') {
      const weekdays = rule.weekdays?.length ? rule.weekdays : [this.pluginWeekday(start)];
      if (!weekdays.includes(weekday)) {
        return false;
      }
      const interval = rule.interval ?? 1;
      if (rule.intervalUnit === 'month') {
        return this.monthsBetween(start, date) % interval === 0;
      }
      if (rule.intervalUnit === 'year') {
        return (date.getFullYear() - start.getFullYear()) % interval === 0;
      }
      return Math.floor(this.daysBetween(start, date) / 7) % interval === 0;
    }
    return false;
  }

  private legacyRule(task: Task): ReminderRule | null {
    if (!task.reminderTime || task.reminderFrequency === 'none') {
      return null;
    }
    if (task.reminderFrequency === 'weekly') {
      return { frequency: 'weekly', time: task.reminderTime, weekday: task.reminderWeekday ?? this.todayWeekday(), endMode: 'never' };
    }
    return { frequency: task.reminderFrequency, time: task.reminderTime, endMode: 'never' };
  }

  private parseTime(time: string): [number, number] {
    const [hour, minute] = time.split(':').map(value => Number(value));
    return [
      Number.isInteger(hour) ? hour : 9,
      Number.isInteger(minute) ? minute : 0,
    ];
  }

  private dateAt(date: string, hour: number, minute: number): Date {
    const [year, month, day] = date.split('-').map(value => Number(value));
    return new Date(year, month - 1, day, hour, minute, 0, 0);
  }

  private pluginWeekday(date: Date): number {
    return date.getDay() + 1;
  }

  private todayWeekday(): number {
    return this.pluginWeekday(new Date());
  }

  private daysBetween(start: Date, end: Date): number {
    const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
    const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime();
    return Math.floor((endDay - startDay) / 86400000);
  }

  private monthsBetween(start: Date, end: Date): number {
    return (end.getFullYear() - start.getFullYear()) * 12 + end.getMonth() - start.getMonth();
  }
}
