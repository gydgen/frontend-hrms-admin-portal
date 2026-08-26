import { Component, effect, inject, input } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FieldErrorComponent } from '../../../shared/components/field-error/field-error.component';
import { AsyncCheckFormValidity } from '../../../shared/decorators/async-check-form-validity.decorator';
import { ToastrService } from '../../../shared/toastr/toastr.service';
import { LeaveBalance } from '../interfaces/leave-balance';
import { LeaveBalanceService } from '../services/leave-balance.service';

/**
 * Doesn't extend EditingFormComponent — that base is built around
 * GenericCollectionService.updateOrCreate() (POST-or-PATCH, with an `isNew()`/'add' route),
 * and this screen only ever adjusts an existing balance (PATCH allocatedDays) — there's no
 * create at all (see LeaveBalanceService's doc comment).
 */
@Component({
  selector: 'app-leave-balance-edition',
  imports: [ReactiveFormsModule, RouterLink, FieldErrorComponent],
  templateUrl: './leave-balance-edition.component.html',
  styleUrl: './leave-balance-edition.component.scss',
  host: {
    class: 'form-page form-page--container',
  },
})
export class LeaveBalanceEditionComponent {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toastr = inject(ToastrService);
  private readonly leaveBalanceSvc = inject(LeaveBalanceService);

  /** Bound from the `:id` path param and `resolve: { value: leaveBalanceResolver }` via withComponentInputBinding(). */
  readonly id = input<string>();
  readonly value = input<LeaveBalance | null>(null);

  readonly form = this.fb.group({
    allocatedDays: this.fb.control<number | null>(null, {
      validators: [Validators.required, Validators.min(0), Validators.max(365)],
    }),
  });

  constructor() {
    effect(() => {
      const balance = this.value();
      if (balance) {
        this.form.patchValue({ allocatedDays: balance.allocatedDays });
        this.form.markAsPristine();
      }
    });
  }

  @AsyncCheckFormValidity('form')
  save(): void {
    const balance = this.value();
    if (!balance) return;

    const allocatedDays = this.form.getRawValue().allocatedDays!;
    this.leaveBalanceSvc.adjust(balance.id, allocatedDays).subscribe({
      next: () => {
        this.form.markAsPristine();
        this.toastr.triggerToastr('success', 'Leave balance updated');
        this.cancelEdit();
      },
      error: (err) =>
        this.toastr.triggerToastr('error', err?.error?.message ?? 'Something went wrong. Please try again.'),
    });
  }

  cancelEdit(): void {
    const balance = this.value();
    this.router.navigate(['../'], {
      relativeTo: this.route,
      queryParams: balance ? { employeeId: balance.employeeId, year: balance.year } : {},
    });
  }
}
