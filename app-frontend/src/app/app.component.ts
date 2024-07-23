import { Component, ChangeDetectorRef } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './navbar/navbar.component';
import { SafeArea } from 'capacitor-plugin-safe-area';
import { FloatingEditorComponent } from './floating-editor/floating-editor.component';
import { CommonModule } from '@angular/common';
import { state } from '@angular/animations';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, FloatingEditorComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.less'
})
export class AppComponent {
  title = 'app-frontend';

  ngOnInit(): void {
    this.setupSafeArea();
    this.cdr.detectChanges();
  }

  constructor( private cdr: ChangeDetectorRef){}

  async setupSafeArea() {
    try {
      const { insets } = await SafeArea.getSafeAreaInsets();

      for (const [key, value] of Object.entries(insets)) {
        document.documentElement.style.setProperty(
          `--safe-area-inset-${key}`,
          `${value}px`
        );
      }

    } catch (error) {
      console.error('Error setting up safe area:', error);
    }
  }
}