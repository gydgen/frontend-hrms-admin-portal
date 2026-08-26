import { Directive, TemplateRef, ViewContainerRef, effect, inject, input } from '@angular/core';
import { AuthService } from '../../../features/auth/services/auth.service';

/** *hasAnyRole="['department.view', 'department.update']"  — ANY of these grants access */
@Directive({ selector: '[hasAnyRole]', standalone: true })
export class HasAnyRoleDirective {
  private readonly templateRef = inject(TemplateRef<unknown>);
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly authService = inject(AuthService);

  readonly hasAnyRole = input.required<string[]>();

  private rendered = false;

  constructor() {
    effect(() => this.render(this.authService.hasSomePermissionsOrAdmin(this.hasAnyRole())));
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
