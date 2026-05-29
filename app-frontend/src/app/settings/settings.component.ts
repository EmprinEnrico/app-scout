import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    MatDividerModule,
    MatListModule,
  ],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsComponent {}
