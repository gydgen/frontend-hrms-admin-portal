import { Routes } from '@angular/router';
import { rolesGuard } from '../../core/auth/guards/roles.guard';
import { canDeactivateFormFn } from '../../core/guards/form.guard';
import { PERMISSIONS } from '../../core/constants/permissions';
import { leaveTypeResolver } from './resolvers/leave-type.resolver';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./leave-type-list/leave-type-list.component').then((c) => c.LeaveTypeListComponent),
    canActivate: [rolesGuard],
    data: { roles: [PERMISSIONS.LEAVETYPE_VIEW] },
  },
  {
    // Also matches '/add' — `:id` captures the literal value 'add', which leaveTypeResolver
    // and LeaveTypeEditionComponent.isNew() both check for. Do not add a separate static
    // 'add' route: that would stop `:id`/`value` from binding via withComponentInputBinding()
    // and the edition screen would always render as "Edit".
    path: ':id',
    loadComponent: () =>
      import('./leave-type-edition/leave-type-edition.component').then(
        (c) => c.LeaveTypeEditionComponent,
      ),
    resolve: { value: leaveTypeResolver },
    canActivate: [rolesGuard],
    canDeactivate: [canDeactivateFormFn],
    data: { roles: [PERMISSIONS.LEAVETYPE_VIEW] },
  },
];
