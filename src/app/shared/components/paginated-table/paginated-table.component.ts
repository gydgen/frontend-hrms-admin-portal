import { Directive, computed, effect, inject, signal, untracked } from '@angular/core';
import { rxResource, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { GenericCollectionService, ListParams } from '../../services/generic-collection.service';
import { ToastrService } from '../../toastr/toastr.service';
import { ConfirmDialogService } from '../../confirm-dialog/confirm-dialog.service';
import { Confirmable } from '../../decorators/confirm.decorator';

/** How long to wait after the last keystroke before a search actually hits the backend. */
const SEARCH_DEBOUNCE_MS = 300;

export interface TableHeader {
  field: string;
  header: string;
}

/** PrimeNG p-table lazy-load event shape (subset actually used here). */
export interface TableLazyLoadEvent {
  first?: number | null;
  rows?: number | null;
}

/**
 * Base class for list pages. Data-fetching uses `rxResource()` so that changing `page`,
 * `perPage`, or `searchTerm` automatically re-triggers the fetch — no manual `subscribe()`,
 * no manual re-fetch after a mutation (call `.reload()` explicitly after a delete/save).
 *
 * backend-hrms's list endpoints don't support server-side sorting, so unlike a generic
 * template this intentionally has no sortField/sortOrder wiring — only page/perPage/search.
 */
@Directive() // abstract base — never instantiated directly, always extended by a real @Component
export abstract class PaginatedTableComponent<T extends { id?: string }> {
  protected readonly router = inject(Router);
  protected readonly route = inject(ActivatedRoute);
  protected readonly toastr = inject(ToastrService);
  protected readonly confirmDialog = inject(ConfirmDialogService);

  /** Subclass supplies its GenericCollectionService<T> subclass. */
  abstract dataSvc: GenericCollectionService<T>;
  /** Subclass supplies column definitions. */
  abstract headers: TableHeader[];

  readonly page = signal(1);
  readonly perPage = signal(20);
  /** Bind the search box to this directly — updates immediately so typing feels responsive. */
  readonly searchTerm = signal('');

  /**
   * The value that actually drives the backend request. Debounced off `searchTerm` so a
   * request fires only once the user pauses typing, not on every keystroke — and
   * `distinctUntilChanged` skips re-firing when the settled value hasn't actually changed
   * (e.g. typing then deleting back to the same string within the debounce window).
   */
  private readonly debouncedSearchTerm = toSignal(
    toObservable(this.searchTerm).pipe(debounceTime(SEARCH_DEBOUNCE_MS), distinctUntilChanged()),
    { initialValue: '' },
  );

  protected readonly request = computed<ListParams>(() => ({
    page: this.page(),
    perPage: this.perPage(),
    ...(this.debouncedSearchTerm() ? { search: this.debouncedSearchTerm() } : {}),
  }));

  constructor() {
    // Resets to page 1 only once a new search actually takes effect (i.e. in step with the
    // debounced value, not on every keystroke) — otherwise resetting `page` immediately in
    // onSearch() would itself change `request()` and trigger a fetch ahead of the debounce.
    effect(() => {
      this.debouncedSearchTerm();
      untracked(() => this.page.set(1));
    });
  }

  /**
   * `.value()` is the paginated data (undefined while loading the first time),
   * `.isLoading()` drives the `[loading]` input, `.error()` drives the error state,
   * `.reload()` re-runs the current request (use after a mutation).
   */
  readonly paginatedData = rxResource({
    params: () => this.request(),
    stream: ({ params }) => this.dataSvc.paginate(params),
  });

  /** Wire directly to <p-table (onLazyLoad)="onLazyLoad($event)">. */
  onLazyLoad(event: TableLazyLoadEvent): void {
    const rows = event.rows ?? this.perPage();
    this.perPage.set(rows);
    this.page.set(Math.floor((event.first ?? 0) / rows) + 1);
  }

  /** Wire directly to the search input's (ngModelChange)/(input) — the request itself is debounced (see debouncedSearchTerm above). */
  onSearch(term: string): void {
    this.searchTerm.set(term);
  }

  navigateToEdition(id: string | 'add'): void {
    this.router.navigate([id], { relativeTo: this.route });
  }

  edit(item: T): void {
    this.navigateToEdition(item.id!);
  }

  /** Override for custom confirm-dialog copy per feature. */
  getDeleteConfirmTitle(_item: T): string {
    return 'Delete this item?';
  }

  getDeleteConfirmContent(_item: T): string {
    return 'This action cannot be undone.';
  }

  /**
   * The reference implementation of "destructive action behind @Confirmable". Note the
   * `function` (not arrow) expressions passed to the decorator options — required so
   * `this` inside them resolves to the component instance.
   */
  @Confirmable<[T]>({
    title: function (this: PaginatedTableComponent<T>, item: T) {
      return this.getDeleteConfirmTitle(item);
    },
    content: function (this: PaginatedTableComponent<T>, item: T) {
      return this.getDeleteConfirmContent(item);
    },
    severity: 'danger',
  })
  delete(item: T): void {
    this.dataSvc.delete(item.id!).subscribe({
      next: () => {
        this.toastr.triggerToastr('success', 'Deleted successfully');
        this.paginatedData.reload();
      },
      error: (err) =>
        this.toastr.triggerToastr('error', err?.error?.message ?? 'Something went wrong. Please try again.'),
    });
  }
}
