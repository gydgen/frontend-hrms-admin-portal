import type { FormGroup } from '@angular/forms';
import type { ConfirmDialogService } from '../confirm-dialog/confirm-dialog.service';

export interface CheckFormDirtOptions {
  formKeyName: string;
}

/**
 * Guards a "close/dismiss" method: prompts only if the named form is dirty. Requires the
 * host class to inject `ConfirmDialogService` as `confirmDialog`.
 */
export function CheckFormDirt(options: CheckFormDirtOptions) {
  return function (_target: unknown, propertyKey: string, descriptor: PropertyDescriptor): PropertyDescriptor {
    const original = descriptor.value as (...args: unknown[]) => void;
    descriptor.value = function (
      this: Record<string, unknown> & { confirmDialog: ConfirmDialogService },
      ...args: unknown[]
    ) {
      const form = this[options.formKeyName] as FormGroup | undefined;
      if (!form || !form.dirty) {
        original.apply(this, args);
        return;
      }
      this.confirmDialog.confirm({
        header: 'Discard unsaved changes?',
        message: 'You have unsaved changes that will be lost.',
        severity: 'danger',
        accept: () => original.apply(this, args),
      });
    };
    return descriptor;
  };
}
