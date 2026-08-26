import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  selector: 'app-payroll-edition',
  imports: [RouterLink],
  templateUrl: './payroll-edition.component.html',
  styleUrl: './payroll-edition.component.scss',
  host: {
    class: 'form-page form-page--container',
  },
})
export class PayrollEditionComponent {
  private readonly route = inject(ActivatedRoute);

  readonly payrollId = this.route.snapshot.paramMap.get('id');
  readonly isEditMode = !!this.payrollId;
}
