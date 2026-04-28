import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../../features/auth/services/auth.service';

/**
 * Guard that prevents authenticated users from accessing public pages (e.g., landing page).
 * - If user is authenticated: redirects to dashboard
 * - If user is not authenticated: allows access to the route
 */
export const publicGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Check if user has a valid token
  const hasToken = authService.token();

  if (hasToken) {
    // User is authenticated, redirect to dashboard
    router.navigate(['/dashboard']);
    return false;
  }

  // User is not authenticated, allow access to public page
  return true;
};
