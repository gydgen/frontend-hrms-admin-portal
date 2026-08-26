import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

type UserStatus = 'ACTIVE' | 'PENDING' | 'SUSPENDED' | 'DEACTIVATED';

interface UserDetail {
  id: string;
  name: string;
  email: string;
  status: UserStatus;
  roles: string[];
  invitedBy: string | null;
  createdAt: string;
}

@Component({
  selector: 'app-user-detail',
  imports: [RouterLink],
  templateUrl: './user-detail.component.html',
  styleUrl: './user-detail.component.scss',
  host: {
    class: 'detail-page',
  },
})
export class UserDetailComponent {
  private readonly route = inject(ActivatedRoute);

  readonly userId = this.route.snapshot.paramMap.get('id');

  readonly user: UserDetail = {
    id: this.userId ?? 'USR-000',
    name: 'Nana Yeboah',
    email: 'nana.yeboah@gydgen.com',
    status: 'PENDING',
    roles: ['Payroll Officer'],
    invitedBy: 'Ama Mensah',
    createdAt: 'Jun 18, 2023',
  };

  get canResendInvite(): boolean {
    return this.user.status === 'PENDING';
  }

  get canSuspend(): boolean {
    return this.user.status === 'ACTIVE';
  }

  get canDeactivate(): boolean {
    return this.user.status !== 'DEACTIVATED';
  }

  getStatusClass(status: UserStatus): string {
    return `table-status table-status--${status.toLowerCase()}`;
  }

  resendInvite(): void {
    // Wire up to POST /users/:userId/resend-invite.
  }

  suspend(): void {
    // Wire up to PATCH /users/:userId/suspend.
  }

  deactivate(): void {
    // Wire up to PATCH /users/:userId/deactivate.
  }
}
