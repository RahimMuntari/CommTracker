export interface TelecelCallRecord {
    id: number;
    telecelSubscriberId: number;
    callType: string;
    ownerNumber: string;
    calledNumber: string;
    callDuration: number;
    dateTime: Date;
    eventDateTime: Date;
    imsi?: string;
    imei?: string;
    cellName?: string;
    longitude?: number;
    latitude?: number;
    azimuth?: number;
}
