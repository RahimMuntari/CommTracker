import { Component, computed, signal } from '@angular/core';
import { UploadService } from '../services/upload-service';
import type { Uploadcallmodel, Provider, FileType } from '../model/uploadcallmodel';

@Component({
  selector: 'app-uploadcall',
  imports: [],
  templateUrl: './uploadcall.html',
  styleUrl: './uploadcall.css',
})
export class Uploadcall {

  cdrType = signal<'mtn' | 'telecel'>('telecel');
  fileType = signal<'pdf' | 'excel'>('pdf');
  file = signal<File | null>(null);

  message = signal('');
  uploading = signal(false);

  formValid = computed(() => this.form().file !== null);

  constructor(private uploadService: UploadService) {}

   form = signal<Uploadcallmodel>({
    provider: '',
    fileType: '',
    file: null
  });

  accept = computed(() => {
    const ft = this.form().fileType;
    if (ft === 'pdf') return '.pdf,application/pdf';
    if (ft === 'excel') return '.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel';
    return '';
  });

  // onProviderChange(provider: Provider) {
  //   this.form.update(f => ({ ...f, provider }));
  // }

  onProviderChange(event: Event) {
  const select = event.target as HTMLSelectElement;
  this.form.update(f => ({ ...f, provider: select.value as Provider }));
}

onFileTypeChange(event: Event) {
  const select = event.target as HTMLSelectElement;
  this.form.update(f => ({ ...f, fileType: select.value as FileType, file: null }));
}

onFileSelected(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0] ?? null;
  this.form.update(f => ({ ...f, file }));
}  

upload() {
    const value = this.form();
    if (!value.provider || !value.fileType || !value.file) return;
    this.message.set('');
    this.uploading.set(true);
    //console.log('Uploading with values:', value);
    const formData = new FormData();
    formData.append('provider', value.provider);
    formData.append('fileType', value.fileType);
    formData.append('file', value.file);

    this.uploadService.upload(formData).subscribe({
      next: (response: any) => {
        // 1. Handles Results.Ok
        const successMsg = response?.message || 'Upload successful';
        this.message.set(successMsg);
        this.uploading.set(false);
        
        // Optional: Capture additional success metrics
        console.log(`Processed ${response?.recordsProcessed} records for ${response?.subscriber}`);
      },
      error: (httpError: any) => {
        this.uploading.set(false);
        
        // Extract backend payload from the HttpErrorResponse
        const errorBody = httpError.error;
        console.error('Upload error:', errorBody);
        // 2. Handles Results.Problem (RFC 7807 Standard)
        if (errorBody && errorBody.detail) {
          this.message.set(`${errorBody.title}: ${errorBody.detail}`);
          return;
        }

        // 3. Handles custom Results.BadRequest shapes
        if (errorBody && errorBody.message) {
          const details = errorBody.details || errorBody.error || '';
          this.message.set(`${errorBody.message} ${details}`);
          return;
        }

        // Fallback if the server drops completely or returns a raw string
        this.message.set('An unexpected network error occurred.');
      }
    });


    // this.uploadService.upload(formData).subscribe({
    //   next: () => {
    //     this.message.set('Upload successful');
    //     this.uploading.set(false);
    //   },
    //   error: () => {
    //     this.message.set('Upload failed');
    //     this.uploading.set(false);
    //   }
    // });
    // //this.http.post('/api/cdr/upload', formData).subscribe();
  }
}
