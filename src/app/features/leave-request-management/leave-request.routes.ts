import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./leave-request-list/leave-request-list.component').then(
        (c) => c.LeaveRequestListComponent,
      ),
  },
  {
    path: 'add',
    loadComponent: () =>
      import('./leave-request-edition/leave-request-edition.component').then(
        (c) => c.LeaveRequestEditionComponent,
      ),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./leave-request-edition/leave-request-edition.component').then(
        (c) => c.LeaveRequestEditionComponent,
      ),
  },
];
