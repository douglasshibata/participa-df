import { Component, signal, inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { ManifestationService, ManifestationData } from '../../services/manifestation.service';

@Component({
  selector: 'app-manifestation-status',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressBarModule,
    MatDividerModule,
    MatChipsModule
  ],
  templateUrl: './manifestation-status.component.html',
  styleUrl: './manifestation-status.component.scss'
})
export class ManifestationStatusComponent {
  private manifestationService = inject(ManifestationService);
  private liveAnnouncer = inject(LiveAnnouncer);

  @ViewChild('detailsContainer') detailsContainer!: ElementRef;

  protocolInput = signal('');
  isLoading = signal(false);
  data = signal<ManifestationData | null>(null);
  error = signal<string | null>(null);

  search() {
    const protocol = this.protocolInput().trim();
    if (!protocol) return;

    this.isLoading.set(true);
    this.error.set(null);
    this.data.set(null);
    this.liveAnnouncer.announce('Buscando protocolo...');

    this.manifestationService.getManifestation(protocol).subscribe({
      next: (res) => {
        if (res.status === 'not found') {
          this.error.set('Protocolo não encontrado.');
          this.liveAnnouncer.announce('Erro: Protocolo não encontrado.');
        } else {
          this.data.set(res);
          this.liveAnnouncer.announce('Protocolo localizado com sucesso.');

          // Focus the details for accessibility
          setTimeout(() => {
            this.detailsContainer?.nativeElement.focus();
          }, 100);
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set('Erro ao buscar protocolo. Verifique a conexão.');
        this.isLoading.set(false);
        this.liveAnnouncer.announce('Erro ao buscar protocolo.');
      }
    });
  }
}
