import { DataScope } from '../../../core/constants/data-scopes';

/** Matches backend-hrms's `Role.modulePermissions` shape. */
export interface ModulePermission {
  module: string;
  permissions: string[];
}

/** Matches backend-hrms's Role model (see role.validator.ts / role.service.ts). */
export interface Role {
  id?: string;
  name: string;
  slug?: string;
  description?: string | null;
  dataScope: DataScope;
  modulePermissions: ModulePermission[];
  isSystemRole?: boolean;
  isDefault?: boolean;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}
