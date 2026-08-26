import { Routes } from '@angular/router';
import { rolesGuard } from '../../core/auth/guards/roles.guard';
import { canDeactivateFormFn } from '../../core/guards/form.guard';
import { PERMISSIONS } from '../../core/constants/permissions';
import { employeeResolver } from './resolvers/employee.resolver';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./employee-list/employee-list.component').then((c) => c.EmployeeListComponent),
    canActivate: [rolesGuard],
    data: { roles: [PERMISSIONS.EMPLOYEE_VIEW] },
  },
  {
    // Also matches '/add' — `:id` captures the literal value 'add', which employeeResolver
    // and EmployeeEditionComponent.isNew() both check for. Do not add a separate static
    // 'add' route: that would stop `:id`/`value` from binding via withComponentInputBinding()
    // and the edition screen would always render as "Edit".
    path: ':id',
    loadComponent: () =>
      import('./employee-edition/employee-edition.component').then(
        (c) => c.EmployeeEditionComponent,
      ),
    resolve: { value: employeeResolver },
    canActivate: [rolesGuard],
    canDeactivate: [canDeactivateFormFn],
    data: { roles: [PERMISSIONS.EMPLOYEE_VIEW] },
  },
];
