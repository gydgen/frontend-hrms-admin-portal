import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./attendance-list/attendance-list.component').then((c) => c.AttendanceListComponent),
  },
  {
    path: 'add',
    loadComponent: () =>
      import('./attendance-edition/attendance-edition.component').then(
        (c) => c.AttendanceEditionComponent,
      ),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./attendance-edition/attendance-edition.component').then(
        (c) => c.AttendanceEditionComponent,
      ),
  },
];
