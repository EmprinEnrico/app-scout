import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { PreferencesService } from '../services/preferences.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { DatahandlerService } from '../services/datahandler.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [MatButtonToggleModule, MatFormFieldModule, MatSelectModule, FormsModule, CommonModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})

export class SettingsComponent {

  selectedBranca: any;
  selectedTappa: any;

  constructor(private preferencesService: PreferencesService, private cdr: ChangeDetectorRef, private dhs: DatahandlerService) {}

  branche: any;
  tappeBranco: any;
  tappeReparto: any;
  tappeClan: any;

  ngOnInit(): void {
    this.getInitialValues();

    this.branche = this.dhs.branche;
    this.tappeBranco = this.dhs.tappeBranco;
    this.tappeReparto = this.dhs.tappeReparto;
    this.tappeClan = this.dhs.tappeClan;
  }

  async getInitialValues(): Promise<void> {
    this.selectedBranca = await this.dhs.getSelectedBranca();
    this.selectedTappa = await this.dhs.getSelectedTappa();
    this.cdr.detectChanges();
  }

  async onBrancaChange(): Promise<void> {
    this.dhs.setSelectedBranca(this.selectedBranca);
  }

  async onTappaChange(): Promise<void> {
    this.dhs.setSelectedTappa(this.selectedTappa);
  }
}
