import { Directive, TemplateRef, ViewContainerRef, effect, inject, input } from '@angular/core';
import { AuthService } from '../../../features/auth/services/auth.service';

/** *hasRole="'department.create'"  or  *hasRole="['department.create', 'department.update']" (ALL required) */
@Directive({ selector: '[hasRole]', standalone: true })
export class HasRoleDirective {
  private readonly templateRef = inject(TemplateRef<unknown>);
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly authService = inject(AuthService);

  readonly hasRole = input.required<string | string[]>();

  private rendered = false;

  constructor() {
    effect(() => {
      const roles = Array.isArray(this.hasRole()) ? this.hasRole() : [this.hasRole()];
      this.render(this.authService.hasPermissionsOrAdmin(roles as string[]));
    });
  }

  private render(allowed: boolean): void {
    if (allowed && !this.rendered) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.rendered = true;
    } else if (!allowed && this.rendered) {
      this.viewContainer.clear();
      this.rendered = false;
    }
  }
}
