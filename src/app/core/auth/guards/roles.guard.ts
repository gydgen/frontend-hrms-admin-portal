import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../../features/auth/services/auth.service';

/**
 * Route-level permission gate. Usage: `canActivate: [rolesGuard], data: { roles: [PERMISSIONS.DEPARTMENT_VIEW] }`.
 * Requires ALL listed permissions (or the admin role) — see `AuthService.hasPermissionsOrAdmin`.
 */
export const rolesGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const roles = (route.data['roles'] as string[]) ?? [];
  if (roles.length === 0 || authService.hasPermissionsOrAdmin(roles)) return true;
  return router.createUrlTree(['/dashboard']);
};
