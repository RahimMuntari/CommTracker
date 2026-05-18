import { TestBed } from '@angular/core/testing';

import { MtnMomo } from './mtn-momo';

describe('MtnMomo', () => {
  let service: MtnMomo;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MtnMomo);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
