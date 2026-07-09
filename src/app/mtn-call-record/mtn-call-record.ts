import { Component } from '@angular/core';
import { MtnCallRecordService } from '../services/mtn-call-record-service';

@Component({
  selector: 'app-mtn-call-record',
  imports: [],
  templateUrl: './mtn-call-record.html',
  styleUrl: './mtn-call-record.css',
})
export class MtnCallRecord {
file?: File;
  message = '';

  constructor(private uploadService: MtnCallRecordService) {}

  onFileSelected(event: any) {
    this.file = event.target.files[0];
  }

  upload() {
    if (!this.file) return;

    this.uploadService.upload(this.file).subscribe({
      next: () => this.message = 'Upload successful',
      error: () => this.message = 'Upload failed'
    });
  }
}
