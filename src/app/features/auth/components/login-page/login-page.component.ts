import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { FormInputComponent } from '../../../../shared/form-input/form-input.component';
import { ButtonCreateComponent } from '../../../../shared/button/button-create.component';
import { AuthService } from '../../services/auth.service';
import { ToastrService } from '../../../../shared/toastr/toastr.service';

@Component({
  selector: 'app-login-page',
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    RouterLink,
    FormInputComponent,
    ReactiveFormsModule,
    ButtonCreateComponent,
  ],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.scss',
})
export class LoginPageComponent {
  #fb = inject(FormBuilder);
  #router = inject(Router);
  #authSvc = inject(AuthService);
  #toastr = inject(ToastrService);

  loading = false;

  form: FormGroup = this.#fb.group({
    email: [null, Validators.required],
    password: [null, Validators.required],
  });

  async login() {
    this.loading = true;
    const { email, password } = this.form.value;
    try {
      await this.#authSvc.login(email, password);
      this.#toastr.triggerToastr('success', 'Login successful');

      this.#router.navigate(['/dashboard']);
    } catch (error) {
      this.#toastr.triggerToastr('error', 'Login failed');
      throw error;
    }
    this.loading = false;
  }
}
