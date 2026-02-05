import { Component, signal, inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { ManifestationService } from '../../services/manifestation.service';

@Component({
  selector: 'app-manifestation-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
    MatCardModule,
    MatProgressBarModule
  ],
  templateUrl: './manifestation-form.component.html',
  styleUrl: './manifestation-form.component.scss'
})
export class ManifestationFormComponent {
  private manifestationService = inject(ManifestationService);
  private liveAnnouncer = inject(LiveAnnouncer);

  @ViewChild('resultContainer') resultContainer!: ElementRef;

  // Signals for state management
  textReport = signal('');
  isAnonymous = signal(false);
  selectedFile = signal<File | null>(null);
  fileName = signal('');
  isUploading = signal(false);
  protocolResult = signal<string | null>(null);
  error = signal<string | null>(null);

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      this.selectedFile.set(file);
      this.fileName.set(file.name);
      this.liveAnnouncer.announce(`Arquivo ${file.name} selecionado`);
    }
  }

  async submit() {
    if (!this.textReport() && !this.selectedFile()) {
      this.error.set('Por favor, forneça um relato em texto ou um arquivo de mídia.');
      this.liveAnnouncer.announce('Erro: Por favor, forneça um relato em texto ou um arquivo de mídia.');
      return;
    }

    this.isUploading.set(true);
    this.error.set(null);
    this.protocolResult.set(null);
    this.liveAnnouncer.announce('Enviando manifestação...');

    this.manifestationService.submitManifestation(
      this.textReport(),
      this.selectedFile() || undefined,
      this.isAnonymous()
    ).subscribe({
      next: (res) => {
        this.protocolResult.set(res.protocol);
        this.isUploading.set(false);
        this.textReport.set('');
        this.selectedFile.set(null);
        this.fileName.set('');
        this.liveAnnouncer.announce(`Manifestação enviada com sucesso. Seu protocolo é ${res.protocol}`);

        // Focus the result for accessibility
        setTimeout(() => {
          this.resultContainer?.nativeElement.focus();
        }, 100);
      },
      error: (err) => {
        this.error.set('Erro ao enviar manifestação. Tente novamente mais tarde.');
        this.isUploading.set(false);
        this.liveAnnouncer.announce('Erro ao enviar manifestação.');
        console.error(err);
      }
    });
  }

  clearFile() {
    this.selectedFile.set(null);
    this.fileName.set('');
    this.liveAnnouncer.announce('Arquivo removido');
  }
}
