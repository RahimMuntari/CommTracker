import { computed, signal } from "@angular/core";

export type ProviderType = 'mtn' | 'telecel';
export type FileType = 'pdf' | 'excel';

export class MdrUploadFormModel {

    provider = signal<ProviderType>('mtn');
    fileType = signal<FileType>('pdf');
    file = signal<File | null>(null);

    canSubmit = computed(() => !!this.file());
}
