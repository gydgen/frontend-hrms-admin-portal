import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TableModule } from 'primeng/table';
import { MenuModule } from 'primeng/menu';

type PayrollTableState = 'loaded' | 'loading' | 'empty' | 'error';

interface PayrollRow {
  id: string;
  employee: string;
  period: string;
  grossPay: string;
  netPay: string;
  status: 'Draft' | 'Processed' | 'Paid';
}

@Component({
  selector: 'app-payroll-list',
  imports: [FormsModule, RouterLink, TableModule, MenuModule],
  templateUrl: './payroll-list.component.html',
  styleUrl: './payroll-list.component.scss',
  host: {
    class: 'list-page list-page--container',
  },
})
export class PayrollListComponent {
  readonly payrollRecords: PayrollRow[] = [
    {
      id: 'PAY-001',
      employee: 'Ama Mensah',
      period: 'August 2026',
      grossPay: 'GHS 12,500',
      netPay: 'GHS 10,880',
      status: 'Processed',
    },
    {
      id: 'PAY-002',
      employee: 'Kofi Boateng',
      period: 'August 2026',
      grossPay: 'GHS 9,800',
      netPay: 'GHS 8,642',
      status: 'Draft',
    },
    {
      id: 'PAY-003',
      employee: 'Nana Yeboah',
      period: 'July 2026',
      grossPay: 'GHS 7,200',
      netPay: 'GHS 6,580',
      status: 'Paid',
    },
  ];

  tableState: PayrollTableState = 'loaded';
  searchTerm = '';
  periodFilter = '';
  statusFilter = '';

  readonly periods = ['August 2026', 'July 2026'];
  readonly statuses: PayrollRow['status'][] = ['Draft', 'Processed', 'Paid'];

  get isLoading(): boolean {
    return this.tableState === 'loading';
  }

  get hasError(): boolean {
    return this.tableState === 'error';
  }

  get tableRows(): PayrollRow[] {
    return this.tableState === 'empty' ? [] : this.filteredRows;
  }

  setTableState(state: PayrollTableState): void {
    this.tableState = state;
  }

  getStatusClass(status: PayrollRow['status']): string {
    return `table-status table-status--${status.toLowerCase()}`;
  }

  private get filteredRows(): PayrollRow[] {
    const search = this.searchTerm.trim().toLowerCase();

    return this.payrollRecords.filter((payroll) => {
      const matchesSearch =
        !search ||
        [payroll.id, payroll.employee, payroll.period, payroll.grossPay, payroll.netPay, payroll.status]
          .join(' ')
          .toLowerCase()
          .includes(search);
      const matchesPeriod = !this.periodFilter || payroll.period === this.periodFilter;
      const matchesStatus = !this.statusFilter || payroll.status === this.statusFilter;

      return matchesSearch && matchesPeriod && matchesStatus;
    });
  }
}
