import { HttpClient, httpResource } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MtnMomoStatement } from '../model/mtn-momo-statement';
import { MtnMomoTransaction } from '../model/mtn-momo-transaction';
import { environment } from '../../environments/environment.development';

@Injectable({
  providedIn: 'root',
})
export class MtnMomo {
  private api = `${environment.apiUrl}/mtn`;

  constructor(private http: HttpClient) {}

  getAllStatements() {
    var result = httpResource<MtnMomoStatement[]>(() => ({
      url: `${this.api}/momo/statements`,
      method: 'GET',
    }));
    console.log('getAllStatements result:', result);  
    return result;
  }

  getAllTransactions() {
    var result = httpResource<MtnMomoTransaction[]>(() => ({
      url: `${this.api}/momo/transactions`,
      method: 'GET',
    }));
    console.log('getAllTransactions result:', result);
    return result;
  }
}
