import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { rxResource } from '@angular/core/rxjs-interop';
import { TableModule } from 'primeng/table';
import { MenuModule } from 'primeng/menu';
import {
  PaginatedTableComponent,
  TableHeader,
} from '../../../shared/components/paginated-table/paginated-table.component';
import { HasRoleDirective } from '../../../core/auth/directives/has-role.directive';
import { PERMISSIONS } from '../../../core/constants/permissions';
import { EMPLOYEE_STATUS_OPTIONS } from '../constants/employee-options';
import { DepartmentService } from '../../department-management/services/department.service';
import { Employee } from '../interfaces/employee';
import { EmployeeService } from '../services/employee.service';

@Component({
  selector: 'app-employee-list',
  imports: [FormsModule, RouterLink, TableModule, MenuModule, HasRoleDirective],
  templateUrl: './employee-list.component.html',
  styleUrl: './employee-list.component.scss',
  host: {
    class: 'list-page list-page--container',
  },
})
export class EmployeeListComponent extends PaginatedTableComponent<Employee> {
  readonly dataSvc = inject(EmployeeService);
  private readonly departmentSvc = inject(DepartmentService);
  readonly permissions = PERMISSIONS;
  readonly statusOptions = EMPLOYEE_STATUS_OPTIONS;

  readonly headers: TableHeader[] = [
    { field: 'name', header: 'Employee' },
    { field: 'department', header: 'Department' },
    { field: 'employmentType', header: 'Employment Type' },
    { field: 'status', header: 'Status' },
  ];

  /** Loaded once to resolve `departmentId` → name for display — employees carry no joined department. */
  private readonly departments = rxResource({ stream: () => this.departmentSvc.list() });

  departmentName(departmentId: string | null | undefined): string {
    if (!departmentId) return '—';
    return this.departments.value()?.find((department) => department.id === departmentId)?.name ?? '—';
  }

  statusLabel(status: string | undefined): string {
    return this.statusOptions.find((option) => option.value === status)?.label ?? status ?? '—';
  }

  /** Maps EmployeeStatus onto the existing `.table-status` colour modifiers (active=green, pending=amber, inactive/rejected=red). */
  private static readonly STATUS_CLASS_KEY: Record<string, string> = {
    ACTIVE: 'active',
    ON_LEAVE: 'pending',
    SUSPENDED: 'rejected',
    TERMINATED: 'inactive',
  };

  getStatusClass(status: string | undefined): string {
    const key = EmployeeListComponent.STATUS_CLASS_KEY[status ?? ''] ?? 'inactive';
    return `table-status table-status--${key}`;
  }

  override getDeleteConfirmTitle(employee: Employee): string {
    return `Delete "${employee.firstName} ${employee.lastName}"?`;
  }
}
