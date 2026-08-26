import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ButtonCreateComponent } from '../../../../shared/button/button-create.component';
import { FormInputComponent } from '../../../../shared/form-input/form-input.component';
import { environment } from '../../../../../environments/environment';
import { LOGIN_ROUTE, PASSWORD_REGEX } from '../../interface/constants';
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
      // Named to match backend-hrms's POST /auth/register payload key directly (its
      // registerSchema requires `organisationName`, not `companyName`) — the field's
      // display copy still says "Company name", that's independent presentation text.
      organisationName: [null, Validators.required],
      password: [null, [Validators.required, Validators.pattern(PASSWORD_REGEX)]],
      confirmPassword: [null, Validators.required],
      // Named to match backend-hrms's `agreeToTerms` payload key directly, rather than
      // renaming it (or dropping it, as this used to do) when building the request body.
      agreeToTerms: [false, Validators.requiredTrue],
    },
    { validators: passwordsMatch },
  );

  get passwordMismatch() {
    return this.form.hasError('passwordMismatch') && this.form.get('confirmPassword')?.touched;
  }

  get step1Invalid() {
    const fields = ['firstName', 'lastName', 'email', 'organisationName'];
    return fields.some((f) => this.form.get(f)?.invalid);
  }

  nextStep() {
    ['firstName', 'lastName', 'email', 'organisationName'].forEach((f) =>
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
      // confirmPassword is client-side-only (cross-checked by the passwordsMatch validator
      // above) — backend-hrms's registerSchema doesn't accept it and would 400 on the
      // unknown key.
      const { confirmPassword: _, ...payload } = this.form.value;
      await this.#http.post(`${environment.apiUrl}/auth/register`, payload).toPromise();
      this.#router.navigate([LOGIN_ROUTE]);
    } catch (err: any) {
      this.errorMessage.set(err?.error?.message ?? 'Registration failed. Please try again.');
    } finally {
      this.loading.set(false);
    }
  }
}
