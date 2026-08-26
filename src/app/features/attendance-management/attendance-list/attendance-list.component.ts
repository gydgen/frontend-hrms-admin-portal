import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TableModule } from 'primeng/table';

type AttendanceTableState = 'loaded' | 'loading' | 'empty' | 'error';

interface AttendanceRow {
  id: string;
  employee: string;
  date: string;
  clockIn: string;
  clockOut: string;
  status: 'Present' | 'Late' | 'Absent';
}

@Component({
  selector: 'app-attendance-list',
  imports: [FormsModule, RouterLink, TableModule],
  templateUrl: './attendance-list.component.html',
  styleUrl: './attendance-list.component.scss',
  host: {
    class: 'list-page list-page--container',
  },
})
export class AttendanceListComponent {
  readonly attendanceRecords: AttendanceRow[] = [
    {
      id: 'ATT-001',
      employee: 'Ama Mensah',
      date: 'Aug 21, 2026',
      clockIn: '08:02 AM',
      clockOut: '05:06 PM',
      status: 'Present',
    },
    {
      id: 'ATT-002',
      employee: 'Kofi Boateng',
      date: 'Aug 21, 2026',
      clockIn: '09:18 AM',
      clockOut: '05:30 PM',
      status: 'Late',
    },
    {
      id: 'ATT-003',
      employee: 'Efua Addo',
      date: 'Aug 21, 2026',
      clockIn: '-',
      clockOut: '-',
      status: 'Absent',
    },
  ];

  tableState: AttendanceTableState = 'loaded';
  searchTerm = '';
  dateFilter = '';
  statusFilter = '';

  readonly dates = ['Aug 21, 2026'];
  readonly statuses: AttendanceRow['status'][] = ['Present', 'Late', 'Absent'];

  get isLoading(): boolean {
    return this.tableState === 'loading';
  }

  get hasError(): boolean {
    return this.tableState === 'error';
  }

  get tableRows(): AttendanceRow[] {
    return this.tableState === 'empty' ? [] : this.filteredRows;
  }

  setTableState(state: AttendanceTableState): void {
    this.tableState = state;
  }

  getStatusClass(status: AttendanceRow['status']): string {
    return `table-status table-status--${status.toLowerCase()}`;
  }

  private get filteredRows(): AttendanceRow[] {
    const search = this.searchTerm.trim().toLowerCase();

    return this.attendanceRecords.filter((record) => {
      const matchesSearch =
        !search ||
        [record.id, record.employee, record.date, record.clockIn, record.clockOut, record.status]
          .join(' ')
          .toLowerCase()
          .includes(search);
      const matchesDate = !this.dateFilter || record.date === this.dateFilter;
      const matchesStatus = !this.statusFilter || record.status === this.statusFilter;

      return matchesSearch && matchesDate && matchesStatus;
    });
  }
}
