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
import { DepartmentService } from '../../department-management/services/department.service';
import { JobTitle } from '../interfaces/job-title';
import { JobTitleService } from '../services/job-title.service';

@Component({
  selector: 'app-job-title-list',
  imports: [FormsModule, RouterLink, TableModule, MenuModule, HasRoleDirective],
  templateUrl: './job-title-list.component.html',
  styleUrl: './job-title-list.component.scss',
  host: {
    class: 'list-page list-page--container',
  },
})
export class JobTitleListComponent extends PaginatedTableComponent<JobTitle> {
  readonly dataSvc = inject(JobTitleService);
  private readonly departmentSvc = inject(DepartmentService);
  readonly permissions = PERMISSIONS;

  readonly headers: TableHeader[] = [
    { field: 'title', header: 'Job Title' },
    { field: 'department', header: 'Department' },
  ];

  /** Loaded once to resolve `departmentId` → name for display — job titles carry no joined department. */
  private readonly departments = rxResource({ stream: () => this.departmentSvc.list() });

  departmentName(departmentId: string | null | undefined): string {
    if (!departmentId) return '—';
    return this.departments.value()?.find((department) => department.id === departmentId)?.name ?? '—';
  }
}
