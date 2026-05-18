import { TestBed } from '@angular/core/testing';

import { TelecelMomo } from './telecel-momo';

describe('TelecelMomo', () => {
  let service: TelecelMomo;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TelecelMomo);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
