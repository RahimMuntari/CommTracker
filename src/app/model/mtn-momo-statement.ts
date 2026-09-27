export interface MtnMomoStatement {
    id: number;
    customerNumber: string;
    firstName: string;
    surname: string ;
    companyName?: string;
    profile?: string;
    fromDate?: Date;
    toDate?: Date;
    originalFileName: string;
    importedAtUtc: Date;

}
