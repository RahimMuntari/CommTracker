import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { ResetPassword } from './reset-password';
import { routes } from '../app.routes';

describe('ResetPassword', () => {
  let component: ResetPassword;
  let fixture: ComponentFixture<ResetPassword>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResetPassword],
      providers: [
        provideRouter(routes),
        provideHttpClient(),
        provideNoopAnimations(),
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(ResetPassword);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should mark password as invalid when it lacks the required complexity', () => {
    (component as any).model.set({ password: 'abc', confirmPassword: 'abc' });

    const isFormValid = (component as any).isFormValid();
    expect(isFormValid).toBeFalsy();
  });

  it('should mark confirm password as invalid when it does not match password', () => {
    (component as any).model.set({ password: 'Abc123!@', confirmPassword: 'Different123!' });

    const isFormValid = (component as any).isFormValid();
    expect(isFormValid).toBeFalsy();
  });
});
