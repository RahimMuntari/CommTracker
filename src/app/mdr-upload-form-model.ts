export type Provider = 'MTN' | 'Telecel';
export type FileType = 'pdf' | 'excel';


export interface MdrUploadFormModel {

    provider: Provider | '';
    fileType: FileType | '';
    file: File | null;
}
