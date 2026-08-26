import { Directive, inject } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { GenericCollectionService } from '../../services/generic-collection.service';
import { ToastrService } from '../../toastr/toastr.service';

@Directive()
export abstract class EditingFormBase<I extends { id?: string }, O = I> {
  protected readonly fb = inject(FormBuilder);
  protected readonly toastr = inject(ToastrService);

  abstract dataSvc: GenericCollectionService<I>;
  abstract form: FormGroup;

  /** Load a resolved/passed-in record into the form without marking it dirty. */
  protected patchForm(value: I | null): void {
    if (value) {
      this.form.patchValue(value as Record<string, unknown>);
      this.form.markAsPristine();
    }
  }

  protected handleSaveResult(result: I): void {
    this.form.patchValue(result as Record<string, unknown>);
    this.form.markAsPristine();
    this.toastr.triggerToastr('success', 'Saved successfully');
  }

  protected handleSaveError(err: { error?: { message?: string } }): void {
    this.toastr.triggerToastr('error', err?.error?.message ?? 'Something went wrong. Please try again.');
  }
}
