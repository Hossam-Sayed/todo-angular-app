import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { AuthService, AuthResponseData } from './auth.service';
import {
  provideHttpClientTesting,
  HttpTestingController,
} from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { User } from './user.model';
import { provideHttpClient } from '@angular/common/http';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(() => {
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Router, useValue: mockRouter },
      ],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    localStorage.clear(); // Clean state before each test
  });

  afterEach(() => {
    httpMock.verify(); // Ensure no outstanding requests
  });

  // === Test: signUp ===
  it('should send a POST request on signUp and emit user data', () => {
    const dummyResponse: AuthResponseData = {
      kind: 'kind',
      idToken: 'dummyToken',
      email: 'test@example.com',
      refreshToken: 'refreshToken',
      expiresIn: '3600',
      localId: 'userId',
    };

    service.signUp('test@example.com', '123456').subscribe();

    const req = httpMock.expectOne(service.SIGN_UP_URL);
    expect(req.request.method).toBe('POST');
    req.flush(dummyResponse);

    service.user.subscribe((user) => {
      expect(user?.email).toBe('test@example.com');
      expect(user?.token).toBe('dummyToken');
    });
  });

  // === Test: login ===
  it('should send a POST request on login and emit user data', () => {
    const dummyResponse: AuthResponseData = {
      kind: 'kind',
      idToken: 'dummyToken',
      email: 'test@example.com',
      refreshToken: 'refreshToken',
      expiresIn: '3600',
      localId: 'userId',
    };

    service.login('test@example.com', '123456').subscribe();

    const req = httpMock.expectOne(service.LOGIN_URL);
    expect(req.request.method).toBe('POST');
    req.flush(dummyResponse);

    service.user.subscribe((user) => {
      expect(user?.email).toBe('test@example.com');
      expect(user?.token).toBe('dummyToken');
    });
  });

  // === Test: handle error ===
  it('should return a user-friendly error for EMAIL_EXISTS', () => {
    service.signUp('test@example.com', '123456').subscribe({
      error: (error) => {
        expect(error.message).toBe('This email already exists!');
      },
    });

    const req = httpMock.expectOne(service.SIGN_UP_URL);
    req.flush(
      { error: { message: 'EMAIL_EXISTS' } },
      { status: 400, statusText: 'Bad Request' }
    );
  });

  // === Test: autoLogin with valid data ===
  it('should auto login the user from localStorage', () => {
    const futureDate = new Date(new Date().getTime() + 3600 * 1000);
    const userData = new User(
      'test@example.com',
      'userId',
      'token123',
      futureDate
    );
    localStorage.setItem('userData', JSON.stringify(userData));

    service.autoLogin();

    service.user.subscribe((user) => {
      expect(user).toBeTruthy();
      expect(user?.email).toBe('test@example.com');
      expect(user?.token).toBe('token123');
    });
  });

  // === Test: logout ===
  it('should clear user and localStorage on logout', () => {
    const spy = spyOn(localStorage, 'removeItem').and.callThrough();

    service.logout();

    service.user.subscribe((user) => {
      expect(user).toBeNull();
    });

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/auth']);
    expect(spy).toHaveBeenCalledWith('userData');
  });

  // === Test: autoLogout ===
  it('should logout after expiration time (simulated)', fakeAsync(() => {
    spyOn(service, 'logout');
    service.autoLogout(1000);

    tick(1000); // fast-forward timer
    expect(service.logout).toHaveBeenCalled();
  }));
});
