import { Routes } from '@angular/router';
import { JourneyComponent } from './journey/journey.component';
import { ArchiveComponent } from './archive/archive.component';
import { SettingsComponent } from './settings/settings.component';

export const routes: Routes = [
    { path: 'journey', component: JourneyComponent },
    { path: 'archive', component: ArchiveComponent },
    { path: 'settings', component: SettingsComponent },
    { path: '', redirectTo: '/journey', pathMatch: 'full' },
    { path: '**', redirectTo: '/journey' }
];
