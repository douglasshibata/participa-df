import { Component, signal, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter, map } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'Participa DF';
  isHighContrast = signal(false);
  isOffline = signal(!navigator.onLine);

  private swUpdate = inject(SwUpdate);

  constructor() {
    // Persist high contrast setting
    const saved = localStorage.getItem('high-contrast');
    if (saved) {
      this.isHighContrast.set(saved === 'true');
    }

    effect(() => {
      if (this.isHighContrast()) {
        document.body.classList.add('high-contrast');
      } else {
        document.body.classList.remove('high-contrast');
      }
      localStorage.setItem('high-contrast', this.isHighContrast().toString());
    });

    // Offline detection
    window.addEventListener('online', () => this.isOffline.set(false));
    window.addEventListener('offline', () => this.isOffline.set(true));

    // Service Worker Updates
    if (this.swUpdate.isEnabled) {
      this.swUpdate.versionUpdates.pipe(
        filter((evt): evt is VersionReadyEvent => evt.type === 'VERSION_READY'),
        map(evt => ({
          type: 'UPDATE_AVAILABLE',
          current: evt.currentVersion,
          available: evt.latestVersion,
        }))
      ).subscribe(() => {
        if (confirm('Nova versão disponível. Recarregar agora?')) {
          window.location.reload();
        }
      });
    }
  }

  toggleHighContrast() {
    this.isHighContrast.set(!this.isHighContrast());
  }
}
