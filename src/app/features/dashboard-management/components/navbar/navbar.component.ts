import { Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { Router } from '@angular/router';
import { ToastrService } from '../../../../shared/toastr/toastr.service';

@Component({
  selector: 'app-navbar',
  imports: [MatIconModule, MatMenuModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
})
export class NavbarComponent {
  private router = inject(Router);
  private toastr = inject(ToastrService);

  onLogout() {
    this.toastr.triggerToastr('success', 'Logout successful');
    this.router.navigate(['/auth/login']);
    localStorage.clear();
    sessionStorage.clear();
  }

  goToAccountSettings() {
    this.router.navigate(['/dashboard/account-settings']);
  }
}
