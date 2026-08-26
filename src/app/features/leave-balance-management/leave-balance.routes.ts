import { Routes } from '@angular/router';
import { rolesGuard } from '../../core/auth/guards/roles.guard';
import { canDeactivateFormFn } from '../../core/guards/form.guard';
import { PERMISSIONS } from '../../core/constants/permissions';
import { leaveBalanceResolver } from './resolvers/leave-balance.resolver';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./leave-balance-list/leave-balance-list.component').then(
        (c) => c.LeaveBalanceListComponent,
      ),
    canActivate: [rolesGuard],
    data: { roles: [PERMISSIONS.LEAVE_VIEW] },
  },
  {
    // No 'add' route — balances are lazily created server-side per active leave type,
    // never manually created here (see LeaveBalanceService's doc comment).
    path: ':id',
    loadComponent: () =>
      import('./leave-balance-edition/leave-balance-edition.component').then(
        (c) => c.LeaveBalanceEditionComponent,
      ),
    resolve: { value: leaveBalanceResolver },
    canActivate: [rolesGuard],
    canDeactivate: [canDeactivateFormFn],
    // Adjusting requires leave.manage_balance specifically (see backend-hrms's
    // leaveBalance.routes.ts) — viewing only needs leave.view, but since this screen only
    // exists to adjust, gate the route itself on the stricter permission.
    data: { roles: [PERMISSIONS.LEAVE_MANAGE_BALANCE] },
  },
];
