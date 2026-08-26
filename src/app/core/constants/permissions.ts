/**
 * Mirrors backend-hrms/src/shared/utils/permissions.ts's `PERMISSIONS` catalog exactly.
 * Used to gate routes (`rolesGuard` + `data.roles`) and template actions (`*hasRole`)
 * with the same permission strings the backend's `requirePermission` middleware checks —
 * never hand-write a permission string inline, import it from here.
 */
export const PERMISSIONS = {
  ROLE_VIEW: 'role.view',
  ROLE_CREATE: 'role.create',
  ROLE_UPDATE: 'role.update',
  ROLE_DELETE: 'role.delete',
  ROLE_ASSIGN: 'role.assign',
  ROLE_MANAGE_PERMISSIONS: 'role.manage_permissions',

  USER_VIEW: 'user.view',
  USER_INVITE: 'user.invite',
  USER_SUSPEND: 'user.suspend',
  USER_DEACTIVATE: 'user.deactivate',

  TENANT_MANAGE: 'tenant.manage',

  DEPARTMENT_VIEW: 'department.view',
  DEPARTMENT_CREATE: 'department.create',
  DEPARTMENT_UPDATE: 'department.update',
  DEPARTMENT_DELETE: 'department.delete',

  JOBTITLE_VIEW: 'jobtitle.view',
  JOBTITLE_CREATE: 'jobtitle.create',
  JOBTITLE_UPDATE: 'jobtitle.update',
  JOBTITLE_DELETE: 'jobtitle.delete',

  EMPLOYEE_VIEW: 'employee.view',
  EMPLOYEE_CREATE: 'employee.create',
  EMPLOYEE_UPDATE: 'employee.update',
  EMPLOYEE_DELETE: 'employee.delete',
  EMPLOYEE_MANAGE_SENSITIVE: 'employee.manage_sensitive',

  LEAVETYPE_VIEW: 'leavetype.view',
  LEAVETYPE_CREATE: 'leavetype.create',
  LEAVETYPE_UPDATE: 'leavetype.update',
  LEAVETYPE_DELETE: 'leavetype.delete',

  LEAVE_VIEW: 'leave.view',
  LEAVE_CREATE: 'leave.create',
  LEAVE_APPROVE: 'leave.approve',
  LEAVE_REJECT: 'leave.reject',
  LEAVE_CANCEL: 'leave.cancel',
  LEAVE_MANAGE_BALANCE: 'leave.manage_balance',

  // Reserved — no backend route enforces these yet (no Payroll module exists in backend-hrms).
  PAYROLL_VIEW: 'payroll.view',
  PAYROLL_MANAGE: 'payroll.manage',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

/** Mirrors backend-hrms's `MODULES`. */
export const MODULES = {
  ROLES: 'roles',
  USERS: 'users',
  TENANT: 'tenant',
  DEPARTMENTS: 'departments',
  JOBTITLES: 'jobtitles',
  EMPLOYEES: 'employees',
  LEAVETYPES: 'leavetypes',
  LEAVE: 'leave',
  PAYROLL: 'payroll',
} as const;

export type Module = (typeof MODULES)[keyof typeof MODULES];

/**
 * Mirrors backend-hrms's `MODULE_PERMISSION_CATALOG` — the set of permissions valid
 * under each module, used to render the role-management permission matrix.
 *
 * Hand-copied rather than fetched from an endpoint (there isn't one exposing this yet),
 * so this silently drifts if the backend catalog changes — a small `GET` endpoint
 * returning it dynamically would close that gap; flagged for later review rather than
 * built now.
 */
export const MODULE_PERMISSION_CATALOG: Record<Module, readonly Permission[]> = {
  [MODULES.ROLES]: [
    PERMISSIONS.ROLE_VIEW, PERMISSIONS.ROLE_CREATE, PERMISSIONS.ROLE_UPDATE,
    PERMISSIONS.ROLE_DELETE, PERMISSIONS.ROLE_ASSIGN, PERMISSIONS.ROLE_MANAGE_PERMISSIONS,
  ],
  [MODULES.USERS]: [
    PERMISSIONS.USER_VIEW, PERMISSIONS.USER_INVITE, PERMISSIONS.USER_SUSPEND, PERMISSIONS.USER_DEACTIVATE,
  ],
  [MODULES.TENANT]: [PERMISSIONS.TENANT_MANAGE],
  [MODULES.DEPARTMENTS]: [
    PERMISSIONS.DEPARTMENT_VIEW, PERMISSIONS.DEPARTMENT_CREATE, PERMISSIONS.DEPARTMENT_UPDATE, PERMISSIONS.DEPARTMENT_DELETE,
  ],
  [MODULES.JOBTITLES]: [
    PERMISSIONS.JOBTITLE_VIEW, PERMISSIONS.JOBTITLE_CREATE, PERMISSIONS.JOBTITLE_UPDATE, PERMISSIONS.JOBTITLE_DELETE,
  ],
  [MODULES.EMPLOYEES]: [
    PERMISSIONS.EMPLOYEE_VIEW, PERMISSIONS.EMPLOYEE_CREATE, PERMISSIONS.EMPLOYEE_UPDATE, PERMISSIONS.EMPLOYEE_DELETE,
    PERMISSIONS.EMPLOYEE_MANAGE_SENSITIVE,
  ],
  [MODULES.LEAVETYPES]: [
    PERMISSIONS.LEAVETYPE_VIEW, PERMISSIONS.LEAVETYPE_CREATE, PERMISSIONS.LEAVETYPE_UPDATE, PERMISSIONS.LEAVETYPE_DELETE,
  ],
  [MODULES.LEAVE]: [
    PERMISSIONS.LEAVE_VIEW, PERMISSIONS.LEAVE_CREATE, PERMISSIONS.LEAVE_APPROVE,
    PERMISSIONS.LEAVE_REJECT, PERMISSIONS.LEAVE_CANCEL, PERMISSIONS.LEAVE_MANAGE_BALANCE,
  ],
  [MODULES.PAYROLL]: [PERMISSIONS.PAYROLL_VIEW, PERMISSIONS.PAYROLL_MANAGE],
};

/** Display name per module, for the permission matrix's section headers. */
export const MODULE_LABELS: Record<Module, string> = {
  [MODULES.ROLES]: 'Roles',
  [MODULES.USERS]: 'Users',
  [MODULES.TENANT]: 'Organization',
  [MODULES.DEPARTMENTS]: 'Departments',
  [MODULES.JOBTITLES]: 'Job Titles',
  [MODULES.EMPLOYEES]: 'Employees',
  [MODULES.LEAVETYPES]: 'Leave Types',
  [MODULES.LEAVE]: 'Leave',
  [MODULES.PAYROLL]: 'Payroll',
};

/**
 * Turns a permission string into a short checkbox label, e.g. 'employee.manage_sensitive'
 * -> 'Manage sensitive'. Derived rather than hand-mapped per permission (36 entries and
 * growing) — falls back cleanly for any future permission added to the catalog.
 */
export function formatPermissionLabel(permission: string): string {
  const action = permission.split('.').slice(1).join('.').replace(/_/g, ' ');
  return action.charAt(0).toUpperCase() + action.slice(1);
}
