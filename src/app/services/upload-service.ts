import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Uploadcallmodel } from '../model/uploadcallmodel';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class UploadService {
  private readonly api = environment.apiUrl;
  private readonly uploadCdrEndPoint = `${this.api}/cdr/upload`; 

  constructor(private http: HttpClient) {}

  upload(formData: FormData) {
        //console.log('Uploading with form data:', formData);
        //console.log('Upload endpoint:', this.uploadCdrEndPoint);
        var result =  this.http.post(this.uploadCdrEndPoint, formData);
        console.log('Upload result:', result);
        return result;
  }
  
}


