import { AbstractControl, AsyncValidatorFn } from '@angular/forms';
import { Observable, debounceTime, map, of, switchMap } from 'rxjs';

/**
 * The standard async-uniqueness validator, built on `GenericCollectionService.exists()`.
 *
 * @example
 * name: ['', [Validators.required], [asyncFunctionValidator((v) => this.dataSvc.exists(v as string), 'uniqueName')]],
 */
export function asyncFunctionValidator(
  fn: (value: unknown) => Observable<boolean>,
  errorKey: string,
  debounceMs = 300,
): AsyncValidatorFn {
  return (control: AbstractControl) => {
    if (!control.value) return of(null);
    return of(control.value).pipe(
      debounceTime(debounceMs),
      switchMap((value) => fn(value)),
      map((exists) => (exists ? { [errorKey]: true } : null)),
    );
  };
}
