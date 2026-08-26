import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./user-list/user-list.component').then((c) => c.UserListComponent),
  },
  {
    path: 'add',
    loadComponent: () =>
      import('./user-invite/user-invite.component').then((c) => c.UserInviteComponent),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./user-detail/user-detail.component').then((c) => c.UserDetailComponent),
  },
];
