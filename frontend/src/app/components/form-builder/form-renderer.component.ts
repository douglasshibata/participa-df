import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-form-renderer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './form-renderer.component.html',
  styleUrl: './form-renderer.component.scss'
})
export class FormRendererComponent {
  @Input() fields: any[] = [];
}
