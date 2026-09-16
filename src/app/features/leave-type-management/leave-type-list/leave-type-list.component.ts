import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TableModule } from 'primeng/table';
import { MenuModule } from 'primeng/menu';
import {
  PaginatedTableComponent,
  TableHeader,
} from '../../../shared/components/paginated-table/paginated-table.component';
import { HasRoleDirective } from '../../../core/auth/directives/has-role.directive';
import { PERMISSIONS } from '../../../core/constants/permissions';
import { LeaveType } from '../interfaces/leave-type';
import { LeaveTypeService } from '../services/leave-type.service';

@Component({
  selector: 'app-leave-type-list',
  imports: [FormsModule, RouterLink, TableModule, MenuModule, HasRoleDirective],
  templateUrl: './leave-type-list.component.html',
  styleUrl: './leave-type-list.component.scss',
  host: {
    class: 'list-page list-page--container',
  },
})
export class LeaveTypeListComponent extends PaginatedTableComponent<LeaveType> {
  readonly dataSvc = inject(LeaveTypeService);
  readonly permissions = PERMISSIONS;

  readonly headers: TableHeader[] = [
    { field: 'name', header: 'Leave Type' },
    { field: 'defaultDaysPerYear', header: 'Days / Year' },
    { field: 'requiresApproval', header: 'Requires Approval' },
    { field: 'isPaid', header: 'Paid' },
    { field: 'isActive', header: 'Status' },
  ];

  getStatusClass(isActive: boolean | undefined): string {
    return `table-status table-status--${isActive ? 'active' : 'inactive'}`;
  }
}
