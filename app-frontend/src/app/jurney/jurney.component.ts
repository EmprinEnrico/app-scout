import { afterNextRender, ChangeDetectorRef, Component, ElementRef, inject, Injector, ViewChild } from '@angular/core';
import { PreferencesService } from '../services/preferences.service';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { DatahandlerService, Tappa, Branca, Database } from '../services/datahandler.service';
import { FormsModule } from '@angular/forms';
import {CdkTextareaAutosize} from '@angular/cdk/text-field'
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { TextFieldModule } from '@angular/cdk/text-field';
import { Router } from '@angular/router';

@Component({
  selector: 'app-jurney',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatDividerModule, FormsModule, MatFormFieldModule, MatSelectModule, TextFieldModule],
  templateUrl: './jurney.component.html',
  styleUrl: './jurney.component.less'
})
export class JurneyComponent {

  selectedBranca: any;
  selectedTappa!: string;

  branche: Branca[] | undefined;
  tappeBranco: Tappa[] | undefined;
  tappeReparto: Tappa[] | undefined;
  tappeClan: Tappa[] | undefined;

  database: Database | undefined;

  selectedTappaObjectives: string[] = [];


  constructor(private cdr: ChangeDetectorRef, private dhs: DatahandlerService, private router: Router) {}

  async ngOnInit(): Promise<void> {
    this.getFreshValues();
  }


  async getSelectedTappaObjectives() {
    try {
      if (this.database == undefined) {
        this.database = await this.dhs.getDatabase();
      }
      this.selectedTappaObjectives = this.dhs.getTappaObjectives(this.database, this.selectedTappa);
      if (this.selectedTappaObjectives.length == 0){
        this.dhs.setTappaObjective(this.database, this.selectedTappa, 1, "");
        this.database = await this.dhs.getDatabase();
        this.selectedTappaObjectives = this.dhs.getTappaObjectives(this.database, this.selectedTappa);
      }
    } catch (error) {
      console.log("Unable to get selectedTappaObjectives:" + error);
    }
  }
  

  async updateObjective(objectiveIndex: number, event: Event) {
    const target = event.target as HTMLTextAreaElement;
    if (!target) return; // Ensure target exists

    this.database = await this.dhs.getDatabase();

    // Ensure selectedTappa exists
    if (!this.selectedTappa) {
        throw new Error("selectedTappa is undefined");
    }

    // Ensure the objectives array exists
    if (!this.database[this.selectedTappa]) {
        this.database[this.selectedTappa] = [];
    }

    
   

    if((objectiveIndex + 1) == this.selectedTappaObjectives.length){
      this.dhs.setTappaObjective(this.database, this.selectedTappa, objectiveIndex + 2, "");
      
    }

    if (target.value) {
      this.dhs.setTappaObjective(this.database, this.selectedTappa, objectiveIndex + 1, target.value);
    }

    if (target.value == ""){
      this.dhs.removeObjective(this.database, this.selectedTappa, objectiveIndex + 1);
    }

    this.getSelectedTappaObjectives();
    this.redirectTo("/jurney")
    
  }

  private _injector = inject(Injector);

  @ViewChild('autosize') autosize!: CdkTextareaAutosize;

  triggerResize() {
    // Wait for content to render, then trigger textarea resize.
    afterNextRender(
      () => {
        this.autosize.resizeToFitContent(true);
      },
      {
        injector: this._injector,
      },
    );
  }


  redirectTo(uri: string) {
    this.router.navigateByUrl('/dummy', { skipLocationChange: true }).then(() => {
      this.router.navigate([uri])});
  }


  async onBrancaChange(): Promise<void> {
    this.dhs.setSelectedBranca(this.selectedBranca);
    this.dhs.setSelectedTappa(this.selectedBranca + "-1");
    this.getFreshValues();
  }
  
  async getFreshValues(){
    this.selectedBranca = await this.dhs.getSelectedBranca();
    this.selectedTappa = await this.dhs.getSelectedTappa();
    this.database = await this.dhs.getDatabase();

    this.cdr.detectChanges();
    this.branche = this.dhs.branche;
    this.tappeBranco = this.dhs.tappeBranco;
    this.tappeReparto = this.dhs.tappeReparto;
    this.tappeClan = this.dhs.tappeClan;

    await this.getSelectedTappaObjectives();
  }

  async previwsTappa(): Promise<void> {
    const selectedTappaNumber: number = Number(this.selectedTappa.slice(-1))

    if(selectedTappaNumber === 1){
      console.log("ultimo")
      return;
    }
    const newTappa = this.selectedTappa.slice(0, -1) + (selectedTappaNumber - 1);
    console.log(newTappa);
    this.dhs.setSelectedTappa(newTappa);
    this.getFreshValues();
  }
  
  async nextTappa(): Promise<void> {
    const selectedTappaNumber: number = Number(this.selectedTappa.slice(-1));

    if (selectedTappaNumber >= 3) {
        console.log("ultimo");

        if (this.selectedBranca === "clan") {
            if (selectedTappaNumber > 7) {
                console.log("ultimo clan");
                return;
            }

            console.log("clanaaaaa");
        } else {
            return; // Ensures only "clan" goes beyond 3
        }
    }

    const newTappa = this.selectedTappa.slice(0, -1) + (selectedTappaNumber + 1);
    this.dhs.setSelectedTappa(newTappa);
    this.getFreshValues();
}

}

