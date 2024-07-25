import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { PreferencesService } from '../services/preferences.service';
import { CommonModule } from '@angular/common';
import { Database, DatahandlerService } from '../services/datahandler.service';
import { LottieAnimationComponent } from '../lottie-animation/lottie-animation.component';
import { MatDivider } from '@angular/material/divider';

@Component({
  selector: 'app-archive',
  standalone: true,
  imports: [CommonModule, LottieAnimationComponent, MatDivider],
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

  // Determine if there is content in branca
  hasBrancoContent(): boolean {
    let test = this.allFilledTappe && Object.keys(this.allFilledTappe).some(key => 
      key === 'branco-1' || key === 'branco-2' || key === 'branco-3');
    if (test == undefined) {
      return false
    } else {
      return test
    }
  }

  hasRepartoContent(): boolean {
    let test = this.allFilledTappe && Object.keys(this.allFilledTappe).some(key => 
      key === 'reparto-1' || key === 'reparto-2' || key === 'reparto-3');
    if (test == undefined) {
      return false
    } else {
      return test
    }
  }

  hasClanContent(): boolean {
    let test = this.allFilledTappe && Object.keys(this.allFilledTappe).some(key => 
      key === 'clan-1' || key === 'clan-2' || key === 'clan-3' || key === 'clan-4' || key === 'clan-5' || key === 'clan-6' || key === 'clan-7' || key === 'clan-8');
    
    if (test == undefined) {
      return false
    } else {
      return test
    }
  }
}
