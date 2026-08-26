import { Component, computed, inject } from '@angular/core';
import { ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { rxResource } from '@angular/core/rxjs-interop';
import { EditingFormComponent } from '../../../shared/components/editing-form/editing-form.component';
import { FieldErrorComponent } from '../../../shared/components/field-error/field-error.component';
import { HasRoleDirective } from '../../../core/auth/directives/has-role.directive';
import { AsyncCheckFormValidity } from '../../../shared/decorators/async-check-form-validity.decorator';
import { PERMISSIONS } from '../../../core/constants/permissions';
import { AuthService } from '../../auth/services/auth.service';
import { DepartmentService } from '../../department-management/services/department.service';
import { JobTitleService } from '../../job-title-management/services/job-title.service';
import { EMPLOYEE_STATUS_OPTIONS, EMPLOYMENT_TYPE_OPTIONS } from '../constants/employee-options';
import { Employee, EmployeeStatus, EmploymentType } from '../interfaces/employee';
import { EmployeeService } from '../services/employee.service';

/** Optional fields where '' or null means "not provided" — omitted from the payload rather
 *  than sent, since the create schema's stricter typing (e.g. departmentId must be a GUID,
 *  not null) would otherwise reject them. This form doesn't yet support explicitly clearing
 *  a relation/field to blank on update — a reasonable v1 scope cut. */
const OMIT_IF_EMPTY = [
  'email', 'phone', 'departmentId', 'jobTitleId', 'managerId',
  'terminationDate', 'salary', 'bankName', 'bankAccountNumber', 'nationalId',
] as const;

const SENSITIVE_FIELDS = ['salary', 'bankName', 'bankAccountNumber', 'nationalId'] as const;

@Component({
  selector: 'app-employee-edition',
  imports: [ReactiveFormsModule, RouterLink, FieldErrorComponent, HasRoleDirective],
  templateUrl: './employee-edition.component.html',
  styleUrl: './employee-edition.component.scss',
  host: {
    class: 'form-page form-page--container',
  },
})
export class EmployeeEditionComponent extends EditingFormComponent<Employee> {
  readonly dataSvc = inject(EmployeeService);
  private readonly departmentSvc = inject(DepartmentService);
  private readonly jobTitleSvc = inject(JobTitleService);
  private readonly authService = inject(AuthService);

  readonly permissions = PERMISSIONS;
  readonly employmentTypes = EMPLOYMENT_TYPE_OPTIONS;
  readonly statuses = EMPLOYEE_STATUS_OPTIONS;

  readonly departments = rxResource({ stream: () => this.departmentSvc.list() });
  readonly jobTitles = rxResource({ stream: () => this.jobTitleSvc.list() });
  readonly potentialManagers = rxResource({ stream: () => this.dataSvc.list() });
  readonly managerOptions = computed(
    () => this.potentialManagers.value()?.filter((employee) => employee.id !== this.id()) ?? [],
  );

  /**
   * `employee.manage_sensitive` gates both viewing AND setting salary/bank/nationalId — see
   * backend-hrms's `assertSensitiveFieldAccess`. Used both to hide the fieldset (template,
   * via *hasRole) and to strip those keys from the payload in save() below, so a plain
   * profile edit by someone without this permission never trips
   * EMPLOYEE_SENSITIVE_ACCESS_DENIED just because the (empty, hidden) controls still exist
   * in the form.
   */
  readonly canManageSensitive = computed(() =>
    this.authService.hasPermissionsOrAdmin([PERMISSIONS.EMPLOYEE_MANAGE_SENSITIVE]),
  );

  readonly form = this.fb.group({
    id: this.fb.control<string | null>(null),
    employeeNumber: this.fb.control('', { validators: [Validators.required, Validators.maxLength(50)] }),
    firstName: this.fb.control('', { validators: [Validators.required, Validators.maxLength(100)] }),
    lastName: this.fb.control('', { validators: [Validators.required, Validators.maxLength(100)] }),
    email: this.fb.control('', { validators: [Validators.email] }),
    phone: this.fb.control(''),
    departmentId: this.fb.control<string | null>(null),
    jobTitleId: this.fb.control<string | null>(null),
    managerId: this.fb.control<string | null>(null),
    employmentType: this.fb.control<EmploymentType>('FULL_TIME'),
    status: this.fb.control<EmployeeStatus>('ACTIVE'),
    hireDate: this.fb.control('', { validators: [Validators.required] }),
    terminationDate: this.fb.control<string | null>(null),
    salary: this.fb.control<number | null>(null),
    bankName: this.fb.control(''),
    bankAccountNumber: this.fb.control(''),
    nationalId: this.fb.control(''),
  });

  /** Backend dates arrive as full ISO timestamps — <input type="date"> needs just the date part. */
  protected override patchForm(value: Employee | null): void {
    if (!value) return;
    super.patchForm({
      ...value,
      hireDate: value.hireDate?.slice(0, 10),
      terminationDate: value.terminationDate?.slice(0, 10) ?? null,
    });
  }

  @AsyncCheckFormValidity('form')
  override save(): void {
    const raw = this.form.getRawValue();
    const payload: Record<string, unknown> = { ...raw, id: raw.id ?? undefined };

    // The create endpoint's Joi schema rejects unknown keys, and doesn't accept `status` at
    // all (new employees always start ACTIVE) — only send it on update.
    if (this.isNew()) delete payload['status'];

    if (!this.canManageSensitive()) {
      for (const field of SENSITIVE_FIELDS) delete payload[field];
    }

    for (const key of OMIT_IF_EMPTY) {
      if (payload[key] === '' || payload[key] === null) delete payload[key];
    }

    this.dataSvc.updateOrCreate(payload as Partial<Employee>).subscribe({
      next: (result) => this.handleSaveResult(result),
      error: (err) => this.handleSaveError(err),
    });
  }
}
