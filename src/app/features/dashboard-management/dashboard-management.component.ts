import { Component } from '@angular/core';
import { NavbarComponent } from './components/navbar/navbar.component';
import { Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-dashboard-management',
  imports: [MatIconModule, RouterModule, NavbarComponent],
  templateUrl: './dashboard-management.component.html',
  styleUrl: './dashboard-management.component.scss',
})
export class DashboardManagementComponent {
  constructor(private router: Router) {}
}
