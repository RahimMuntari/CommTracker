import { HttpClient, httpResource } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { TelecelMomoStatement } from '../model/telecel-momo-statement';
import { TelecelMomoTransaction } from '../model/telecel-momo-transaction';
import { environment } from '../../environments/environment.development';

@Injectable({
  providedIn: 'root',
})
export class TelecelMomo {
  private api = `${environment.apiUrl}/telecel`;

  constructor(private http: HttpClient) {}

  getAllStatements() {
    return httpResource<TelecelMomoStatement[]>(() => ({
      url: `${this.api}/momo/statements`,
      method: 'GET',
    }));
  }

  getAllTransactions() {
    return httpResource<TelecelMomoTransaction[]>(() => ({
      url: `${this.api}/momo/transactions`,
      method: 'GET',
    }));
  }
}
