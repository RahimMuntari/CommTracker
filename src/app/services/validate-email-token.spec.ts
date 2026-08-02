import { TestBed } from '@angular/core/testing';

import { ValidateEmailToken } from './validate-email-token';

describe('ValidateEmailToken', () => {
  let service: ValidateEmailToken;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ValidateEmailToken);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
