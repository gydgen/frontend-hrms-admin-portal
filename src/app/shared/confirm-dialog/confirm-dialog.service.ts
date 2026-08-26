import { Injectable, signal } from '@angular/core';

export interface ConfirmOptions {
  header?: string;
  message?: string;
  acceptLabel?: string;
  rejectLabel?: string;
  severity?: 'danger' | 'primary';
  accept: () => void;
  reject?: () => void;
}

/**
 * Lightweight confirm-dialog state holder, rendered once by `ConfirmDialogComponent`
 * (mounted in the app shell alongside `<app-toastr />`). Call `confirm()` from anywhere
 * via DI — no dialog service/module wiring required per feature.
 */
@Injectable({ providedIn: 'root' })
export class ConfirmDialogService {
  readonly options = signal<ConfirmOptions | null>(null);

  confirm(options: ConfirmOptions): void {
    this.options.set(options);
  }

  accept(): void {
    const options = this.options();
    this.options.set(null);
    options?.accept();
  }

  cancel(): void {
    const options = this.options();
    this.options.set(null);
    options?.reject?.();
  }
}
