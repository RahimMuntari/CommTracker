import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, Signal } from '@angular/core';
import { Observable } from 'rxjs';
import { FileType, MdrUploadFormModel, Provider } from '../mdr-upload-form-model';
import { environment } from '../../environments/environment.development';

@Injectable({
  providedIn: 'root',
})
export class UploadMomoServices {
  private baseUrl = '/api/cdr/uploadmomo';

   private api = `${environment.apiUrl}`;

  constructor(private http: HttpClient) {}

  uploadMdr(formData: Signal<MdrUploadFormModel>): Observable<any> {
    
    // formData.append('provider', formData.get('provider') as string);
    // formData.append('fileType', formData.get('fileType') as string);
    // formData.append('file', formData.get('file') as File);
    const formDataObj = formData();
    console.log('Uploading with form data:', formDataObj.file, formDataObj.provider, formDataObj.fileType);
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    };

     // 1. Create a native FormData container
    const formDataUpload = new FormData();

    // 2. Extract values from signals and append them
    formDataUpload.append('provider', formDataObj.provider);
    formDataUpload.append('fileType', formDataObj.fileType);
    
    // 3. Append the physical binary file
    formDataUpload.append('file', formDataObj?.file ?? new Blob(), formDataObj?.file?.name ?? 'file');
    
    //console.log('Uploading with params:', formData.append('provider', formData.get('provider') as string), formData.append('fileType', formData.get('fileType') as string), formData.append('file', formData.get('file') as File));
    return this.http.post<any>(this.api + "/cdr/uploadmomo", formDataUpload);
    
  }

}
