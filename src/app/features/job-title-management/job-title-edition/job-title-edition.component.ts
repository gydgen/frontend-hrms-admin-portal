import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { rxResource } from '@angular/core/rxjs-interop';
import { EditingFormComponent } from '../../../shared/components/editing-form/editing-form.component';
import { FieldErrorComponent } from '../../../shared/components/field-error/field-error.component';
import { DepartmentService } from '../../department-management/services/department.service';
import { JobTitle } from '../interfaces/job-title';
import { JobTitleService } from '../services/job-title.service';

@Component({
  selector: 'app-job-title-edition',
  imports: [ReactiveFormsModule, RouterLink, FieldErrorComponent],
  templateUrl: './job-title-edition.component.html',
  styleUrl: './job-title-edition.component.scss',
  host: {
    class: 'form-page form-page--container',
  },
})
export class JobTitleEditionComponent extends EditingFormComponent<JobTitle> {
  readonly dataSvc = inject(JobTitleService);
  private readonly departmentSvc = inject(DepartmentService);

  readonly departments = rxResource({ stream: () => this.departmentSvc.list() });

  readonly form = this.fb.group({
    id: this.fb.control<string | null>(null),
    title: this.fb.control('', { validators: [Validators.required, Validators.maxLength(120)] }),
    departmentId: this.fb.control<string | null>(null),
  });
}
