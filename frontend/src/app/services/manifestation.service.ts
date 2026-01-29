import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ManifestationResponse {
  protocol: string;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class ManifestationService {
  private http = inject(HttpClient);
  // Using relative path to take advantage of Nginx reverse proxy in Docker
  // Falls back to localhost for local development without proxy
  private apiUrl = window.location.hostname === 'localhost' ? 'http://localhost:8000' : '';

  submitManifestation(text?: string, file?: File, anonymous: boolean = false): Observable<any> {
    const formData = new FormData();
    if (text) formData.append('text', text);
    if (file) formData.append('file', file);
    formData.append('anonymous', anonymous.toString());

    return this.http.post<ManifestationResponse>(`${this.apiUrl}/submit-manifestation`, formData);
  }
}
