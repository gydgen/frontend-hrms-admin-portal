import { Directive, computed, effect, inject, input } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { EditingFormBase } from './editing-form-base';
import { AsyncCheckFormValidity } from '../../decorators/async-check-form-validity.decorator';

/**
 * Page-routed editing. `id` and `value` are input signals bound automatically from the
 * route: `id` from the `:id` path param, `value` from `resolve: { value: xResolver }` —
 * requires `provideRouter(routes, withComponentInputBinding())` in app.config.ts.
 */
@Directive()
export abstract class EditingFormComponent<I extends { id?: string }, O = I> extends EditingFormBase<I, O> {
  protected readonly router = inject(Router);
  protected readonly route = inject(ActivatedRoute);

  readonly id = input<string>();
  readonly value = input<I | null>(null);

  readonly isNew = computed(() => this.id() === 'add');

  constructor() {
    super();
    // Re-patches the form every time a new `value` arrives (e.g. navigating from one edit
    // route to another without the component being destroyed).
    effect(() => this.patchForm(this.value()));
  }

  @AsyncCheckFormValidity('form')
  save(): void {
    this.dataSvc.updateOrCreate(this.form.getRawValue()).subscribe({
      next: (result) => this.handleSaveResult(result),
      error: (err) => this.handleSaveError(err),
    });
  }

  /** Navigate to '../' (not a hardcoded list URL) so canDeactivate guards fire correctly. */
  cancelEdit(): void {
    this.router.navigate(['../'], { relativeTo: this.route });
  }
}
