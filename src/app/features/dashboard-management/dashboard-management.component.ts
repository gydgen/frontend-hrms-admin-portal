import { Component } from '@angular/core';
import { NavbarComponent } from './components/navbar/navbar.component';
import { Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { HasRoleDirective } from '../../core/auth/directives/has-role.directive';
import { PERMISSIONS } from '../../core/constants/permissions';

@Component({
  selector: 'app-dashboard-management',
  imports: [MatIconModule, RouterModule, NavbarComponent, HasRoleDirective],
  templateUrl: './dashboard-management.component.html',
  styleUrl: './dashboard-management.component.scss',
})
export class DashboardManagementComponent {
  readonly permissions = PERMISSIONS;

  constructor(private router: Router) {}
}
