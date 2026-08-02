import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { DefaultUrlSerializer, Router } from '@angular/router';
import { of } from 'rxjs';
import { LogInService } from './log-in-service';

describe('LogInService', () => {
  let service: LogInService;
  let routerMock: Router;
  let currentUrl = '/';
  let navigateCalls: Array<{
    commands: unknown[];
    extras?: unknown;
  }> = [];

  const serializer = new DefaultUrlSerializer();

  beforeEach(() => {
    currentUrl = '/';
    navigateCalls = [];
    routerMock = {
      parseUrl: (url: string) => serializer.parse(url),
      navigate: (commands: unknown[], extras?: unknown) => {
        navigateCalls.push({ commands, extras });
        return Promise.resolve(true);
      },
      get url() {
        return currentUrl;
      }
    } as unknown as Router;

    TestBed.configureTestingModule({
      providers: [
        LogInService,
        { provide: Router, useValue: routerMock },
        { provide: HttpClient, useValue: {} }
      ]
    });

    localStorage.clear();
    service = TestBed.inject(LogInService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should reroute to reset-password when incoming route has valid email and token', () => {
    currentUrl = '/login?email=user@example.com&token=1234567890abcdef';

    service.initializeAuth();

    expect(navigateCalls.length).toBe(1);
    expect(navigateCalls[0]).toEqual({
      commands: ['/reset-password'],
      extras: {
        queryParams: {
          email: 'user@example.com',
          token: '1234567890abcdef'
        }
      }
    });
  });

  it('should not reroute when incoming route has an invalid email', () => {
    currentUrl = '/login?email=invalid-email&token=1234567890abcdef';

    service.initializeAuth();

    expect(navigateCalls.length).toBe(0);
  });

  it('should read reset-link params from the current router URL on refresh', () => {
    currentUrl = '/reset-password?email=user@example.com&token=1234567890abcdef';
    spyOn(service, 'validateResetToken').and.returnValue(of(true));

    service.initializeAuth();

    expect(service.validateResetToken).toHaveBeenCalledWith('user@example.com', '1234567890abcdef');
    expect(navigateCalls.length).toBe(0);
  });
});
