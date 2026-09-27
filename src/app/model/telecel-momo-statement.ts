export interface TelecelMomoStatement {
     id: number;
     OriginalFileName?: string;
     AccountHolder?: string;
     Msisdn?: string;
     PeriodFrom?: Date;
     PeriodTo?: Date;
     ImportedAtUtc: Date;
}
