import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { EditingFormComponent } from '../../../shared/components/editing-form/editing-form.component';
import { FieldErrorComponent } from '../../../shared/components/field-error/field-error.component';
import { LeaveType } from '../interfaces/leave-type';
import { LeaveTypeService } from '../services/leave-type.service';

@Component({
  selector: 'app-leave-type-edition',
  imports: [ReactiveFormsModule, RouterLink, FieldErrorComponent],
  templateUrl: './leave-type-edition.component.html',
  styleUrl: './leave-type-edition.component.scss',
  host: {
    class: 'form-page form-page--container',
  },
})
export class LeaveTypeEditionComponent extends EditingFormComponent<LeaveType> {
  readonly dataSvc = inject(LeaveTypeService);

  readonly form = this.fb.group({
    id: this.fb.control<string | null>(null),
    name: this.fb.control('', { validators: [Validators.required, Validators.maxLength(120)] }),
    description: this.fb.control(''),
    defaultDaysPerYear: this.fb.control<number | null>(null, {
      validators: [Validators.min(0), Validators.max(365)],
    }),
    requiresApproval: this.fb.control(true),
    isPaid: this.fb.control(true),
    isActive: this.fb.control(true),
  });
}
