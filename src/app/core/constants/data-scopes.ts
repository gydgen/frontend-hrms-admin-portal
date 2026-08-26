/** Mirrors backend-hrms's `DATA_SCOPES`. */
export const DATA_SCOPES = {
  OWN: 'OWN',
  DIRECT_REPORTS: 'DIRECT_REPORTS',
  DEPARTMENT: 'DEPARTMENT',
  BRANCH: 'BRANCH',
  TENANT: 'TENANT',
  GLOBAL: 'GLOBAL',
} as const;

export type DataScope = (typeof DATA_SCOPES)[keyof typeof DATA_SCOPES];

export interface DataScopeOption {
  value: DataScope;
  label: string;
  description: string;
}

/**
 * The data scopes assignable through the role-management UI, broadest first.
 * `GLOBAL` is deliberately excluded — backend-hrms rejects it on create/update with
 * `GLOBAL_SCOPE_RESTRICTED` (reserved for a platform-level actor that doesn't exist yet;
 * see the note in role.service.ts's `assertScopeNotGlobal`).
 */
export const ASSIGNABLE_DATA_SCOPES: DataScopeOption[] = [
  {
    value: 'TENANT',
    label: 'Whole organisation',
    description: 'Can see and act on records across the entire organisation.',
  },
  {
    value: 'BRANCH',
    label: 'Branch',
    description: 'Can see and act on records across their branch or location.',
  },
  {
    value: 'DEPARTMENT',
    label: 'Department',
    description: 'Can see and act on records for everyone in their own department.',
  },
  {
    value: 'DIRECT_REPORTS',
    label: 'Direct reports',
    description: 'Can see and act on records for employees who report directly to them.',
  },
  {
    value: 'OWN',
    label: 'Own records only',
    description: 'Can only see and act on their own record.',
  },
];
