import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { PreferencesService } from '../services/preferences.service';
import { CommonModule } from '@angular/common';
import { Database, DatahandlerService } from '../services/datahandler.service';

@Component({
  selector: 'app-archive',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './archive.component.html',
  styleUrl: './archive.component.less'
})
export class ArchiveComponent implements OnInit{
  
  database: Database | undefined;
  allObjectives: any;
  allFilledTappe: Database | undefined;

  constructor(public dhs: DatahandlerService, private cdr: ChangeDetectorRef) {}

  async ngOnInit(): Promise<void> {
    await this.init();
    
  }

  async init(): Promise<void> {
    try {
      this.database = await this.dhs.getDatabase();
      this.allFilledTappe = this.dhs.getAllNonEmptyTappe(this.database);
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error retrieving stored values:', error);
    }
  }

}
