import { Routes } from '@angular/router';
import { AuthWrapperComponent } from './components/auth-wrapper/auth-wrapper.component';

export const routes: Routes = [
  {
    path: '',
    component: AuthWrapperComponent,
    // canActivateChild: [authGuard],
    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('./components/login-page/login-page.component').then((c) => c.LoginPageComponent),
      },
      {
        path: 'signup',
        loadComponent: () =>
          import('./components/signup-page/signup-page.component').then(
            (c) => c.SignupPageComponent,
          ),
      },
    ],
  },
];
