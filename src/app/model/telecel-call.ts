export interface TelecelCall {
    callType: string;
    ownerNumber: number;
    calledNumber: number;
    callDuration: number;
    dateTime: Date;
    imsi: string;
    imei: string;
    cellName: string;
    longitude: string;
    latitude: string;
    azimuth: number;
}
