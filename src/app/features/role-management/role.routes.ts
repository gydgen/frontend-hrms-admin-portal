import { Routes } from '@angular/router';
import { rolesGuard } from '../../core/auth/guards/roles.guard';
import { canDeactivateFormFn } from '../../core/guards/form.guard';
import { PERMISSIONS } from '../../core/constants/permissions';
import { roleResolver } from './resolvers/role.resolver';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./role-list/role-list.component').then((c) => c.RoleListComponent),
    canActivate: [rolesGuard],
    data: { roles: [PERMISSIONS.ROLE_VIEW] },
  },
  {
    // Also matches '/add' — `:id` captures the literal value 'add', which roleResolver
    // and RoleEditionComponent.isNew() both check for. Do not add a separate static
    // 'add' route: that would stop `:id`/`value` from binding via withComponentInputBinding()
    // and the edition screen would always render as "Edit".
    path: ':id',
    loadComponent: () => import('./role-edition/role-edition.component').then((c) => c.RoleEditionComponent),
    resolve: { value: roleResolver },
    canActivate: [rolesGuard],
    canDeactivate: [canDeactivateFormFn],
    data: { roles: [PERMISSIONS.ROLE_VIEW] },
  },
];
