import { Routes } from '@angular/router';
import { rolesGuard } from '../../core/auth/guards/roles.guard';
import { canDeactivateFormFn } from '../../core/guards/form.guard';
import { PERMISSIONS } from '../../core/constants/permissions';
import { departmentResolver } from './resolvers/department.resolver';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./department-list/department-list.component').then((c) => c.DepartmentListComponent),
    canActivate: [rolesGuard],
    data: { roles: [PERMISSIONS.DEPARTMENT_VIEW] },
  },
  {
    // Also matches '/add' — `:id` captures the literal value 'add', which departmentResolver
    // and DepartmentEditionComponent.isNew() both check for. Do not add a separate static
    // 'add' route: that would stop `:id`/`value` from binding via withComponentInputBinding()
    // and the edition screen would always render as "Edit".
    path: ':id',
    loadComponent: () =>
      import('./department-edition/department-edition.component').then(
        (c) => c.DepartmentEditionComponent,
      ),
    resolve: { value: departmentResolver },
    canActivate: [rolesGuard],
    canDeactivate: [canDeactivateFormFn],
    data: { roles: [PERMISSIONS.DEPARTMENT_VIEW] },
  },
];
