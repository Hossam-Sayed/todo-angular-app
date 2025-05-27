import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';
import { exhaustMap, take } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  return authService.user.pipe(
    take(1),
    exhaustMap((user) => {
      console.log('Interceptor called');

      if (!user?.token) return next(req);

      const modifiedReq = req.clone({
        headers: req.headers.set('Authorization', `Bearer ${user.token}`),
      });

      return next(modifiedReq);
    })
  );
};
