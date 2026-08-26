import type { ConfirmDialogService } from '../confirm-dialog/confirm-dialog.service';

export interface ConfirmableOptions<A extends unknown[]> {
  title?: string | ((...args: A) => string);
  content?: string | ((...args: A) => string);
  acceptLabel?: string;
  rejectLabel?: string;
  severity?: 'danger' | 'primary';
}

/**
 * Requires the host class to inject `ConfirmDialogService` as `confirmDialog`. Wraps the
 * decorated method so it only runs after the user accepts the confirm dialog — never
 * hand-roll `confirmDialog.confirm({ ..., accept: () => this.doTheThing() })` inline.
 *
 * Note: any `title`/`content` function passed here must be a `function` expression, not
 * an arrow function — arrow functions capture `this` lexically at decoration time (module
 * load), not the component instance the wrapper below binds `this` to at call time.
 */
export function Confirmable<A extends unknown[]>(options: ConfirmableOptions<A>) {
  return function (_target: unknown, propertyKey: string, descriptor: PropertyDescriptor): PropertyDescriptor {
    const original = descriptor.value as (...args: A) => void;
    descriptor.value = function (this: { confirmDialog: ConfirmDialogService }, ...args: A) {
      if (!this.confirmDialog) {
        throw new Error(
          `@Confirmable on "${propertyKey}" requires the host class to inject ConfirmDialogService as 'confirmDialog'.`,
        );
      }
      const header = typeof options.title === 'function' ? options.title.call(this, ...args) : options.title;
      const message = typeof options.content === 'function' ? options.content.call(this, ...args) : options.content;
      this.confirmDialog.confirm({
        header,
        message,
        acceptLabel: options.acceptLabel,
        rejectLabel: options.rejectLabel,
        severity: options.severity,
        accept: () => original.apply(this, args),
      });
    };
    return descriptor;
  };
}
