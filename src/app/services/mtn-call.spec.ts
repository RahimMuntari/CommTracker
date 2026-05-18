import { TestBed } from '@angular/core/testing';

import { MtnCall } from './mtn-call';

describe('MtnCall', () => {
  let service: MtnCall;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MtnCall);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
