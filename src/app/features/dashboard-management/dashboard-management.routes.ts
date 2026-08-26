import { Routes } from '@angular/router';
import { DashboardManagementComponent } from './dashboard-management.component';
import { authGuard } from '../../core/auth/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    component: DashboardManagementComponent,
    // canActivate: [authGuard],
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
      {
        path: 'employee',
        // canActivate: [authGuard],
        loadChildren: () => import('../employee-management/employee.routes').then((m) => m.routes),
      },
      {
        path: 'leave-request',
        // canActivate: [authGuard],
        loadChildren: () =>
          import('../leave-request-management/leave-request.routes').then((m) => m.routes),
      },
      {
        path: 'attendance',
        // canActivate: [authGuard],
        loadChildren: () =>
          import('../attendance-management/attendance.routes').then((m) => m.routes),
      },
      {
        path: 'payroll',
        // canActivate: [authGuard],
        loadChildren: () => import('../payroll-management/payroll.routes').then((m) => m.routes),
      },
      {
        path: 'role',
        // canActivate: [authGuard],
        loadChildren: () => import('../role-management/role.routes').then((m) => m.routes),
      },
      {
        path: 'department',
        // canActivate: [authGuard],
        loadChildren: () =>
          import('../department-management/department.routes').then((m) => m.routes),
      },
      {
        path: 'job-title',
        // canActivate: [authGuard],
        loadChildren: () =>
          import('../job-title-management/job-title.routes').then((m) => m.routes),
      },
      {
        path: 'leave-type',
        // canActivate: [authGuard],
        loadChildren: () =>
          import('../leave-type-management/leave-type.routes').then((m) => m.routes),
      },
      {
        path: 'leave-balance',
        // canActivate: [authGuard],
        loadChildren: () =>
          import('../leave-balance-management/leave-balance.routes').then((m) => m.routes),
      },
      {
        path: 'user',
        // canActivate: [authGuard],
        loadChildren: () => import('../user-management/user.routes').then((m) => m.routes),
      },
      {
        path: 'organization',
        // canActivate: [authGuard],
        loadChildren: () => import('../tenant-management/tenant.routes').then((m) => m.routes),
      },
    ],
  },
];
