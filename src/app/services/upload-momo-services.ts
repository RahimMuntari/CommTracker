import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { FileType, ProviderType } from '../mdr-upload-form-model';

@Injectable({
  providedIn: 'root',
})
export class UploadMomoServices {
  private baseUrl = '/api/mdr/upload';

  constructor(private http: HttpClient) {}

   uploadMdr(provider: ProviderType, fileType: FileType, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file, file.name);

    const params = { provider, fileType };

    return this.http.post<any>(this.baseUrl, formData, { params });
  }
}
