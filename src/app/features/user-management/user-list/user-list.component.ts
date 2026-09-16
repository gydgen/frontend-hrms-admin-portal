import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TableModule } from 'primeng/table';
import { MenuModule } from 'primeng/menu';

type UserTableState = 'loaded' | 'loading' | 'empty' | 'error';
type UserStatus = 'ACTIVE' | 'PENDING' | 'SUSPENDED' | 'DEACTIVATED';

interface UserRow {
  id: string;
  name: string;
  email: string;
  status: UserStatus;
  roles: string[];
}

@Component({
  selector: 'app-user-list',
  imports: [FormsModule, RouterLink, TableModule, MenuModule],
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.scss',
  host: {
    class: 'list-page list-page--container',
  },
})
export class UserListComponent {
  readonly users: UserRow[] = [
    {
      id: 'USR-001',
      name: 'Ama Mensah',
      email: 'ama.mensah@gydgen.com',
      status: 'ACTIVE',
      roles: ['Administrator'],
    },
    {
      id: 'USR-002',
      name: 'Kofi Boateng',
      email: 'kofi.boateng@gydgen.com',
      status: 'ACTIVE',
      roles: ['HR Manager'],
    },
    {
      id: 'USR-003',
      name: 'Nana Yeboah',
      email: 'nana.yeboah@gydgen.com',
      status: 'PENDING',
      roles: ['Payroll Officer'],
    },
    {
      id: 'USR-004',
      name: 'Efua Addo',
      email: 'efua.addo@gydgen.com',
      status: 'SUSPENDED',
      roles: ['HR Manager'],
    },
  ];

  tableState: UserTableState = 'loaded';
  searchTerm = '';
  statusFilter = '';

  readonly statuses: UserStatus[] = ['ACTIVE', 'PENDING', 'SUSPENDED', 'DEACTIVATED'];

  get isLoading(): boolean {
    return this.tableState === 'loading';
  }

  get hasError(): boolean {
    return this.tableState === 'error';
  }

  get tableRows(): UserRow[] {
    return this.tableState === 'empty' ? [] : this.filteredRows;
  }

  setTableState(state: UserTableState): void {
    this.tableState = state;
  }

  getStatusClass(status: UserStatus): string {
    return `table-status table-status--${status.toLowerCase()}`;
  }

  private get filteredRows(): UserRow[] {
    const search = this.searchTerm.trim().toLowerCase();

    return this.users.filter((user) => {
      const matchesSearch =
        !search ||
        [user.id, user.name, user.email, ...user.roles].join(' ').toLowerCase().includes(search);
      const matchesStatus = !this.statusFilter || user.status === this.statusFilter;

      return matchesSearch && matchesStatus;
    });
  }
}
