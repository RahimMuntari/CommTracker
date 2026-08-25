import { HttpClient, httpResource } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MtnCallRecord } from '../model/mtn-call-record';
import { MtnSubscriberInfo } from '../model/mtn-subscriber-info';
import { environment } from '../../environments/environment.development';

@Injectable({
  providedIn: 'root',
})
export class MtnCallRecordService {
  private api = `${environment.apiUrl}/mtn`;

  constructor(private http: HttpClient) {}

  getAllSubscriberInfos() {
    return httpResource<MtnSubscriberInfo[]>(() => ({
      url: `${this.api}/subscriber-info`,
      method: 'GET',
    }));
  }

  getAllCallRecords() {
    return httpResource<MtnCallRecord[]>(() => ({
      url: `${this.api}/calls`,
      method: 'GET',
    }));
  }

  upload(file: File) {
    const form = new FormData();
    form.append('file', file);
    return this.http.post(this.api, form);
  }
}
