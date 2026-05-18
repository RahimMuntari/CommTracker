import { TestBed } from '@angular/core/testing';

import { TelecelCall } from './telecel-call';

describe('TelecelCall', () => {
  let service: TelecelCall;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TelecelCall);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
