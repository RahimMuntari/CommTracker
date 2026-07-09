export type Provider = 'MTN' | 'Telecel';
export type FileType = 'pdf' | 'excel';

export interface Uploadcallmodel {
    provider: Provider | '';
    fileType: FileType | '';
    file: File | null;
}
