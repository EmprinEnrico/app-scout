import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatDivider } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { DatahandlerService, GoalSummary } from '../services/datahandler.service';
import { LottieAnimationComponent } from '../lottie-animation/lottie-animation.component';
import { BrowserLogService } from '../services/browser-log.service';

@Component({
  selector: 'app-archive',
  standalone: true,
  imports: [CommonModule, LottieAnimationComponent, MatDivider, MatIconModule, MatProgressBarModule],
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
}
