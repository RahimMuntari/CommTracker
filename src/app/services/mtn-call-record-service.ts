import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class MtnCallRecordService {
   private api = 'http://localhost:5000/upload';

  constructor(private http: HttpClient) {}

  upload(file: File) {
    const form = new FormData();
    form.append('file', file);
    return this.http.post(this.api, form);
  }
}
