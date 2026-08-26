import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./payroll-list/payroll-list.component').then((c) => c.PayrollListComponent),
  },
  {
    path: 'add',
    loadComponent: () =>
      import('./payroll-edition/payroll-edition.component').then(
        (c) => c.PayrollEditionComponent,
      ),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./payroll-edition/payroll-edition.component').then(
        (c) => c.PayrollEditionComponent,
      ),
  },
];
