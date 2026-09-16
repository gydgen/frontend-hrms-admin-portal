import { Component, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { rxResource } from '@angular/core/rxjs-interop';
import { TableModule } from 'primeng/table';
import { MenuModule } from 'primeng/menu';
import { HasRoleDirective } from '../../../core/auth/directives/has-role.directive';
import { PERMISSIONS } from '../../../core/constants/permissions';
import { EmployeeService } from '../../employee-management/services/employee.service';
import { LeaveBalanceService } from '../services/leave-balance.service';

@Component({
  selector: 'app-leave-balance-list',
  imports: [FormsModule, RouterLink, TableModule, MenuModule, HasRoleDirective],
  templateUrl: './leave-balance-list.component.html',
  styleUrl: './leave-balance-list.component.scss',
  host: {
    class: 'list-page list-page--container',
  },
})
export class LeaveBalanceListComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly employeeSvc = inject(EmployeeService);
  private readonly leaveBalanceSvc = inject(LeaveBalanceService);
  readonly permissions = PERMISSIONS;

  readonly employees = rxResource({ stream: () => this.employeeSvc.list() });

  readonly currentYear = new Date().getFullYear();
  readonly years = [this.currentYear - 1, this.currentYear, this.currentYear + 1];

  readonly selectedEmployeeId = signal<string | null>(this.route.snapshot.queryParamMap.get('employeeId'));
  readonly selectedYear = signal<number>(Number(this.route.snapshot.queryParamMap.get('year')) || this.currentYear);

  constructor() {
    // Default to the first employee once the list loads, if nothing was pre-selected via
    // query params (e.g. arriving fresh at /dashboard/leave-balance).
    effect(() => {
      const list = this.employees.value();
      if (list?.length && !this.selectedEmployeeId()) {
        this.selectedEmployeeId.set(list[0].id!);
      }
    });
  }

  readonly balances = rxResource({
    params: () => {
      const employeeId = this.selectedEmployeeId();
      return employeeId ? { employeeId, year: this.selectedYear() } : undefined;
    },
    stream: ({ params }) => this.leaveBalanceSvc.list(params.employeeId, params.year),
  });

  /** Carries the current employee/year selection onto the adjust screen and back. */
  adjustQueryParams(): Record<string, string | number> {
    return { employeeId: this.selectedEmployeeId() ?? '', year: this.selectedYear() };
  }
}
