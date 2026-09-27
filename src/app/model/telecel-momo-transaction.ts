export interface TelecelMomoTransaction {
    id: number;
    telecelMomoStatementId: number;
    receiptNo?: string;
    completionTime?: Date;
    initiationTime?: Date;
    details?: string;
    transactionStatus?: string;
    paidIn?: number;
    withdrawn?: number;
    balance?: number;
    reasonType?: string;
    oppositeParty?: string;
    sourcePageNumber: number;
    sourceRowNumber: number;
}
