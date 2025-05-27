import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, catchError, Subject, tap, throwError } from 'rxjs';
import { User } from './user.model';
import { Router } from '@angular/router';

export interface AuthResponseData {
  kind: string;
  idToken: string;
  email: string;
  refreshToken: string;
  expiresIn: string;
  localId: string;
  registred?: boolean;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  API_KEY = 'AIzaSyAtRB4XiOSWmzbz4iveFRV4BR1bByRa1kQ';
  SIGN_UP_URL = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${this.API_KEY}`;
  LOGIN_URL = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${this.API_KEY}`;

  httpClient = inject(HttpClient);
  router = inject(Router);
  user = new BehaviorSubject<User | null>(null);
  private tokenExpirationTimer: any;

  signUp(email: string, password: string) {
    return this.httpClient
      .post<AuthResponseData>(this.SIGN_UP_URL, {
        email,
        password,
        returnSecureToken: true,
      })
      .pipe(
        catchError(this.handleError),
        tap((resData) => {
          this.handleAuthentication(
            resData.email,
            resData.localId,
            resData.idToken,
            +resData.expiresIn
          );
        })
      );
  }

  login(email: string, password: string) {
    return this.httpClient
      .post<AuthResponseData>(this.LOGIN_URL, {
        email,
        password,
        returnSecureToken: true,
      })
      .pipe(
        catchError(this.handleError),
        tap((resData) => {
          console.log(resData);

          this.handleAuthentication(
            resData.email,
            resData.localId,
            resData.idToken,
            +resData.expiresIn
          );
        })
      );
  }

  autoLogin() {
    const user = localStorage.getItem('userData');
    if (user) {
      const userData: {
        email: string;
        id: string;
        _token: string;
        _expirationDate: string;
      } = JSON.parse(user);

      if (!userData) return;

      const loadedUser = new User(
        userData.email,
        userData.id,
        userData._token,
        new Date(userData._expirationDate)
      );

      if (loadedUser.token) {
        this.user.next(loadedUser);
        const expirationDuration =
          new Date(userData._expirationDate).getTime() - new Date().getTime();
        this.autoLogout(expirationDuration);
      }
    }
  }

  logout() {
    this.user.next(null);
    this.router.navigate(['/auth']);
    localStorage.removeItem('userData');
    if (this.tokenExpirationTimer) clearTimeout(this.tokenExpirationTimer);
    this.tokenExpirationTimer = null;
  }

  autoLogout(expirationDuration: number) {
    this.tokenExpirationTimer = setTimeout(() => {
      this.logout();
    }, expirationDuration);
  }

  handleAuthentication(
    email: string,
    userId: string,
    token: string,
    expiresIn: number
  ) {
    const expirationDate = new Date(new Date().getTime() + expiresIn * 1000);
    const user = new User(email, userId, token, expirationDate);
    this.user.next(user);
    this.autoLogout(expiresIn * 1000);
    localStorage.setItem('userData', JSON.stringify(user));
  }

  private handleError(errorRes: HttpErrorResponse) {
    console.log(errorRes);

    let errorMessage = 'An unkown error occurred!';
    if (!errorRes.error || !errorRes.error.error) {
      return throwError(() => new Error(errorMessage));
    }
    switch (errorRes.error.error.message) {
      case 'EMAIL_EXISTS':
        errorMessage = 'This email already exists!';
        break;
      case 'INVALID_LOGIN_CREDENTIALS':
        errorMessage = 'Invalid login credentials!';
        break;
      case 'INVALID_EMAIL':
        errorMessage = 'Invalid email address!';
        break;
      case 'EMAIL_NOT_FOUND':
        errorMessage = "This email doesn't exist";
        break;
      case 'INVALID_PASSWORD':
        errorMessage = 'The password is incorrect';
    }
    return throwError(() => new Error(errorMessage));
  }
}
