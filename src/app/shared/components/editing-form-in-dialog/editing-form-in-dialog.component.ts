import { Directive, inject } from '@angular/core';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { EditingFormBase } from '../editing-form/editing-form-base';
import { AsyncCheckFormValidity } from '../../decorators/async-check-form-validity.decorator';
import { CheckFormDirt } from '../../decorators/check-form-dirt.decorator';
import { ConfirmDialogService } from '../../confirm-dialog/confirm-dialog.service';

/**
 * Modal-hosted editing via PrimeNG DynamicDialog. Initial data comes from
 * `DynamicDialogConfig.data` (passed by the caller that opened the dialog via
 * `DialogService.open(XEditionComponent, { data: existingRecordOrNull })`), not from a
 * route resolver — there is no route here.
 */
@Directive()
export abstract class EditingFormInDialog<I extends { id?: string }, O = I> extends EditingFormBase<I, O> {
  protected readonly dialogRef = inject(DynamicDialogRef);
  protected readonly dialogConfig = inject(DynamicDialogConfig);
  protected readonly confirmDialog = inject(ConfirmDialogService);

  constructor() {
    super();
    this.patchForm((this.dialogConfig.data as I) ?? null);
  }

  @AsyncCheckFormValidity('form')
  saveAndClose(): void {
    this.form.disable();
    this.dataSvc.updateOrCreate(this.form.getRawValue()).subscribe({
      next: (result) => this.dialogRef.close(result),
      error: (err) => {
        this.form.enable();
        this.handleSaveError(err);
      },
    });
  }

  /** Guarded dismiss: prompts if the form is dirty before actually closing. */
  @CheckFormDirt({ formKeyName: 'form' })
  dismiss(): void {
    this.dialogRef.close();
  }
}
