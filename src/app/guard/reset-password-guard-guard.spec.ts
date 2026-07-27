import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { resetPasswordGuardGuard } from './reset-password-guard-guard';

describe('resetPasswordGuardGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => resetPasswordGuardGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
