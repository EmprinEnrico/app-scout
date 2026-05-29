import { Routes } from '@angular/router';
import { JurneyComponent } from './jurney/jurney.component';
import { ArchiveComponent } from './archive/archive.component';
import { SettingsComponent } from './settings/settings.component';

export const routes: Routes = [
    { path: 'journey', component: JurneyComponent },
    { path: 'jurney', component: JurneyComponent },
    { path: 'archive', component: ArchiveComponent },
    { path: 'settings', component: SettingsComponent },
    { path: '', redirectTo: '/journey', pathMatch: 'full' },
    { path: '**', redirectTo: '/journey' }
];
