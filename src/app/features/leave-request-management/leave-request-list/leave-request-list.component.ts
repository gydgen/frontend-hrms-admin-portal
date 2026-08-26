import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TableModule } from 'primeng/table';

type LeaveRequestTableState = 'loaded' | 'loading' | 'empty' | 'error';

interface LeaveRequestRow {
  id: string;
  employee: string;
  type: string;
  dates: string;
  days: number;
  status: 'Pending' | 'Approved' | 'Rejected';
}

@Component({
  selector: 'app-leave-request-list',
  imports: [FormsModule, RouterLink, TableModule],
  templateUrl: './leave-request-list.component.html',
  styleUrl: './leave-request-list.component.scss',
  host: {
    class: 'list-page list-page--container',
  },
})
export class LeaveRequestListComponent {
  readonly leaveRequests: LeaveRequestRow[] = [
    {
      id: 'LR-001',
      employee: 'Ama Mensah',
      type: 'Annual Leave',
      dates: 'Aug 26 - Aug 30, 2026',
      days: 5,
      status: 'Pending',
    },
    {
      id: 'LR-002',
      employee: 'Kofi Boateng',
      type: 'Sick Leave',
      dates: 'Sep 02 - Sep 03, 2026',
      days: 2,
      status: 'Approved',
    },
    {
      id: 'LR-003',
      employee: 'Nana Yeboah',
      type: 'Study Leave',
      dates: 'Sep 14 - Sep 18, 2026',
      days: 5,
      status: 'Rejected',
    },
  ];

  tableState: LeaveRequestTableState = 'loaded';
  searchTerm = '';
  typeFilter = '';
  statusFilter = '';

  readonly leaveTypes = ['Annual Leave', 'Sick Leave', 'Study Leave'];
  readonly statuses: LeaveRequestRow['status'][] = ['Pending', 'Approved', 'Rejected'];

  get isLoading(): boolean {
    return this.tableState === 'loading';
  }

  get hasError(): boolean {
    return this.tableState === 'error';
  }

  get tableRows(): LeaveRequestRow[] {
    return this.tableState === 'empty' ? [] : this.filteredRows;
  }

  setTableState(state: LeaveRequestTableState): void {
    this.tableState = state;
  }

  getStatusClass(status: LeaveRequestRow['status']): string {
    return `table-status table-status--${status.toLowerCase()}`;
  }

  private get filteredRows(): LeaveRequestRow[] {
    const search = this.searchTerm.trim().toLowerCase();

    return this.leaveRequests.filter((request) => {
      const matchesSearch =
        !search ||
        [request.id, request.employee, request.type, request.dates, request.status]
          .join(' ')
          .toLowerCase()
          .includes(search);
      const matchesType = !this.typeFilter || request.type === this.typeFilter;
      const matchesStatus = !this.statusFilter || request.status === this.statusFilter;

      return matchesSearch && matchesType && matchesStatus;
    });
  }
}
