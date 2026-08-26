import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TableModule } from 'primeng/table';
import {
  PaginatedTableComponent,
  TableHeader,
} from '../../../shared/components/paginated-table/paginated-table.component';
import { HasRoleDirective } from '../../../core/auth/directives/has-role.directive';
import { PERMISSIONS } from '../../../core/constants/permissions';
import { ASSIGNABLE_DATA_SCOPES } from '../../../core/constants/data-scopes';
import { Role } from '../interfaces/role';
import { RoleService } from '../services/role.service';

@Component({
  selector: 'app-role-list',
  imports: [FormsModule, RouterLink, TableModule, HasRoleDirective],
  templateUrl: './role-list.component.html',
  styleUrl: './role-list.component.scss',
  host: {
    class: 'list-page list-page--container',
  },
})
export class RoleListComponent extends PaginatedTableComponent<Role> {
  readonly dataSvc = inject(RoleService);
  readonly permissions = PERMISSIONS;

  readonly headers: TableHeader[] = [
    { field: 'name', header: 'Role' },
    { field: 'description', header: 'Description' },
    { field: 'dataScope', header: 'Data Scope' },
    { field: 'isActive', header: 'Status' },
  ];

  getStatusClass(isActive: boolean | undefined): string {
    return `table-status table-status--${isActive ? 'active' : 'inactive'}`;
  }

  dataScopeLabel(scope: string): string {
    return ASSIGNABLE_DATA_SCOPES.find((s) => s.value === scope)?.label ?? scope;
  }

  override getDeleteConfirmTitle(role: Role): string {
    return `Delete "${role.name}"?`;
  }

  override getDeleteConfirmContent(): string {
    return 'This cannot be undone, and fails if the role is still assigned to any users.';
  }
}
