import { Routes } from '@angular/router';
import { publicGuard } from './core/auth/guards/public.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '',
    pathMatch: 'full',
  },
  {
    path: '',
    // canActivate: [publicGuard],
    loadComponent: () =>
      import('./features/landing-page/landing-page.component').then((c) => c.LandingPageComponent),
  },
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then((m) => m.routes),
  },
  {
    path: 'dashboard',
    loadChildren: () =>
      import('./features/dashboard-management/dashboard-management.routes').then((m) => m.routes),
  },
  {
    path: '**',
    loadComponent: () =>
      import('./shared/not-found/not-found.component').then((c) => c.NotFoundComponent),
  },
];
