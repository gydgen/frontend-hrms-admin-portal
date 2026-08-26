/**
 * A role assigned to a user, as returned by `GET /api/auth/me`. `slug` matches
 * backend-hrms's `SYSTEM_ROLE_SLUGS` for seeded system roles (e.g. 'super-admin').
 */
export interface Role {
  id: string;
  name: string;
  slug: string;
}

/**
 * Represents the authenticated user, as returned by `GET /api/auth/me` (see
 * backend-hrms's `AuthController.me`).
 *
 * @property permissions - Flat permission strings (e.g. 'department.view') resolved
 *   fresh from the user's active roles on every call — this, not `roles`, is the
 *   actual authorization key checked by `AuthService.hasPermissions`/`*hasRole`.
 * @property dataScope - Broadest data-visibility scope among the user's active roles
 *   (e.g. 'TENANT', 'DEPARTMENT', 'OWN'), or null if they hold no active role.
 * @property roles - The user's active roles, for display purposes (e.g. an account
 *   settings page) — not itself used for permission checks.
 */
export interface User {
  id: string;
  tenantId: string;
  firstName: string;
  lastName: string;
  email: string;
  status: 'ACTIVE' | 'PENDING' | 'SUSPENDED' | 'DEACTIVATED';
  isOrgOwner: boolean;
  invitedBy: string | null;
  createdAt: string;
  updatedAt: string;
  permissions: string[];
  dataScope: string | null;
  roles: Role[];
}
