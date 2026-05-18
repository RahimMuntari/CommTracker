import { required, schema } from "@angular/forms/signals";

export interface MtnCall {
    eventDateTime: Date;
    callDirection: string;
    callingNo: number;
    calledNo: number;
    usageType: string;  
    duration: number;   
    imei: string;
    locationId: string;
    region: string;
    district: string;
    city: string;   
    firstSiteName: string;  
    tbldt: string;
    imsi: string;
    long: string;
    lat: string;
    azimuth: string;    

}

export const initialData: MtnCall = {
    eventDateTime: new Date,
    callDirection: "",
    callingNo: 0,
    calledNo: 0,
    usageType: "",
    duration: 0,
    imei: "",
    locationId: "",
    region: "",
    district: "",
    city: "",   
    firstSiteName: "",
    tbldt: "",
    imsi: "",
    long: "",
    lat: "",
    azimuth: "",
}

export const mtnCallSchema = schema<MtnCall>(rootPath => {
    required(rootPath.calledNo, {message: "Called No is a required field"});
    required(rootPath.callingNo, {message: "Calling No is required field"});
    required(rootPath.imei, {message: "IMEI No is arequired field"});
    required(rootPath.callDirection, {message: "Call Direction is a required field"});
});
