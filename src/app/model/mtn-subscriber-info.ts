export interface MtnSubscriberInfo {
    id: number;
    msisdnKey: string;
    imsi: string;
    fullName: string;
    idType: string;
    idNumber: string;
    birthDate: Date;
    actYearSim: number;
    fromDate: Date;
    toDate: Date;

    // mtnCallRecords: MtnCallRecord[];
}

import { MtnCallRecord } from "./mtn-call-record";  
