import { Routes } from '@angular/router';
import { AuthComponent } from './auth/auth.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { NotFoundComponent } from './not-found/not-found.component';
import { AuthGuard } from './auth/auth.guard';
import { LoginGuard } from './auth/login.guard';

export const routes: Routes = [
  // Redirect to dashboard by default
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

  // Auth screen
  {
    path: 'auth',
    component: AuthComponent,
    canActivate: [LoginGuard],
  },

  // Dashboard screen (the actual todos UI)
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuard],
  },

  // Wildcard
  { path: '**', component: NotFoundComponent },
];
