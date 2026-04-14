export interface MtnMomo {
    transactionDate: Date;
    dateTime: Date;
    fromAccount: string;
    fromAccountName: string;
    toAccount: string;
    toAccountName: string;
    fromPhoneNumber: string;
    transactionType: string;
    fromAmount: number;
    fromFeeAmount: number;
    toFeeAmount: number;
    toAmount: number;
    tax: number;
    BalanceBeforeAmount: number;
    BalanceAfterAmount: number;
   toMsIsdn: string;
   financialId: string;
   message: string;
}
