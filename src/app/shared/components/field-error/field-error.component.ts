import { Component, computed, input } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { DEFAULT_ERROR_TRANSLATION, ERROR_TRANSLATIONS } from '../../../core/constants/errors';

@Component({
  selector: 'app-field-error',
  imports: [],
  template: `
    @if (message(); as msg) {
      <p class="form-fieldset__error">{{ msg }}</p>
    }
  `,
})
export class FieldErrorComponent {
  readonly control = input.required<AbstractControl | null>();

  readonly message = computed(() => {
    const control = this.control();
    if (!control || !control.invalid || (!control.dirty && !control.touched)) return null;
    const errorKey = Object.keys(control.errors ?? {})[0];
    return (errorKey && ERROR_TRANSLATIONS[errorKey]) || DEFAULT_ERROR_TRANSLATION;
  });
}
