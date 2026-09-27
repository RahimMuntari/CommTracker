import { MtnSubscriberInfo } from "./mtn-subscriber-info";

export interface MtnCallRecord {
  id: number;
  headerId: number;
  msisdnKey: string;
  imsi: string;
//   subscribers: MtnSubscriberInfo;
  eventDateTime: Date;
  direction: string;
  callDirection: string;
  callingNo: string;
  calledNo: string;
  usageType: string;
  duration: number;
  imei: string;
  locationId: string;
  region: string;
  district: string;
  city: string;
  firstSiteName: string;
  tblDt: Date;
  longitude: number;
  latitude: number;
  azimuth: number;
}
