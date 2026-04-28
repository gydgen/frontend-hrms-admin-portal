import { Component, ChangeDetectionStrategy, signal, inject, OnInit, OnDestroy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DOCUMENT } from '@angular/common';
import { fromEvent, Subscription } from 'rxjs';

@Component({
  selector: 'app-landing-page',
  imports: [RouterLink],
  templateUrl: './landing-page.component.html',
  styleUrl: './landing-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'landing-host' },
})
export class LandingPageComponent implements OnInit, OnDestroy {
  private doc = inject(DOCUMENT);
  private scrollSub!: Subscription;

  isScrolled = signal(false);
  mobileMenuOpen = signal(false);
  readonly currentYear = new Date().getFullYear();

  features = [
    {
      icon: '👥',
      title: 'Employee Management',
      description:
        'Centralise all employee data, contracts, and documents in one secure place. Onboard new hires in minutes.',
      gif: 'gifs/employee-management.gif',
      gifAlt: 'Employee management workflow demo',
    },
    {
      icon: '📅',
      title: 'Leave & Attendance',
      description:
        'Automate leave requests, approvals, and real-time attendance tracking with smart dashboards.',
      gif: 'gifs/leave-attendance.gif',
      gifAlt: 'Leave and attendance workflow demo',
    },
    {
      icon: '💰',
      title: 'Payroll Processing',
      description:
        'Run accurate, compliant payroll in one click. Handle taxes, deductions, and payslips automatically.',
      gif: 'gifs/payroll.gif',
      gifAlt: 'Payroll processing workflow demo',
    },
  ];

  stats = [
    { value: '10k+', label: 'Employees Managed' },
    { value: '500+', label: 'Companies Trust Us' },
    { value: '99.9%', label: 'Uptime SLA' },
    { value: '4.9★', label: 'Customer Rating' },
  ];

  ngOnInit() {
    this.scrollSub = fromEvent(this.doc.defaultView!, 'scroll').subscribe(() => {
      this.isScrolled.set((this.doc.defaultView?.scrollY ?? 0) > 50);
    });
  }

  ngOnDestroy() {
    this.scrollSub?.unsubscribe();
  }

  toggleMobileMenu() {
    this.mobileMenuOpen.update(v => !v);
  }
}
