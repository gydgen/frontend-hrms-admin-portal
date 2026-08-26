# Angular App Structure Template (PrimeNG + Angular Material)

> **What this is.** A portable extraction of the architectural patterns that make
> `appolow-platform-front`'s conventional admin/CRUD screens (`user-management/`,
> `role-management/`, `theme-management/`, ...) so consistent — rewritten so they have
> **no dependency on the proprietary `@appolow/*` libraries**. Use this file as the
> baseline architecture for any other Angular application you build or maintain.
>
> **What it is not.** It doesn't cover the low-code designer/extensibility system
> (modules, widgets, plugins) documented in `documentation/extension-generation/` —
> that machinery is specific to this platform. This file only covers the
> **conventional layered admin app** philosophy, which is the one that generalizes.
>
> **Companion files:**
> - [`ANGULAR_I18N_TRANSLATION_GUIDE.md`](./ANGULAR_I18N_TRANSLATION_GUIDE.md) — full i18n/Transloco setup, referenced throughout this file as `Translations`.
> - [`ANGULAR_NEW_FEATURE_AGENT_PROMPT.md`](./ANGULAR_NEW_FEATURE_AGENT_PROMPT.md) — a copy-pasteable prompt that hands this document to an AI coding agent to scaffold a new feature.
>
> **UI library split** (deliberate, keep it consistent):
> - **PrimeNG** for anything data-heavy or with complex interaction state: tables (`p-table`), dialogs (`DynamicDialog`), dropdowns, calendars, file upload, toasts (`MessageService`), confirmation (`ConfirmationService`).
> - **Angular Material** for simple, low-state atomic controls where you don't need PrimeNG's data-binding machinery: buttons, icons, tooltips, simple toggles, snackbar-free notifications (we standardize on PrimeNG's `MessageService` for toasts — see §8 — so Material's `MatSnackBar` is intentionally **not** used, to avoid two competing notification systems).
> - **Never mix both for the same concern** in one view (e.g. don't put a `MatButton` next to `p-button` performing the same kind of action in the same toolbar). Pick one per screen region.

---

## Table of contents

1. [Prerequisites](#1-prerequisites)
2. [Global folder structure](#2-global-folder-structure)
3. [Feature folder shape](#3-feature-folder-shape)
4. [Reuse-first checklist](#4-reuse-first-checklist)
5. [Abstract base class: `CollectionService<T>`](#5-abstract-base-class-collectionservicet)
6. [Abstract base class: `PaginatedTableComponent<T>` (PrimeNG)](#6-abstract-base-class-paginatedtablecomponentt-primeng)
7. [Abstract base classes: `EditingFormComponent<I,O>` / `EditingFormInDialog<I,O>`](#7-abstract-base-classes-editingformcomponenti o--editingformindialogi-o)
8. [Toast notifications (`Toast` static facade over PrimeNG `MessageService`)](#8-toast-notifications)
9. [Confirmation, form-validity and dirty-check decorators](#9-confirmation-form-validity-and-dirty-check-decorators)
10. [Permission directives & guards](#10-permission-directives--guards)
11. [Validators folder convention](#11-validators-folder-convention)
12. [Routing conventions](#12-routing-conventions)
13. [Step-by-step recipe for a new feature](#13-step-by-step-recipe-for-a-new-feature)
14. [Full worked example: `product-management`](#14-full-worked-example-product-management)
15. [`app.config.ts` wiring](#15-appconfigts-wiring)

---

## 1. Prerequisites

```bash
npm install primeng primeicons @primeng/themes
npm install @angular/material @angular/cdk
npm install @jsverse/transloco
```

Angular version target: v17+ (standalone components, `input()`/`output()`/`model()`, signals, `resource()`/`rxResource()`, the `@if`/`@for` control-flow syntax, `inject()`). All code samples in this document assume that baseline.

---

## 2. Global folder structure

```
src/app/
├── core/
│   ├── auth/
│   │   ├── directives/        # [hasRole], [hasAnyRole]
│   │   ├── guards/            # authGuard, rolesGuard
│   │   └── services/          # AuthService
│   ├── constants/
│   │   └── errors.ts          # validator-key → translation-key map
│   ├── guards/
│   │   └── form.guard.ts      # canDeactivateFormFn (dirty-form navigation guard)
│   ├── interceptors/          # jwtInterceptor, acceptLanguageInterceptor, ...
│   └── services/
│       ├── collection.service.ts
│       ├── toast.service.ts
│       └── translations.service.ts   # see i18n guide
├── shared/
│   ├── components/
│   │   ├── editing-form/               # EditingFormComponent<I,O>
│   │   ├── editing-form-in-dialog/     # EditingFormInDialog<I,O>
│   │   ├── paginated-table/            # PaginatedTableComponent<T>
│   │   └── field-error/                # FieldErrorComponent
│   ├── decorators/
│   │   ├── confirm.decorator.ts        # @Confirmable
│   │   ├── async-check-form-validity.decorator.ts
│   │   └── check-form-dirt.decorator.ts
│   └── validators/
│       ├── common/
│       └── strings/
├── <feature>-management/      # see §3
└── app.routes.ts
```

Every "conventional admin screen" feature (users, roles, products, whatever your domain entity is) lives in its own top-level `<feature>-management/` folder, or as a subfolder of an existing large feature area — never scattered loosely under `shared/`.

---

## 3. Feature folder shape

This is the single strongest, most-repeated convention worth carrying into every new app. Derived from `user-management/`, `role-management/`, `theme-management/` in this codebase:

```
x-management/
├── components/
│   ├── x-list/
│   │   ├── x-list.component.ts        # extends PaginatedTableComponent<X>
│   │   ├── x-list.component.html      # .list-page__header / .list-page__content + p-table
│   │   └── x-list.component.scss
│   └── x-edition/
│       ├── x-edition.component.ts     # extends EditingFormComponent<X> (or EditingFormInDialog)
│       ├── x-edition.component.html   # PrimeNG form controls, formControlName-bound
│       └── x-edition.component.scss
├── services/
│   └── x.service.ts                    # extends CollectionService<X>
├── resolvers/
│   └── x.resolver.ts                   # id === 'add' ? of(null) : service.find(id)
├── interfaces/
│   └── x.ts
└── x-management.routes.ts              # list / add / :id, resolve, data.breadcrumb, canActivate
```

Wired into `src/app/app.routes.ts` (or a parent feature's route file) via `children: xManagementRoutes`.

---

## 4. Reuse-first checklist

Before writing new code, check whether one of these already solves the problem. This is the table to hand an AI agent or a new team member so nobody reinvents an already-solved cross-cutting concern.

| Don't... | Use instead |
|---|---|
| Open a confirm dialog manually (`ConfirmationService.confirm(...)` inline scattered everywhere) | The `@Confirmable(...)` method decorator (§9) |
| Write a new paginated table/list page from scratch | `PaginatedTableComponent<T>` (§6) — extend it, supply `dataSvc` + `headers`, copy the `.list-page__*` template skeleton |
| Hand-roll create/edit form save-and-navigate logic | `EditingFormComponent<I,O>` / `EditingFormInDialog<I,O>` (§7) |
| Write raw `HttpClient` CRUD calls for a REST resource | `CollectionService<T>` (§5) |
| Write a new "check permission" `*ngIf` | `[hasRole]` / `[hasAnyRole]` structural directives (§10) |
| Hand-check form validity before submit | `@AsyncCheckFormValidity()` (§9) |
| Warn about unsaved changes yourself | `@CheckFormDirt({ formKeyName })` (§9) or `canDeactivateFormFn` (§12) |
| Import `MessageService` directly all over the app / build another notification wrapper | The static `Toast` facade (§8) |
| Add a new async-uniqueness / regex-shaped validator without checking first | `shared/validators/{common,strings}/` (§11) |

---

## 5. Abstract base class: `CollectionService<T>`

**Why it exists**: every feature needs the same five operations against a REST resource (list, paginate, find, save, delete), and duplicating `HttpClient` calls per feature is exactly the kind of "three similar lines become copy-pasted fifteen times" problem an abstract base solves once.

**Layering**: `Component → Feature Service (extends CollectionService<T>) → HttpClient → environment.baseURL`. There is no separate "data service" layer between the feature service and `HttpClient` — the feature service *is* the API layer. Keep it that way; don't introduce an extra repository/data-access layer unless you have a concrete reason (e.g. offline caching) that this base class doesn't cover.

```ts
// core/services/collection.service.ts
import { HttpClient, HttpParams } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface PaginatedData<T> {
  data: T[];
  currentPage: number;
  lastPage: number;
  total: number;
  perPage: number;
}

export interface ListRequest {
  page?: number;
  perPage?: number;
  sortField?: string;
  sort?: 'asc' | 'desc';
  filters?: Record<string, unknown>;
  generalSearch?: { value: string; fields: string[] };
}

interface BackendPaginatedResponse<T> {
  content: T[];
  page: number;
  totalPages: number;
  totalElements: number;
  size: number;
}

export abstract class CollectionService<T extends { id?: string | number }> {
  protected readonly http = inject(HttpClient);

  /** Subclasses set the REST resource segment, e.g. 'products'. */
  protected abstract path: string;

  /** Subclasses override when the natural default sort isn't 'id asc'. */
  protected defaultListOrdination: { sortField: string; sort: 'asc' | 'desc' } = {
    sortField: 'id',
    sort: 'asc',
  };

  /** Fetch (almost) everything unpaginated — for dropdowns, selects, small reference lists. */
  list(request: Partial<ListRequest> = {}): Observable<PaginatedData<T>> {
    return this.paginate({ ...request, perPage: request.perPage ?? 9999 });
  }

  /** The real, server-paginated list call used by PaginatedTableComponent. */
  paginate(request: ListRequest): Observable<PaginatedData<T>> {
    const page = request.page ?? 0;
    const perPage = request.perPage ?? 20;
    const sortField = request.sortField ?? this.defaultListOrdination.sortField;
    const sort = request.sort ?? this.defaultListOrdination.sort;

    const params = new HttpParams()
      .set('size', perPage)
      .set('page', page)
      .set('sort', sort)
      .set('sortField', sortField);

    const body: Record<string, unknown> = {
      sortField,
      sort,
      where: request.filters ?? {},
      ...(request.generalSearch?.value ? { generalSearch: request.generalSearch } : {}),
    };

    return this.http
      .post<BackendPaginatedResponse<T>>(`${environment.baseURL}/${this.path}/search`, body, { params })
      .pipe(
        map((res) => ({
          data: res.content,
          currentPage: res.page,
          lastPage: res.totalPages,
          total: res.totalElements,
          perPage: res.size,
        })),
        // Deliberate design choice, inherited from the source pattern: a failed search
        // degrades to an empty page instead of propagating. Trade-off: list pages never
        // "crash" visibly on a bad filter/search, but a genuinely broken endpoint will
        // present as a silently-empty table. If you need the caller to see the error,
        // don't use this method — call http directly for that one screen, or add a
        // second method (e.g. `paginateOrThrow`) rather than changing this one, since
        // 28+ list pages depend on the swallow-to-empty behavior once you port this
        // pattern across features.
        catchError((err) => {
          console.error(`[CollectionService] paginate failed for "${this.path}"`, err);
          return of<PaginatedData<T>>({ data: [], currentPage: 0, lastPage: 0, total: 0, perPage });
        }),
      );
  }

  find(id: string | number): Observable<T> {
    return this.http.get<T>(`${environment.baseURL}/${this.path}/${id}`);
  }

  /** POST if new (no id), PUT if existing. Accepts FormData for file-upload payloads too. */
  updateOrCreate(value: Partial<T> | FormData): Observable<T> {
    const id = value instanceof FormData ? value.get('id') : value.id;
    return id
      ? this.http.put<T>(`${environment.baseURL}/${this.path}/${id}`, value)
      : this.http.post<T>(`${environment.baseURL}/${this.path}`, value);
  }

  delete(id: string | number): Observable<void> {
    return this.http.delete<void>(`${environment.baseURL}/${this.path}/${id}`);
  }

  /** The standard way async-uniqueness validators check the backend (see §11). */
  exists(filters: Record<string, unknown>): Observable<boolean> {
    return this.list({ filters, perPage: 1 }).pipe(map((res) => res.data.length > 0));
  }
}
```

**Usage** — a subclass is almost always this small:

```ts
// x-management/services/x.service.ts
@Injectable({ providedIn: 'root' })
export class XService extends CollectionService<X> {
  protected override path = 'x-resources';
  protected override defaultListOrdination = { sortField: 'name', sort: 'asc' as const };
}
```

**Multi-tenant / app-scoped variant.** If your app has a concept of "current workspace/tenant/app" that every resource URL must be prefixed with (the way `AppCollectionService<T>` prepends `applications/{currentApp.id}/` in the source platform), don't copy that concern into every feature service. Add one more abstract layer:

```ts
export abstract class ScopedCollectionService<T extends { id?: string | number }> extends CollectionService<T> {
  protected abstract resourcePath: string;
  private readonly workspace = inject(WorkspaceService); // whatever holds "current tenant"

  protected override get path(): string {
    const current = this.workspace.current();
    if (!current) throw new Error('No workspace selected — cannot build resource path.');
    return `workspaces/${current.id}/${this.resourcePath}`;
  }
}
```

Only introduce this if you actually have that scoping concept — don't add it speculatively.

---

## 6. Abstract base class: `PaginatedTableComponent<T>` (PrimeNG)

**Why it exists**: list pages are the single most repeated screen shape in an admin app. Without a base class, every list page reimplements: page/size state, sorting, search-debounce, URL-synced state, loading state, delete-with-confirm, and the fetch-on-change wiring. The base class turns all of that into "define `dataSvc` and `headers`."

**Data-fetching mechanism**: uses `rxResource()` (the RxJS-interop flavor of Angular's `resource()` API) so that changing any of the input signals (page, search term, sort, filters) automatically re-triggers the fetch — no manual `subscribe()` in `ngOnInit()`, no manual re-fetch calls after mutations (call `.reload()` explicitly only after a delete/save when you want to force a refresh of the *current* page).

```ts
// shared/components/paginated-table/paginated-table.component.ts
import { Directive, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { CollectionService, ListRequest } from '../../../core/services/collection.service';
import { Translations } from '../../../core/services/translations.service';
import { Confirmable } from '../../decorators/confirm.decorator';

export interface TableHeader {
  field: string;
  header: string; // translation key, e.g. 'PRODUCT_LIST.LABELS.NAME'
  sortable?: boolean;
  width?: string;
}

/** PrimeNG p-table lazy-load event shape (subset actually used here). */
export interface TableLazyLoadEvent {
  first?: number;
  rows?: number;
  sortField?: string | string[];
  sortOrder?: number;
}

@Directive() // abstract base — never instantiated directly, always extended by a real @Component
export abstract class PaginatedTableComponent<T extends { id?: string | number }> {
  protected readonly router = inject(Router);
  protected readonly route = inject(ActivatedRoute);
  protected readonly confirmationService = inject(ConfirmationService);
  protected readonly messageService = inject(MessageService);

  /** Subclass supplies its CollectionService<T> subclass. */
  abstract dataSvc: CollectionService<T>;
  /** Subclass supplies column definitions. */
  abstract headers: TableHeader[];

  /** Fields the generalSearch box searches across on the backend. Override per feature. */
  searchKeys: string[] = [];
  /** Default sort before the user touches a column header. Override per feature. */
  defaultSort: { sortField: string; sort: 'asc' | 'desc' } = { sortField: 'id', sort: 'asc' };

  // --- State signals: everything the table depends on lives here, as signals ---
  readonly page = signal(0);
  readonly perPage = signal(20);
  readonly searchTerm = signal('');
  readonly sortField = signal(this.defaultSort.sortField);
  readonly sortOrder = signal<'asc' | 'desc'>(this.defaultSort.sort);
  readonly dynamicFilters = signal<Record<string, unknown>>({});

  /**
   * The single computed request object. Every signal above is an input to this
   * computed — rxResource re-fetches automatically whenever any of them change,
   * which is why there's no manual "on filter change, refetch" code anywhere.
   */
  protected readonly request = computed<ListRequest>(() => ({
    page: this.page(),
    perPage: this.perPage(),
    sortField: this.sortField(),
    sort: this.sortOrder(),
    filters: this.dynamicFilters(),
    ...(this.searchTerm()
      ? { generalSearch: { value: this.searchTerm(), fields: this.searchKeys } }
      : {}),
  }));

  /**
   * Data fetching as a resource, not a manual subscription. `.value()` is the
   * paginated data (undefined while loading the first time), `.isLoading()` drives
   * the p-table `[loading]` input, `.reload()` re-runs the current request (use
   * after a mutation instead of resetting `page`/`perPage`, which would also reset
   * the user's scroll position and re-trigger a full round-trip of state changes).
   */
  readonly paginatedData = rxResource({
    params: () => this.request(),
    stream: ({ params }) => this.dataSvc.paginate(params),
  });

  /** Wire directly to <p-table (onLazyLoad)="onLazyLoad($event)">. */
  onLazyLoad(event: TableLazyLoadEvent): void {
    const rows = event.rows ?? this.perPage();
    this.perPage.set(rows);
    this.page.set(Math.floor((event.first ?? 0) / rows));
    const field = Array.isArray(event.sortField) ? event.sortField[0] : event.sortField;
    if (field) {
      this.sortField.set(field);
      this.sortOrder.set(event.sortOrder === 1 ? 'asc' : 'desc');
    }
  }

  onSearch(term: string): void {
    this.searchTerm.set(term);
    this.page.set(0); // a new search always starts back on page 1
  }

  navigateToEdition(id: string | number | 'add'): void {
    this.router.navigate([id], { relativeTo: this.route });
  }

  view(item: T): void {
    this.navigateToEdition(item.id!);
  }

  edit(item: T): void {
    this.navigateToEdition(item.id!);
  }

  /** Override for custom confirm-dialog copy per feature. */
  getDeleteConfirmTitle(_item: T): string {
    return Translations.instant('GENERIC.MESSAGES.WARNING.DELETE_ELEMENT?');
  }

  getDeleteConfirmContent(_item: T): string {
    return Translations.instant('GENERIC.MESSAGES.WARNING.ACTION_CANNOT_BE_UNDONE');
  }

  /**
   * The reference implementation of "destructive action behind @Confirmable".
   * Note the `function` (not arrow) expressions passed to the decorator options —
   * that's required so `this` inside them resolves to the component instance
   * (see the this-binding note in §9).
   */
  @Confirmable<[unknown]>({
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
        this.messageService.add({
          severity: 'success',
          summary: Translations.instant('GENERIC.MESSAGES.SUCCESS.DELETED'),
        });
        this.paginatedData.reload();
      },
      error: (err) =>
        this.messageService.add({
          severity: 'error',
          summary: Translations.instant(err?.error?.message ?? 'GENERIC.MESSAGES.ERROR.GENERIC'),
        }),
    });
  }
}
```

### `.list-page__*` template skeleton

```html
<!-- x-list.component.html -->
<div class="list-page">
  <header class="list-page__header">
    <h1>{{ 'X_LIST.TITLES.MAIN' | transloco }}</h1>

    <p-iconfield class="list-page__search">
      <p-inputicon class="pi pi-search" />
      <input
        pInputText
        type="text"
        [placeholder]="'GENERIC.LABELS.SEARCH' | transloco"
        (input)="onSearch($any($event.target).value)"
      />
    </p-iconfield>

    <button
      pButton
      type="button"
      icon="pi pi-plus"
      [label]="'GENERIC.BUTTONS.ADD' | transloco"
      *hasRole="'X_CREATE'"
      (click)="navigateToEdition('add')"
    ></button>
  </header>

  <section class="list-page__content">
    <p-table
      [value]="paginatedData.value()?.data ?? []"
      [loading]="paginatedData.isLoading()"
      [lazy]="true"
      [paginator]="true"
      [rows]="perPage()"
      [totalRecords]="paginatedData.value()?.total ?? 0"
      [rowsPerPageOptions]="[10, 20, 50]"
      (onLazyLoad)="onLazyLoad($event)"
    >
      <ng-template #header>
        <tr>
          @for (col of headers; track col.field) {
            <th [pSortableColumn]="col.sortable ? col.field : undefined">
              {{ col.header | transloco }}
              @if (col.sortable) {
                <p-sortIcon [field]="col.field" />
              }
            </th>
          }
          <th></th>
        </tr>
      </ng-template>

      <ng-template #body let-row>
        <tr>
          @for (col of headers; track col.field) {
            <td>{{ row[col.field] }}</td>
          }
          <td class="list-page__row-actions">
            <button pButton icon="pi pi-pencil" [text]="true" (click)="edit(row)" *hasRole="'X_EDIT'"></button>
            <button
              pButton
              icon="pi pi-trash"
              [text]="true"
              severity="danger"
              (click)="delete(row)"
              *hasRole="'X_DELETE'"
            ></button>
          </td>
        </tr>
      </ng-template>

      <ng-template #emptymessage>
        <tr>
          <td [attr.colspan]="headers.length + 1">{{ 'GENERIC.MESSAGES.INFO.NO_RESULTS' | transloco }}</td>
        </tr>
      </ng-template>
    </p-table>
  </section>
</div>
```

### To build a new list page

1. `class XListComponent extends PaginatedTableComponent<X>`.
2. Set `dataSvc` to your `CollectionService<X>` subclass, define `headers: TableHeader[]`, override `searchKeys`/`defaultSort` as needed.
3. Copy the template skeleton above; wrap the "add" button and row actions in `*hasRole`/`*hasAnyRole` for the required permission.
4. Override `getDeleteConfirmTitle`/`getDeleteConfirmContent` if you need custom confirm-dialog copy.
5. Do **not** add a manual `ngOnInit` fetch, a manual `subscribe()`, or manual pagination state — if you find yourself doing that, you've stepped outside the base class contract; fix the base class instead of bypassing it.

---

## 7. Abstract base classes: `EditingFormComponent<I,O>` / `EditingFormInDialog<I,O>`

**Why two classes, not one.** An edit screen can be hosted two different ways: as its own routed page (`/x-management/:id`), or inside a modal dialog opened from somewhere else (e.g. "quick-add" from a dropdown). Both need the same core behavior — patch the form when data arrives, gate submission on validity, save via `dataSvc.updateOrCreate()`, toast on success/error — but they differ in *where the initial value comes from* and *what "done" means* (navigate away vs. close the dialog with a result). Rather than duplicating the shared behavior or forcing an awkward single class that tries to do both, the shared logic lives in a base, and each hosting context gets its own thin subclass.

```ts
// shared/components/editing-form/editing-form-base.ts
import { Directive, inject } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { CollectionService } from '../../../core/services/collection.service';
import { Translations } from '../../../core/services/translations.service';

@Directive()
export abstract class EditingFormBase<I extends { id?: string | number }, O = I> {
  protected readonly fb = inject(FormBuilder);
  protected readonly messageService = inject(MessageService);
  protected readonly confirmationService = inject(ConfirmationService);

  abstract dataSvc: CollectionService<I>;
  abstract form: FormGroup;

  /** Load a resolved/passed-in record into the form without marking it dirty. */
  protected patchForm(value: I | null): void {
    if (value) {
      this.form.patchValue(value as Record<string, unknown>);
      this.form.markAsPristine();
    }
  }

  protected handleSaveResult(result: I): void {
    this.form.patchValue(result as Record<string, unknown>);
    this.form.markAsPristine();
    this.messageService.add({
      severity: 'success',
      summary: Translations.instant('GENERIC.MESSAGES.SUCCESS.SAVED'),
    });
  }

  protected handleSaveError(err: { error?: { message?: string } }): void {
    this.messageService.add({
      severity: 'error',
      summary: Translations.instant(err?.error?.message ?? 'GENERIC.MESSAGES.ERROR.GENERIC'),
    });
  }
}
```

```ts
// shared/components/editing-form/editing-form.component.ts
import { Directive, computed, effect, inject, input } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { EditingFormBase } from './editing-form-base';
import { AsyncCheckFormValidity } from '../../decorators/async-check-form-validity.decorator';

/**
 * Page-routed editing. `id` and `value` are input signals bound automatically from
 * the route: `id` from the `:id` path param, `value` from `resolve: { value: xResolver }`
 * — this requires `provideRouter(routes, withComponentInputBinding())` in app.config.ts.
 */
@Directive()
export abstract class EditingFormComponent<I extends { id?: string | number }, O = I> extends EditingFormBase<I, O> {
  protected readonly router = inject(Router);
  protected readonly route = inject(ActivatedRoute);

  readonly id = input<string>();
  readonly value = input<I | null>(null);

  readonly isNew = computed(() => this.id() === 'add');

  constructor() {
    super();
    // Re-patches the form every time a new `value` arrives (e.g. navigating from
    // one edit route to another without the component being destroyed).
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
```

```ts
// shared/components/editing-form-in-dialog/editing-form-in-dialog.component.ts
import { Directive, inject } from '@angular/core';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { EditingFormBase } from '../editing-form/editing-form-base';
import { AsyncCheckFormValidity } from '../../decorators/async-check-form-validity.decorator';
import { CheckFormDirt } from '../../decorators/check-form-dirt.decorator';

/**
 * Modal-hosted editing via PrimeNG DynamicDialog. Initial data comes from
 * `DynamicDialogConfig.data` (passed by the caller that opened the dialog via
 * `DialogService.open(XEditionComponent, { data: existingRecordOrNull })`), not
 * from a route resolver — there is no route here.
 */
@Directive()
export abstract class EditingFormInDialog<I extends { id?: string | number }, O = I> extends EditingFormBase<I, O> {
  protected readonly dialogRef = inject(DynamicDialogRef);
  protected readonly dialogConfig = inject(DynamicDialogConfig);

  constructor() {
    super();
    this.patchForm((this.dialogConfig.data as I) ?? null);
  }

  @AsyncCheckFormValidity('form')
  saveAndClose(): void {
    this.form.disable();
    this.dataSvc.updateOrCreate(this.form.getRawValue()).subscribe({
      next: (result) => this.dialogRef.close(result),
      error: (err) => {
        this.form.enable();
        this.handleSaveError(err);
      },
    });
  }

  /** Guarded dismiss: prompts if the form is dirty before actually closing. */
  @CheckFormDirt({ formKeyName: 'form' })
  dismiss(): void {
    this.dialogRef.close();
  }
}
```

> There is no portable equivalent of the source platform's `EditingFormInPortal` — that variant targets the low-code widget-designer's own portal system and is specific to this platform's extensibility layer. If a future app needs to host an edit form inside some other custom surface (a wizard step, a side panel), extend `EditingFormBase` directly the same way `EditingFormInDialog` does, sourcing the initial value from whatever that surface provides.

**To build a new edit screen**: `class XEditionComponent extends EditingFormComponent<X>` (or `EditingFormInDialog<X>`), inject `dataSvc: XService`, define `form = this.fb.group({...})`. Patching existing records, dirty-state discard prompts, validity-gated submission, and success/error toasts all come for free.

---

## 8. Toast notifications

**Problem**: PrimeNG's `MessageService` is a normal injectable — you'd otherwise have to `inject(MessageService)` in every component that wants to show a toast, including deep inside decorators and non-component classes (guards, interceptors) where DI context isn't always convenient. The source platform's `Toast` is a static facade callable from anywhere; we reproduce that with a one-time DI "bridge".

```ts
// core/services/toast.service.ts
import { Injectable, inject } from '@angular/core';
import { MessageService } from 'primeng/api';

/** Provided once at root; its only job is to register the live MessageService instance. */
@Injectable({ providedIn: 'root' })
export class ToastBridgeService {
  private readonly messageService = inject(MessageService);
  constructor() {
    Toast.register(this.messageService);
  }
}

export class Toast {
  private static messageService: MessageService | null = null;

  static register(service: MessageService): void {
    Toast.messageService = service;
  }

  static success(detail: string, summary = 'Success'): void {
    Toast.show('success', summary, detail);
  }
  static info(detail: string, summary = 'Info'): void {
    Toast.show('info', summary, detail);
  }
  static warning(detail: string, summary = 'Warning'): void {
    Toast.show('warn', summary, detail);
  }
  static error(detail: string, summary = 'Error'): void {
    Toast.show('error', summary, detail);
  }
  static clear(): void {
    Toast.messageService?.clear();
  }

  private static show(severity: 'success' | 'info' | 'warn' | 'error', summary: string, detail: string): void {
    if (!Toast.messageService) {
      console.warn('[Toast] not registered yet — inject ToastBridgeService once in the app shell.');
      return;
    }
    Toast.messageService.add({ severity, summary, detail });
  }
}
```

**Wiring** (once, in the app shell component — the top-level component that's always alive):

```ts
// layout/components/shell/shell.component.ts
export class ShellComponent {
  private readonly toastBridge = inject(ToastBridgeService); // side-effecting: registers MessageService
}
```

```html
<!-- shell.component.html -->
<p-toast />
<router-outlet />
```

**Convention**: `Toast.error(Translations.instant(error.message))` — the backend's `error.message` is treated as a translation key and piped through `Translations.instant()`. If your backend doesn't already return translation keys for error messages, either change the backend contract to match this convention, or fall back to a generic key (`GENERIC.MESSAGES.ERROR.GENERIC`) rather than displaying raw backend strings untranslated.

**Toast translation key convention**: `GENERIC.MESSAGES.{INFO|WARNING|ERROR}.<KEY>` for shared copy, `<FEATURE>_LIST.MESSAGES.<KEY>` for feature-scoped copy. Confirm-dialog content keys conventionally end in `?` (e.g. `GENERIC.MESSAGES.WARNING.DELETE_ELEMENT?`).

---

## 9. Confirmation, form-validity and dirty-check decorators

These three method decorators exist so that "confirm before destroying", "validate before submitting", and "warn before discarding" are never hand-rolled per component — every delete button and every save button behaves identically without each component re-implementing the check.

**Important `this`-binding note**: all three decorators wrap the original method in a new function assigned back to `descriptor.value`. That wrapper is a real `function`, so when Angular/your template calls `instance.delete(item)`, `this` inside the wrapper correctly refers to the component instance. But **any option you pass into the decorator that itself needs `this`** (e.g. computing a dynamic confirm title from component state) must be written as a `function` expression, not an arrow function — arrow functions capture `this` lexically at decoration time (module load), which is not the component instance. See the `delete()` example in §6 for the correct pattern.

```ts
// shared/decorators/confirm.decorator.ts
import type { ConfirmationService } from 'primeng/api';

export interface ConfirmableOptions<A extends unknown[]> {
  title?: string | ((this: unknown, ...args: A) => string);
  content?: string | ((this: unknown, ...args: A) => string);
  acceptLabel?: string;
  rejectLabel?: string;
  severity?: 'danger' | 'warn' | 'info';
}

/** Requires the host class to expose `confirmationService: ConfirmationService` (via inject()). */
export function Confirmable<A extends unknown[]>(options: ConfirmableOptions<A>) {
  return function (_target: unknown, propertyKey: string, descriptor: PropertyDescriptor): PropertyDescriptor {
    const original = descriptor.value as (...args: A) => void;
    descriptor.value = function (this: { confirmationService: ConfirmationService }, ...args: A) {
      if (!this.confirmationService) {
        throw new Error(
          `@Confirmable on "${propertyKey}" requires the host class to inject ConfirmationService as 'confirmationService'.`,
        );
      }
      const header = typeof options.title === 'function' ? options.title.call(this, ...args) : options.title;
      const message = typeof options.content === 'function' ? options.content.call(this, ...args) : options.content;
      this.confirmationService.confirm({
        header,
        message,
        acceptLabel: options.acceptLabel,
        rejectLabel: options.rejectLabel,
        acceptButtonProps: { severity: options.severity === 'danger' ? 'danger' : 'primary' },
        accept: () => original.apply(this, args),
      });
    };
    return descriptor;
  };
}
```

```ts
// shared/decorators/async-check-form-validity.decorator.ts
import type { FormGroup } from '@angular/forms';
import type { MessageService } from 'primeng/api';
import { Translations } from '../../core/services/translations.service';
import { DEFAULT_ERROR_TRANSLATION, ERROR_TRANSLATIONS } from '../../core/constants/errors';

/**
 * Debounces briefly to let async validators (e.g. backend uniqueness checks) settle,
 * then either marks the form dirty/touched and toasts the first error, or calls
 * through to the real method. Wrap any save()/saveAndClose() with this instead of
 * hand-writing `if (form.invalid) { ... }` checks.
 */
export function AsyncCheckFormValidity(formKeyName: string, debounceMs = 150) {
  return function (_target: unknown, propertyKey: string, descriptor: PropertyDescriptor): PropertyDescriptor {
    const original = descriptor.value as (...args: unknown[]) => void;
    descriptor.value = function (this: Record<string, unknown> & { messageService: MessageService }, ...args: unknown[]) {
      const form = this[formKeyName] as FormGroup;
      setTimeout(() => {
        if (form.invalid) {
          form.markAllAsTouched();
          form.markAsDirty();
          const firstInvalidControlKey = Object.keys(form.controls).find((k) => form.controls[k].invalid);
          const firstErrorKey = firstInvalidControlKey
            ? Object.keys(form.controls[firstInvalidControlKey].errors ?? {})[0]
            : undefined;
          const translationKey = (firstErrorKey && ERROR_TRANSLATIONS[firstErrorKey]) || DEFAULT_ERROR_TRANSLATION;
          this.messageService.add({ severity: 'error', summary: Translations.instant(translationKey) });
          return;
        }
        original.apply(this, args);
      }, debounceMs);
    };
    return descriptor;
  };
}
```

```ts
// shared/decorators/check-form-dirt.decorator.ts
import type { FormGroup } from '@angular/forms';
import type { ConfirmationService } from 'primeng/api';
import { Translations } from '../../core/services/translations.service';

export interface CheckFormDirtOptions {
  formKeyName: string;
}

/** Guards a "close/dismiss" method: prompts only if the named form is dirty. */
export function CheckFormDirt(options: CheckFormDirtOptions) {
  return function (_target: unknown, propertyKey: string, descriptor: PropertyDescriptor): PropertyDescriptor {
    const original = descriptor.value as (...args: unknown[]) => void;
    descriptor.value = function (
      this: Record<string, unknown> & { confirmationService: ConfirmationService },
      ...args: unknown[]
    ) {
      const form = this[options.formKeyName] as FormGroup | undefined;
      if (!form || !form.dirty) {
        original.apply(this, args);
        return;
      }
      this.confirmationService.confirm({
        header: Translations.instant('GENERIC.MESSAGES.WARNING.UNSAVED_CHANGES?'),
        message: Translations.instant('GENERIC.MESSAGES.WARNING.DISCARD_CHANGES'),
        accept: () => original.apply(this, args),
      });
    };
    return descriptor;
  };
}
```

Check these three before writing manual `if (form.invalid) {...}` or inline `confirmationService.confirm(...)` logic anywhere near a form or a delete button.

---

## 10. Permission directives & guards

**Model**: a user has direct roles plus roles inherited from any group they belong to; a configured "admin role" (e.g. `ROLE_ADMIN`) bypasses all checks. Two structural directives expose this to templates so nobody hand-writes `*ngIf="authSvc.hasPermits([...])"`.

```ts
// core/auth/services/auth.service.ts (permission-relevant excerpt)
import { Injectable, signal } from '@angular/core';
import { environment } from '../../../../environments/environment';

export interface Role {
  name: string;
}
export interface Group {
  roles: Role[];
}
export interface User {
  roles: Role[];
  groups?: Group[];
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly user = signal<User | null>(null); // seeded from localStorage/session on app init

  private readonly adminRoleName = environment.auth.adminRoleName; // e.g. 'ROLE_ADMIN'

  /** ALL of `required` must be present (or the admin role, which bypasses everything). */
  hasPermits(required: string[]): boolean {
    const roles = this.currentRoleNames();
    return roles.includes(this.adminRoleName) || required.every((r) => roles.includes(r));
  }

  /** ANY of `required` must be present. */
  hasSomePermits(required: string[]): boolean {
    const roles = this.currentRoleNames();
    return roles.includes(this.adminRoleName) || required.some((r) => roles.includes(r));
  }

  private currentRoleNames(): string[] {
    const user = this.user();
    if (!user) return [];
    const direct = user.roles.map((r) => r.name);
    const inherited = (user.groups ?? []).flatMap((g) => g.roles.map((r) => r.name));
    return [...new Set([...direct, ...inherited])];
  }
}
```

```ts
// core/auth/directives/has-role.directive.ts
import { Directive, TemplateRef, ViewContainerRef, effect, inject, input } from '@angular/core';
import { AuthService } from '../services/auth.service';

/** *hasRole="'X_EDIT'"  or  *hasRole="['X_EDIT', 'X_ADMIN']" (ALL required) */
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
      this.render(this.authService.hasPermits(roles as string[]));
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
```

```ts
// core/auth/directives/has-any-role.directive.ts
import { Directive, TemplateRef, ViewContainerRef, effect, inject, input } from '@angular/core';
import { AuthService } from '../services/auth.service';

/** *hasAnyRole="['X_EDIT', 'X_ADMIN']"  — ANY of these grants access */
@Directive({ selector: '[hasAnyRole]', standalone: true })
export class HasAnyRoleDirective {
  private readonly templateRef = inject(TemplateRef<unknown>);
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly authService = inject(AuthService);

  readonly hasAnyRole = input.required<string[]>();

  private rendered = false;

  constructor() {
    effect(() => this.render(this.authService.hasSomePermits(this.hasAnyRole())));
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
```

**Route-level gating** (when the whole screen, not just a button, needs a permission):

```ts
// core/auth/guards/roles.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const rolesGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const roles = (route.data['roles'] as string[]) ?? [];
  if (roles.length === 0 || authService.hasPermits(roles)) return true;
  router.navigate(['/']);
  return false;
};
```

```ts
// usage in x-management.routes.ts
{
  path: '',
  loadComponent: () => import('./components/x-list/x-list.component').then(c => c.XListComponent),
  canActivate: [rolesGuard],
  data: { roles: ['X_READ'], breadcrumb: 'X_LIST.BREADCRUMBS.MAIN' },
}
```

Two-layer model to keep in mind if your app also has a plugin/extension system: whether a feature is *visible at all* (module/menu-level gating, checked once at load) is a different concern from whether a specific *navigation* is allowed right now (`canActivate`, checked per-route) — both are valid and usually both needed; don't conflate them into a single check.

---

## 11. Validators folder convention

Keep a `shared/validators/` folder with two subfolders, and **check it before writing a new validator** — most "identifier-like field" cases are already covered:

```
shared/validators/
├── common/
│   ├── at-least-one.validator.ts       # at least one of several fields must be filled
│   ├── conditional.validator.ts        # conditionalValidator(conditionFn, errorFn)
│   ├── equal.validator.ts              # cross-field match, e.g. password confirmation
│   └── json.validator.ts
└── strings/
    ├── alphabetic.validator.ts
    ├── database-name.validator.ts
    ├── fqdn.validator.ts
    └── url.validator.ts
```

Example — the async backend-uniqueness validator, built on `CollectionService.exists()` (§5):

```ts
// core/validators/async-function.validator.ts
import { AbstractControl, AsyncValidatorFn } from '@angular/forms';
import { Observable, debounceTime, map, of, switchMap } from 'rxjs';

export function asyncFunctionValidator(
  fn: (value: unknown) => Observable<boolean>,
  errorKey: string,
  debounceMs = 300,
): AsyncValidatorFn {
  return (control: AbstractControl) => {
    if (!control.value) return of(null);
    return of(control.value).pipe(
      debounceTime(debounceMs),
      switchMap((value) => fn(value)),
      map((exists) => (exists ? { [errorKey]: true } : null)),
    );
  };
}
```

```ts
// usage
name: [
  '',
  [Validators.required],
  [asyncFunctionValidator((value) => this.dataSvc.exists({ name: value }), 'uniqueName')],
],
```

Register `uniqueName` in the error-translation map (see `ERROR_TRANSLATIONS`, §9, and the i18n guide) rather than hand-writing per-field error text.

---

## 12. Routing conventions

**Resolvers** — one consistent idiom for every "add vs edit" route:

```ts
// x-management/resolvers/x.resolver.ts
import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { catchError, of } from 'rxjs';
import { X } from '../interfaces/x';
import { XService } from '../services/x.service';

export const xResolver: ResolveFn<X | null> = (route) => {
  const service = inject(XService);
  const id = route.paramMap.get('id');
  return id === 'add' ? of(null) : service.find(id!).pipe(catchError(() => of(null)));
};
```

**Breadcrumbs** — `route.data.breadcrumb` is either a plain translation-key string, or a function of resolved data:

```ts
// x-management/x-management.routes.ts
import { Routes } from '@angular/router';
import { rolesGuard } from '../core/auth/guards/roles.guard';
import { canDeactivateFormFn } from '../core/guards/form.guard';
import { xResolver } from './resolvers/x.resolver';

export const xManagementRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/x-list/x-list.component').then((c) => c.XListComponent),
    canActivate: [rolesGuard],
    data: { roles: ['X_READ'], breadcrumb: 'X_LIST.BREADCRUMBS.MAIN' },
  },
  {
    path: ':id',
    loadComponent: () => import('./components/x-edition/x-edition.component').then((c) => c.XEditionComponent),
    resolve: { value: xResolver },
    canActivate: [rolesGuard],
    canDeactivate: [canDeactivateFormFn],
    data: {
      roles: ['X_READ'],
      breadcrumb: (data: { value: { name?: string } | null }) => data.value?.name ?? 'GENERIC.TITLES.NEW',
    },
  },
];
```

**Dirty-form navigation guard** (distinct from `@CheckFormDirt`, which guards a *dismiss button*; this guards *any* router navigation away from the route):

```ts
// core/guards/form.guard.ts
import { inject } from '@angular/core';
import { CanDeactivateFn } from '@angular/router';
import { ConfirmationService } from 'primeng/api';
import { FormGroup } from '@angular/forms';
import { Observable } from 'rxjs';
import { Translations } from '../services/translations.service';

export interface DirtyFormHost {
  form: FormGroup;
}

export const canDeactivateFormFn: CanDeactivateFn<DirtyFormHost> = (component) => {
  if (!component.form?.dirty) return true;
  const confirmationService = inject(ConfirmationService);
  return new Observable<boolean>((subscriber) => {
    confirmationService.confirm({
      header: Translations.instant('GENERIC.MESSAGES.WARNING.UNSAVED_CHANGES?'),
      message: Translations.instant('GENERIC.MESSAGES.WARNING.DISCARD_CHANGES'),
      accept: () => {
        subscriber.next(true);
        subscriber.complete();
      },
      reject: () => {
        subscriber.next(false);
        subscriber.complete();
      },
    });
  });
};
```

Wire the feature's routes file into the parent (`app.routes.ts` or a parent feature's route file) via `children:`.

---

## 13. Step-by-step recipe for a new feature

1. Create the feature folder under `src/app/` following §3.
2. Define the domain interface(s) in `interfaces/`.
3. Create the service extending `CollectionService<X>`; set `path`, override `defaultListOrdination` if needed.
4. Create the resolver using the `id === 'add' ? of(null) : service.find(id)` idiom.
5. Create the route file with list/add/`:id` routes, `resolve`, `data.breadcrumb`, and `canActivate: [rolesGuard]` with `data.roles`.
6. Build the list page: `class XListComponent extends PaginatedTableComponent<X>`, define `headers`, copy the `.list-page__*` template skeleton.
7. Build the edit form: `class XEditionComponent extends EditingFormComponent<X>` (or the dialog variant), define `form = this.fb.group({...})` using PrimeNG controls and validators from `shared/validators/`.
8. Add translations: `<FEATURE>.TITLES/LABELS/BUTTONS/MESSAGES...` keys (see the i18n guide).
9. Gate visibility/actions with `*hasRole`/`*hasAnyRole`; gate the whole route with `canActivate: [rolesGuard]` + `data.roles` if needed.
10. Wire destructive actions and submission with `@Confirmable(...)`, `@AsyncCheckFormValidity(...)`, `@CheckFormDirt(...)` as applicable.
11. Wire the feature's routes file into the parent via `children:`.

---

## 14. Full worked example: `product-management`

```
product-management/
├── components/
│   ├── product-list/
│   │   ├── product-list.component.ts
│   │   └── product-list.component.html
│   └── product-edition/
│       ├── product-edition.component.ts
│       └── product-edition.component.html
├── services/
│   └── product.service.ts
├── resolvers/
│   └── product.resolver.ts
├── interfaces/
│   └── product.ts
└── product-management.routes.ts
```

```ts
// interfaces/product.ts
export interface Product {
  id?: string;
  name: string;
  sku: string;
  status: 'ACTIVE' | 'INACTIVE';
}
```

```ts
// services/product.service.ts
@Injectable({ providedIn: 'root' })
export class ProductService extends CollectionService<Product> {
  protected override path = 'products';
  protected override defaultListOrdination = { sortField: 'name', sort: 'asc' as const };
}
```

```ts
// resolvers/product.resolver.ts
export const productResolver: ResolveFn<Product | null> = (route) => {
  const service = inject(ProductService);
  const id = route.paramMap.get('id');
  return id === 'add' ? of(null) : service.find(id!).pipe(catchError(() => of(null)));
};
```

```ts
// components/product-list/product-list.component.ts
@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [TableModule, ButtonModule, InputTextModule, IconFieldModule, InputIconModule, TranslocoPipe, HasRoleDirective],
  templateUrl: './product-list.component.html',
})
export class ProductListComponent extends PaginatedTableComponent<Product> {
  readonly dataSvc = inject(ProductService);
  readonly headers: TableHeader[] = [
    { field: 'name', header: 'PRODUCT_LIST.LABELS.NAME', sortable: true },
    { field: 'sku', header: 'PRODUCT_LIST.LABELS.SKU', sortable: true },
    { field: 'status', header: 'PRODUCT_LIST.LABELS.STATUS', sortable: true },
  ];
  override searchKeys = ['name', 'sku'];
}
```

```ts
// components/product-edition/product-edition.component.ts
@Component({
  selector: 'app-product-edition',
  standalone: true,
  imports: [ReactiveFormsModule, InputTextModule, SelectModule, ButtonModule, TranslocoPipe, FieldErrorComponent],
  templateUrl: './product-edition.component.html',
})
export class ProductEditionComponent extends EditingFormComponent<Product> {
  readonly dataSvc = inject(ProductService);

  readonly form = this.fb.group({
    id: [null as string | null],
    name: ['', [Validators.required], [asyncFunctionValidator((v) => this.dataSvc.exists({ name: v }), 'uniqueName')]],
    sku: ['', [Validators.required, databaseNameValidator()]],
    status: ['ACTIVE' as Product['status'], Validators.required],
  });
}
```

```html
<!-- components/product-edition/product-edition.component.html -->
<form [formGroup]="form" class="edit-page">
  <div class="p-field">
    <label for="name">{{ 'PRODUCT_LIST.LABELS.NAME' | transloco }}</label>
    <input pInputText id="name" formControlName="name" />
    <app-field-error [control]="form.controls.name" />
  </div>

  <div class="p-field">
    <label for="sku">{{ 'PRODUCT_LIST.LABELS.SKU' | transloco }}</label>
    <input pInputText id="sku" formControlName="sku" />
    <app-field-error [control]="form.controls.sku" />
  </div>

  <div class="edit-page__actions">
    <button pButton type="button" [label]="'GENERIC.BUTTONS.CANCEL' | transloco" text (click)="cancelEdit()"></button>
    <button pButton type="button" [label]="'GENERIC.BUTTONS.SAVE' | transloco" (click)="save()"></button>
  </div>
</form>
```

```ts
// product-management.routes.ts
export const productManagementRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/product-list/product-list.component').then((c) => c.ProductListComponent),
    canActivate: [rolesGuard],
    data: { roles: ['PRODUCT_READ'], breadcrumb: 'PRODUCT_LIST.BREADCRUMBS.MAIN' },
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./components/product-edition/product-edition.component').then((c) => c.ProductEditionComponent),
    resolve: { value: productResolver },
    canActivate: [rolesGuard],
    canDeactivate: [canDeactivateFormFn],
    data: {
      roles: ['PRODUCT_READ'],
      breadcrumb: (data: { value: Product | null }) => data.value?.name ?? 'GENERIC.TITLES.NEW',
    },
  },
];
```

Wired into `app.routes.ts`:

```ts
{
  path: 'products',
  children: productManagementRoutes,
}
```

---

## 15. `app.config.ts` wiring

```ts
import { ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeng/themes/aura';
import { MessageService, ConfirmationService } from 'primeng/api';
import { provideTransloco } from '@jsverse/transloco';
import { routes } from './app.routes';
import { jwtInterceptor } from './core/interceptors/jwt.interceptor';
import { acceptLanguageInterceptor } from './core/interceptors/accept-language.interceptor';
import { TranslocoHttpLoader } from './transloco-loader.service';
import { environment } from '../environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withInterceptors([jwtInterceptor, acceptLanguageInterceptor])),
    provideAnimationsAsync(),
    providePrimeNG({ theme: { preset: Aura, options: { darkModeSelector: '.dark' } } }),
    MessageService,
    ConfirmationService,
    provideTransloco({
      config: {
        availableLangs: ['en', 'es'],
        defaultLang: 'en',
        reRenderOnLangChange: true,
        prodMode: environment.production,
      },
      loader: TranslocoHttpLoader,
    }),
  ],
};
```

See the i18n guide for `TranslocoHttpLoader` and everything translation-related.
