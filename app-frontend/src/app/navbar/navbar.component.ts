import { Component, signal } from '@angular/core';
import { MatButtonToggle, MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIcon } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, MatIcon, MatButtonToggle, MatButtonToggleModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.less'
})
export class NavbarComponent {
  hideSingleSelectionIndicator = signal(true);

}
