import { HttpClient, httpResource } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment.development';
import { TelecelCallRecord } from '../model/telecel-call-record';
import { TelecelSubscriberInfo } from '../model/telecel-subscriber-info';

@Injectable({
  providedIn: 'root',
})
export class TelecelCall {
  private api = `${environment.apiUrl}/telecel`;

  constructor(private http: HttpClient) {}

  getAllSubscriberInfos() {
    return httpResource<TelecelSubscriberInfo[]>(() => ({
      url: `${this.api}/calls/subscribers`,
      method: 'GET',
    }));
  }

  getAllCallRecords() {
    return httpResource<TelecelCallRecord[]>(() => ({
      url: `${this.api}/calls`,
      method: 'GET',
    }));
  }
}
