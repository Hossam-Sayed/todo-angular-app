import { inject, Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { AuthService } from './auth.service';
import { map, Observable, take } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class LoginGuard implements CanActivate {
  private router = inject(Router);
  private authService = inject(AuthService);

  canActivate():
    | boolean
    | UrlTree
    | Promise<boolean | UrlTree>
    | Observable<boolean | UrlTree> {
    return this.authService.user.pipe(
      take(1),
      map((user) => {
        if (user) {
          return this.router.createUrlTree(['/dashboard']);
        }
        return true;
      })
    );
  }
}
