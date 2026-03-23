import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./components/login-page/login-page').then((c) => c.LoginPage),
  },
  {
    path: 'signup',
    loadComponent: () => import('./components/signup-page/signup-page').then((c) => c.SignupPage),
  },
];
