import { Routes } from '@angular/router';
import { DashboardManagementComponent } from './dashboard-management.component';
import { authGuard } from '../../core/auth/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    component: DashboardManagementComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full',
      },
      {
        path: 'home',
        loadComponent: () =>
          import('./components/dashboard/dashboard.component').then((c) => c.DashboardComponent),
      },
      //   {
      //     path: 'signup',
      //     loadComponent: () =>
      //       import('./components/signup-page/signup-page.component').then(
      //         (c) => c.SignupPageComponent,
      //       ),
      //   },
    ],
  },
];
