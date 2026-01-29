import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ManifestationFormComponent } from './components/manifestation-form/manifestation-form.component';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ManifestationFormComponent, MatToolbarModule, MatIconModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'Participa DF';
}
