export interface MtnMomoTransaction {
        id: number;
        StatementId: number;
        TransactionDate?: Date;
        TransactionDateTime?: Date;
        FromAccount?: string;
        FromAccountName?: string;
        FromPhoneNumber?: string;
        TransactionType?: string;
        FromAmount?: number;
        FromFeeAmount?: number;
        ToFeeAmount?: number;
        Tax?: number;
        BalanceBeforeAmount?: number;
        BalanceAfterAmount?: number;
        ToAccount?: string;
        ToAccountName?: string;
        ToMsisdn?: string;
        FinancialId?: string;
        Message?: string;
        SourcePageNumber: number;
        SourceRowNumber: number;
}
