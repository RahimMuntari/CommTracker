import { Component, computed, signal } from '@angular/core';
import { FileType, MdrUploadFormModel, Provider } from '../mdr-upload-form-model';
import { UploadMomoServices } from '../services/upload-momo-services';

@Component({
  selector: 'app-uploadmomo',
  imports: [],
  templateUrl: './uploadmomo.html',
  styleUrls: ['./uploadmomo.css'],
})
export class Uploadmomo {

  cdrType = signal<Provider>('Telecel');
  fileType = signal<'pdf' | 'excel'>('pdf');
  file = signal<File | null>(null);

  message = signal('');
  uploading = signal(false);

  formValid = computed(() => this.form().file !== null);
  
  constructor(private service: UploadMomoServices) {}  

   form = signal<MdrUploadFormModel>({
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

 onProviderChange(event: Event) {
   const select = event.target as HTMLSelectElement;
   this.form.update(f => ({ ...f, provider: select.value as Provider }));
   console.log('Provider changed to:', select.value);
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

  onSubmit() {
    const value = this.form();
    if (!value.file || !value.provider || !value.fileType) return;
    this.message.set('');
    this.uploading.set(true);
    
    const formData = new FormData();
    formData.append('provider', value.provider);
    formData.append('fileType', value.fileType);
    formData.append('file', value.file );

    console.log('Uploading with form data:', formData.get('file'), formData.get('provider'), formData.get('fileType'));

    this.service.uploadMdr(this.form).subscribe({
      next: res => {
        console.log('Uploaded', res);
          this.message.set('Upload successful');
        this.uploading.set(false);
      },
      error: err => {
        console.error(err);
         this.message.set('Upload failed');
        this.uploading.set(false);
      }
    });
  }

}
