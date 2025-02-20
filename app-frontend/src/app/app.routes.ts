import { Routes } from '@angular/router';
import { JurneyComponent } from './jurney/jurney.component';
import { ArchiveComponent } from './archive/archive.component';
import { SettingsComponent } from './settings/settings.component';
import { DummyComponentComponent } from './dummy-component/dummy-component.component';

export const routes: Routes = [
    { path: 'jurney', component: JurneyComponent },
    { path: 'archive', component: ArchiveComponent },
    { path: 'settings', component: SettingsComponent },
    { path: 'dummy', component: DummyComponentComponent },
    { path: '', redirectTo: '/jurney', pathMatch: 'full' }, // Default route
    { path: '**', redirectTo: '/jurney' } // Wildcard route for a 404 page or redirection
];
