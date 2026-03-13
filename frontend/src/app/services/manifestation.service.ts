import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ManifestationResponse {
  protocol: string;
  message: string;
}

export interface ManifestationData {
  protocol: string;
  source_type: string;
  status: string;
  created_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class ManifestationService {
  private http = inject(HttpClient);
  // Using relative paths.
  // In production, Nginx proxies these to the backend.
  // In development, Angular Dev Server proxies these via proxy.conf.json.
  private apiUrl = '';

  submitManifestation(text?: string, file?: File, anonymous: boolean = false): Observable<ManifestationResponse> {
    const formData = new FormData();
    if (text) formData.append('text', text);
    if (file) formData.append('file', file);
    formData.append('anonymous', anonymous.toString());

    return this.http.post<ManifestationResponse>(`${this.apiUrl}/submit-manifestation`, formData);
  }

  getManifestation(protocol: string): Observable<ManifestationData> {
    return this.http.get<ManifestationData>(`${this.apiUrl}/manifestation/${protocol}`);
  }
}
