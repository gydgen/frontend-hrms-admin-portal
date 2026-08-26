import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/** Applies `validator` only when `condition` holds for the control at validation time. */
export function conditionalValidator(
  condition: (control: AbstractControl) => boolean,
  validator: ValidatorFn,
): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => (condition(control) ? validator(control) : null);
}
