import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatDivider } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import {
  AlertController,
  IonItem,
  IonItemOption,
  IonItemOptions,
  IonItemSliding,
  ToastController,
} from '@ionic/angular/standalone';
import { DatahandlerService, GoalSummary } from '../services/datahandler.service';
import { LottieAnimationComponent } from '../lottie-animation/lottie-animation.component';
import { BrowserLogService } from '../services/browser-log.service';

@Component({
  selector: 'app-archive',
  standalone: true,
  imports: [
    CommonModule,
    LottieAnimationComponent,
    MatDivider,
    MatIconModule,
    IonItem,
    IonItemOption,
    IonItemOptions,
    IonItemSliding,
  ],
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
    private alertController: AlertController,
    private toastController: ToastController,
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

  async deleteGoal(goal: GoalSummary): Promise<void> {
    const shouldDelete = await this.confirmDelete(
      'Delete goal',
      `Delete "${goal.title}" and all of its steps and tasks?`
    );
    if (!shouldDelete) {
      return;
    }

    try {
      await this.datahandler.deleteGoal(goal.id);
      this.browserLog.info('Archive goal deleted', { goalId: goal.id });
      await this.load();
      await this.showToast('Goal deleted');
    } catch (error) {
      this.browserLog.error('Archive delete goal failed', { goalId: goal.id, error });
      this.errorMessage = `Unable to delete goal: ${error}`;
      await this.showToast('Unable to delete goal', 'danger');
    }
  }

  formatDate(date: string | null | undefined): string {
    if (!date) {
      return '';
    }
    const [year, month, day] = date.slice(0, 10).split('-');
    return day && month && year ? `${day}/${month}/${year}` : date;
  }

  private async confirmDelete(header: string, message: string): Promise<boolean> {
    let confirmed = false;
    const alert = await this.alertController.create({
      header,
      message,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
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
      cssClass: ['app-toast', `app-toast-${color}`],
      duration: 900,
      position: 'top',
    });
    await toast.present();
  }
}
