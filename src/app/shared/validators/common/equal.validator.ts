import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/** Cross-field match, e.g. password confirmation. Apply to the parent FormGroup. */
export function equalValidator(controlName: string, matchingControlName: string): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const control = group.get(controlName);
    const matchingControl = group.get(matchingControlName);
    if (!control || !matchingControl) return null;

    if (control.value !== matchingControl.value) {
      matchingControl.setErrors({ ...matchingControl.errors, equal: true });
      return { equal: true };
    }

    if (matchingControl.errors) {
      const { equal, ...rest } = matchingControl.errors;
      matchingControl.setErrors(Object.keys(rest).length ? rest : null);
    }
    return null;
  };
}
