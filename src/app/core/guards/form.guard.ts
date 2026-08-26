import { inject } from '@angular/core';
import { CanDeactivateFn } from '@angular/router';
import { FormGroup } from '@angular/forms';
import { Observable } from 'rxjs';
import { ConfirmDialogService } from '../../shared/confirm-dialog/confirm-dialog.service';

export interface DirtyFormHost {
  form: FormGroup;
}

/**
 * Guards *any* router navigation away from a routed edit page while its form is dirty —
 * distinct from `@CheckFormDirt`, which only guards an explicit dismiss/cancel button.
 * Usage: `canDeactivate: [canDeactivateFormFn]` on the `:id`/`add` route.
 */
export const canDeactivateFormFn: CanDeactivateFn<DirtyFormHost> = (component) => {
  if (!component.form?.dirty) return true;

  const confirmDialog = inject(ConfirmDialogService);
  return new Observable<boolean>((subscriber) => {
    confirmDialog.confirm({
      header: 'Discard unsaved changes?',
      message: 'You have unsaved changes that will be lost if you leave this page.',
      severity: 'danger',
      accept: () => {
        subscriber.next(true);
        subscriber.complete();
      },
      reject: () => {
        subscriber.next(false);
        subscriber.complete();
      },
    });
  });
};
