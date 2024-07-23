import { Component, EventEmitter, Output, Input } from '@angular/core';
import {MatInputModule} from '@angular/material/input';
import {MatFormFieldModule} from '@angular/material/form-field';
import {FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { Database, DatahandlerService } from '../services/datahandler.service';

@Component({
  selector: 'app-floating-editor',
  standalone: true,
  imports: [FormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, ReactiveFormsModule],
  templateUrl: './floating-editor.component.html',
  styleUrl: './floating-editor.component.less'
})
export class FloatingEditorComponent {
  constructor(private dhs: DatahandlerService) {}

  @Input() editingTappa!: string | undefined;
  @Input() editingObjectiveNumber!: number | undefined;
  @Input() database: Database | undefined;
  @Output() editorChange = new EventEmitter();

  editingForm = new FormGroup({
    text: new FormControl('', []),
  });

  ngOnInit(){
    // Add controls on variables
    if(this.database && this.editingTappa && this.editingObjectiveNumber != undefined){
      let textValue = this.dhs.getTappaObjectives(this.database,this.editingTappa)[this.editingObjectiveNumber];
      this.editingForm.get('text')?.setValue(textValue);
    }
    
  }

  onAnnullaClicked(){
    this.editorChange.emit();
    
  }

  async onSalvaClicked() {
    if (this.database == undefined) {
      this.database = await this.dhs.getDatabase();2
    }
    if (this.editingTappa == undefined || this.editingObjectiveNumber == undefined) {
      throw("editingTappa or editingObjectiveNumber undefined");
    }

    let value = this.editingForm.get('text')?.value;
    if(value){
      this.database[this.editingTappa][this.editingObjectiveNumber] = value;
    this.database[this.editingTappa][this.editingObjectiveNumber + 1] = "";
    } else {
      if(value == ""){
        this.dhs.removeObjective(this.database, this.editingTappa, this.editingObjectiveNumber + 1);
        this.database[this.editingTappa][this.editingObjectiveNumber + 1] = "";
      }
    }
    
    
    await this.dhs.setDatabase(this.database);
    this.editorChange.emit();
  }

  fontSize={
    value: "14px"
  };
}
