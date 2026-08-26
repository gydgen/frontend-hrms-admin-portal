import type { FormGroup } from '@angular/forms';
import type { ToastrService } from '../toastr/toastr.service';
import { DEFAULT_ERROR_TRANSLATION, ERROR_TRANSLATIONS } from '../../core/constants/errors';

/**
 * Debounces briefly to let async validators (e.g. backend uniqueness checks) settle, then
 * either marks the form dirty/touched and toasts the first error, or calls through to the
 * real method. Wrap any save()/saveAndClose() with this instead of hand-writing
 * `if (form.invalid) { ... }` checks. Requires the host class to inject `ToastrService`
 * as `toastr`.
 */
export function AsyncCheckFormValidity(formKeyName: string, debounceMs = 150) {
  return function (_target: unknown, propertyKey: string, descriptor: PropertyDescriptor): PropertyDescriptor {
    const original = descriptor.value as (...args: unknown[]) => void;
    descriptor.value = function (
      this: Record<string, unknown> & { toastr: ToastrService },
      ...args: unknown[]
    ) {
      const form = this[formKeyName] as FormGroup;
      setTimeout(() => {
        if (form.invalid) {
          form.markAllAsTouched();
          form.markAsDirty();
          const firstInvalidControlKey = Object.keys(form.controls).find((key) => form.controls[key].invalid);
          const firstErrorKey = firstInvalidControlKey
            ? Object.keys(form.controls[firstInvalidControlKey].errors ?? {})[0]
            : undefined;
          const message = (firstErrorKey && ERROR_TRANSLATIONS[firstErrorKey]) || DEFAULT_ERROR_TRANSLATION;
          this.toastr.triggerToastr('error', message);
          return;
        }
        original.apply(this, args);
      }, debounceMs);
    };
    return descriptor;
  };
}
