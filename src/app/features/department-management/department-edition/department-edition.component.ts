import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { EditingFormComponent } from '../../../shared/components/editing-form/editing-form.component';
import { FieldErrorComponent } from '../../../shared/components/field-error/field-error.component';
import { Department } from '../interfaces/department';
import { DepartmentService } from '../services/department.service';

@Component({
  selector: 'app-department-edition',
  imports: [ReactiveFormsModule, RouterLink, FieldErrorComponent],
  templateUrl: './department-edition.component.html',
  styleUrl: './department-edition.component.scss',
  host: {
    class: 'form-page form-page--container',
  },
})
export class DepartmentEditionComponent extends EditingFormComponent<Department> {
  readonly dataSvc = inject(DepartmentService);

  readonly form = this.fb.group({
    id: this.fb.control<string | null>(null),
    name: this.fb.control('', { validators: [Validators.required, Validators.maxLength(120)] }),
    description: this.fb.control(''),
  });
}
