import { Component, computed, effect, inject, signal } from '@angular/core';
import { ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { EditingFormComponent } from '../../../shared/components/editing-form/editing-form.component';
import { FieldErrorComponent } from '../../../shared/components/field-error/field-error.component';
import { HasRoleDirective } from '../../../core/auth/directives/has-role.directive';
import { AsyncCheckFormValidity } from '../../../shared/decorators/async-check-form-validity.decorator';
import {
  MODULE_LABELS,
  MODULE_PERMISSION_CATALOG,
  Module,
  PERMISSIONS,
  formatPermissionLabel,
} from '../../../core/constants/permissions';
import { ASSIGNABLE_DATA_SCOPES, DataScope } from '../../../core/constants/data-scopes';
import { ModulePermission, Role } from '../interfaces/role';
import { RoleService } from '../services/role.service';

interface PermissionModuleGroup {
  module: Module;
  label: string;
  permissions: { value: string; label: string }[];
}

@Component({
  selector: 'app-role-edition',
  imports: [ReactiveFormsModule, RouterLink, FieldErrorComponent, HasRoleDirective],
  templateUrl: './role-edition.component.html',
  styleUrl: './role-edition.component.scss',
  host: {
    class: 'form-page form-page--container',
  },
})
export class RoleEditionComponent extends EditingFormComponent<Role> {
  readonly dataSvc = inject(RoleService);
  readonly permissions = PERMISSIONS;
  readonly dataScopes = ASSIGNABLE_DATA_SCOPES;

  /** One group per module, built from the mirrored MODULE_PERMISSION_CATALOG (see permissions.ts). */
  readonly permissionGroups: PermissionModuleGroup[] = (
    Object.keys(MODULE_PERMISSION_CATALOG) as Module[]
  ).map((module) => ({
    module,
    label: MODULE_LABELS[module],
    permissions: MODULE_PERMISSION_CATALOG[module].map((permission) => ({
      value: permission,
      label: formatPermissionLabel(permission),
    })),
  }));

  /** System roles (e.g. the seeded Super Admin) reject any update with SYSTEM_ROLE_PROTECTED. */
  readonly isSystemRole = computed(() => this.value()?.isSystemRole ?? false);

  /**
   * modulePermissions tracked outside the reactive form: a dynamic module→permissions map
   * doesn't fit FormGroup/FormArray cleanly, so it's a plain signal merged into the payload
   * on save() instead.
   */
  readonly selectedPermissions = signal<Record<string, string[]>>({});

  readonly form = this.fb.group({
    id: this.fb.control<string | null>(null),
    name: this.fb.control('', { validators: [Validators.required, Validators.maxLength(120)] }),
    description: this.fb.control(''),
    dataScope: this.fb.control<DataScope>('OWN', { validators: [Validators.required] }),
    isActive: this.fb.control(true),
  });

  constructor() {
    super();

    effect(() => {
      const map: Record<string, string[]> = {};
      for (const entry of this.value()?.modulePermissions ?? []) {
        map[entry.module] = entry.permissions;
      }
      this.selectedPermissions.set(map);
    });

    effect(() => {
      if (this.isSystemRole()) this.form.disable();
    });
  }

  isChecked(module: string, permission: string): boolean {
    return this.selectedPermissions()[module]?.includes(permission) ?? false;
  }

  togglePermission(module: string, permission: string, checked: boolean): void {
    this.selectedPermissions.update((current) => {
      const existing = new Set(current[module] ?? []);
      if (checked) {
        existing.add(permission);
      } else {
        existing.delete(permission);
      }
      return { ...current, [module]: [...existing] };
    });
  }

  /**
   * Overrides the base save() to merge the permission-matrix state into the payload
   * (see selectedPermissions above). Re-declares @AsyncCheckFormValidity since decorating
   * the base class method doesn't carry over to an overriding one.
   */
  @AsyncCheckFormValidity('form')
  override save(): void {
    const modulePermissions: ModulePermission[] = Object.entries(this.selectedPermissions())
      .map(([module, perms]) => ({ module, permissions: perms }))
      .filter((entry) => entry.permissions.length > 0);

    // Angular's typed reactive forms make every control's value `T | null` by default
    // (not just `id`) — cast rather than null-coalesce each field individually, since
    // @AsyncCheckFormValidity above already guarantees required fields (name, dataScope)
    // are populated by the time this line runs.
    const { id, ...rest } = this.form.getRawValue();
    this.dataSvc.updateOrCreate({ ...rest, id: id ?? undefined, modulePermissions } as Partial<Role>).subscribe({
      next: (result) => this.handleSaveResult(result),
      error: (err) => this.handleSaveError(err),
    });
  }
}
