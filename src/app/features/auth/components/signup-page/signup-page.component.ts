import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ButtonCreateComponent } from '../../../../shared/button/button-create.component';
import { FormInputComponent } from '../../../../shared/form-input/form-input.component';
import { environment } from '../../../../../environments/environment';
import { PASSWORD_REGEX } from '../../interface/constants';
import { passwordsMatch } from '../../../../shared/utils/auth';

@Component({
  selector: 'app-signup-page',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    FormInputComponent,
    ButtonCreateComponent,
  ],
  templateUrl: './signup-page.component.html',
  styleUrl: './signup-page.component.scss',
})
export class SignupPageComponent {
  #fb = inject(FormBuilder);
  #http = inject(HttpClient);
  #router = inject(Router);

  loading = signal(false);
  errorMessage = signal('');
  step = signal<1 | 2>(1);

  form: FormGroup = this.#fb.group(
    {
      firstName: [null, [Validators.required, Validators.minLength(2)]],
      lastName: [null, [Validators.required, Validators.minLength(2)]],
      email: [null, [Validators.required, Validators.email]],
      companyName: [null, Validators.required],
      password: [null, [Validators.required, Validators.pattern(PASSWORD_REGEX)]],
      confirmPassword: [null, Validators.required],
      agreeTerms: [false, Validators.requiredTrue],
    },
    { validators: passwordsMatch },
  );

  get passwordMismatch() {
    return this.form.hasError('passwordMismatch') && this.form.get('confirmPassword')?.touched;
  }

  get step1Invalid() {
    const fields = ['firstName', 'lastName', 'email', 'companyName'];
    return fields.some((f) => this.form.get(f)?.invalid);
  }

  nextStep() {
    ['firstName', 'lastName', 'email', 'companyName'].forEach((f) =>
      this.form.get(f)?.markAsTouched(),
    );
    if (!this.step1Invalid) this.step.set(2);
  }

  async signup() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.errorMessage.set('');
    try {
      const { confirmPassword: _, agreeTerms: __, ...payload } = this.form.value;
      await this.#http.post(`${environment.apiUrl}/auth/register`, payload).toPromise();
      this.#router.navigate(['/login']);
    } catch (err: any) {
      this.errorMessage.set(err?.error?.message ?? 'Registration failed. Please try again.');
    } finally {
      this.loading.set(false);
    }
  }
}
