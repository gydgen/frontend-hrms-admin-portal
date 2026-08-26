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
import { Department } from '../interfaces/department';
import { DepartmentService } from '../services/department.service';

@Component({
  selector: 'app-department-list',
  imports: [FormsModule, RouterLink, TableModule, HasRoleDirective],
  templateUrl: './department-list.component.html',
  styleUrl: './department-list.component.scss',
  host: {
    class: 'list-page list-page--container',
  },
})
export class DepartmentListComponent extends PaginatedTableComponent<Department> {
  readonly dataSvc = inject(DepartmentService);
  readonly permissions = PERMISSIONS;

  readonly headers: TableHeader[] = [
    { field: 'name', header: 'Department' },
    { field: 'description', header: 'Description' },
  ];
}
