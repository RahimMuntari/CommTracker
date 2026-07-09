import { TestBed } from '@angular/core/testing';

import { UploadMomoServices } from './upload-momo-services';

describe('UploadMomoServices', () => {
  let service: UploadMomoServices;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UploadMomoServices);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
