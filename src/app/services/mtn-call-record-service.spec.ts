import { TestBed } from '@angular/core/testing';

import { MtnCallRecordService } from './mtn-call-record-service';

describe('MtnCallRecordService', () => {
  let service: MtnCallRecordService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MtnCallRecordService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
