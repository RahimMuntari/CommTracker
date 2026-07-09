import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Uploadcallmodel } from '../model/uploadcallmodel';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class UploadService {
  private readonly api = environment.apiUrl;
  private readonly uploadCdrEndPoint = `${this.api}/cdr/upload`; // Adjust the endpoint as needed

  constructor(private http: HttpClient) {}

  upload(formData: FormData) {
        console.log('Uploading with form data:', formData);
        console.log('Upload endpoint:', this.uploadCdrEndPoint);
        return this.http.post(this.uploadCdrEndPoint, formData);
  }
  
}

//  upload(file: File, cdrType: string, fileType: string) {
//   const form = new FormData();
//   form.append('file', file);

//   // return this.http.post(
//   //   `${this.api}?cdrType=${cdrType}&fileType=${fileType}`,
//   //   form
//   // );

//    return this.http.post(
//     `${this.api}`,form);
// }


