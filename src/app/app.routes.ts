import { Routes } from '@angular/router';
import { AuthComponent } from './auth/auth.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { NotFoundComponent } from './not-found/not-found.component';

export const routes: Routes = [
  // Redirect to dashboard by default
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

  // Auth screen
  { path: 'auth', component: AuthComponent },

  // Dashboard screen (the actual todos UI)
  {
    path: 'dashboard',
    component: DashboardComponent,
  },

  // Wildcard (optional, fallback for unknown routes)
  { path: '**', component: NotFoundComponent },
];
