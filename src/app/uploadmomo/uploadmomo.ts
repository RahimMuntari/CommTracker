import { Component } from '@angular/core';
import { MdrUploadFormModel } from '../mdr-upload-form-model';
import { UploadMomoServices } from '../services/upload-momo-services';

@Component({
  selector: 'app-uploadmomo',
  imports: [],
  templateUrl: './uploadmomo.html',
  styleUrls: ['./uploadmomo.css'],
})
export class Uploadmomo {

  model = new MdrUploadFormModel();

  constructor(private service: UploadMomoServices) {}  

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.model.file.set(file);
  }

  onSubmit() {
    const file = this.model.file();
    if (!file) return;

    this.service.uploadMdr(this.model.provider(),this.model.fileType(),file).subscribe({
      next: res => console.log('Uploaded', res),
      error: err => console.error(err)
    });
  }

}
