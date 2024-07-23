import { ChangeDetectorRef, Component } from '@angular/core';
import { PreferencesService } from '../services/preferences.service';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { FloatingEditorComponent } from '../floating-editor/floating-editor.component';
import { DatahandlerService, Tappa, Branca, Database } from '../services/datahandler.service';

@Component({
  selector: 'app-jurney',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatDividerModule, FloatingEditorComponent],
  templateUrl: './jurney.component.html',
  styleUrl: './jurney.component.less'
})
export class JurneyComponent {

  editor = false;
  editingObjectiveNumber: number | undefined;
  editingTappa: string | undefined;

  changeEditor(){
    this.editor = !this.editor;
  }

  selectedBranca: any;
  selectedTappa: any;

  branche: Branca[] | undefined;
  tappeBranco: Tappa[] | undefined;
  tappeReparto: Tappa[] | undefined;
  tappeClan: Tappa[] | undefined;

  database: Database | undefined;

  selectedTappaObjectives: string[] = [];

  constructor(private cdr: ChangeDetectorRef, private dhs: DatahandlerService) {}

  async ngOnInit(): Promise<void> {
    await this.getInitialValues();
    this.branche = this.dhs.branche;
    this.tappeBranco = this.dhs.tappeBranco;
    this.tappeReparto = this.dhs.tappeReparto;
    this.tappeClan = this.dhs.tappeClan;

    await this.getSelectedTappaObjectives();
  }

  async getInitialValues(): Promise<void> {
    this.selectedBranca = await this.dhs.getSelectedBranca();
    this.selectedTappa = await this.dhs.getSelectedTappa();
    this.database = await this.dhs.getDatabase();
    this.cdr.detectChanges();
  }

  async getSelectedTappaObjectives() {
    try {
      if (this.database == undefined) {
        this.database = await this.dhs.getDatabase();
      }
      this.selectedTappaObjectives = this.dhs.getTappaObjectives(this.database, this.selectedTappa);
    } catch (error) {
      console.log("Unavle to get selectedTappaObjectives:" + error);
    }
  }
  

}

