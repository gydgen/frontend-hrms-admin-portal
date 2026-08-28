# Angular Codebase Architecture Guide — Appolow Platform Front

This document is a from-the-code architecture review and onboarding reference for `appolow-platform-front`. Every claim below is derived from reading the actual repository (source, config, and the `documentation/` submodule) — not from generic Angular conventions. Where something could not be confirmed, that is stated explicitly. File paths are repo-relative.

> **What this application is.** Appolow is a **low-code platform**. This repo is not a typical CRUD admin app — it is a designer application that lets users compose pages out of **widgets** (configurable visual/functional units), organize them via **slots**, extend them with **plugins**, and group everything into **modules**. A separate pipeline (Schematics → Blueprint, outside this repo) turns the persisted configuration into a generated, runnable application. Roughly a third of this codebase (`src/modules/`, `src/widgets/`, `src/plugins/`) is itself the *content* of that low-code system — extension points, not just app features. Keep this mental model in mind: many "unusual" patterns below (dynamic router composition, decorator-driven registries, a single global designer store) exist to support that extensibility model.

---

## Table of contents

1. [Architecture overview](#1-architecture-overview)
2. [The extensibility system: modules, widgets, plugins](#2-the-extensibility-system-modules-widgets-plugins)
3. [Feature architecture & conventions](#3-feature-architecture--conventions)
4. [Component design patterns](#4-component-design-patterns)
5. [State management](#5-state-management)
6. [API & backend communication](#6-api--backend-communication)
7. [Authentication & authorization](#7-authentication--authorization)
8. [Routing architecture](#8-routing-architecture)
9. [Forms](#9-forms)
10. [UI, design system & styling](#10-ui-design-system--styling)
11. [Icons & assets](#11-icons--assets)
12. [Translation / i18n](#12-translation--i18n)
13. [Tables & list pages](#13-tables--list-pages)
14. [Error handling, loading & notifications](#14-error-handling-loading--notifications)
15. [Services & dependency injection](#15-services--dependency-injection)
16. [TypeScript & naming conventions](#16-typescript--naming-conventions)
17. [RxJS & Signals](#17-rxjs--signals)
18. [Directives, pipes & decorators](#18-directives-pipes--decorators)
19. [Testing architecture](#19-testing-architecture)
20. [Performance patterns](#20-performance-patterns)
21. [Security & accessibility](#21-security--accessibility)
22. [Patterns worth learning from this codebase](#22-patterns-worth-learning-from-this-codebase)
23. [Existing solutions you should reuse](#23-existing-solutions-you-should-reuse)
24. [How to implement a new feature in this application](#24-how-to-implement-a-new-feature-in-this-application)
25. [Architectural observations](#25-architectural-observations)
26. [Important files to study](#26-important-files-to-study)
27. [Final developer cheat sheet](#27-final-developer-cheat-sheet)

---

## 1. Architecture overview

**Stack** (`package.json`): Angular **21.2** (`@angular/core` `^21.2.4`), standalone-first (no `NgModule`-based bootstrap), `@ngrx/store` + `@ngrx/effects` + `@ngrx/signals` **together**, `@jsverse/transloco` for i18n, Bootstrap 5 + a proprietary `@appolow/*` component library, `ngx-toastr`, `ngx-echarts`, `ngx-quill`, `dayjs`, Vitest for unit tests (via `@angular/build:unit-test`).

**Bootstrap** (`src/app/app.config.ts`): a single `ApplicationConfig` object — no `AppModule`. Notable providers, in the order they matter:

- `provideRouter(routes, withComponentInputBinding(), withHashLocation())` — **hash-based routing** (`withHashLocation()`), and route params are bound directly to component inputs.
- `provideTransloco(...)` with `TranslocoHttpLoader`, `availableLangs: ['en','es']`.
- `provideAppInitializer(...)` (two of them): the first authenticates the user and then calls `ExtensibilityService.initialize([...user.allowedModules])` — **the entire module/widget/plugin system boots from an app initializer gated on the logged-in user's permissions**, before the router or most UI exists. The second wires up `Toast`/`InjectionService` eagerly.
- `provideHttpClient(withInterceptorsFromDi())` + three `HTTP_INTERCEPTORS` (`JWTInterceptor`, `AcceptLanguageInterceptor`, `NavigationLoadingInterceptor`) registered the classic DI way, not via `withInterceptors([...])` — the functional-interceptor API is available but unused (there's a commented-out line showing it was considered).
- `importProvidersFrom(...)` bridges in every module-based library the app still depends on: `SortableModule.forRoot()`, `StoreModule.forRoot(appState, rootStoreConfig)`, `EffectsModule.forRoot([AppEffects])`, `StoreDevtoolsModule.instrument(...)`, `AppolowLibraryModule.forRoot(...)`, `TableModule.forRoot()`, `AppolowModalModule`, `ToastrModule.forRoot(...)`, `QuillModule.forRoot(...)`, `TimeagoModule.forRoot(...)`.

**Environment configuration** (`src/environments/`): `environment.ts` (dev), `environment.prod.ts`, `environment.pre.ts`, swapped via `angular.json` `fileReplacements` per build configuration (`production`/`preproduction`/`development`). Shape: `{ name, production, baseURLV2, chartServerURL, version, auth: { adminRoleName } }`. `baseURLV2` is the single backend base URL every service builds requests from.

**Path aliases** (`tsconfig.json`): `@testing/*`, `@utils/*`, `@definitions/*`, `@validators/strings`, `@core/*` → `src/app/core/*`, `@shared/*` → `src/app/shared/*`, `@store/*`, `@widgets/*` → `src/widgets/*`, `@plugins/*` → `src/plugins/*`, `@modules/*` → `src/modules/*`, `@widgets-framework/*` → `src/app/builder/widgets/*`. **Always use these aliases**, not deep relative paths, when importing across these boundaries — the whole codebase does.

**Monorepo-like structure via git submodules.** This is not a classic single-repo app. `git status` and `documentation/shared/system-map.md` show several embedded submodules:

| Path | What it is |
| --- | --- |
| `src/definitions/` | Shared TypeScript contracts (`WidgetConfig`, `Slot`, `Page`, `JsonSchema`, field/data-source types) shared with Schematics/Blueprint |
| `src/utils/` | Shared utility functions submodule |
| `src/modules/elliot/` | A large, real functional module shipped as its own submodule (proof that the module system works for real domains, not just toys) |
| `documentation/` | The technical documentation hub (everything under `documentation/` in this repo) |

Sibling repositories (not in this checkout, referenced by the docs): `appolow-schematics` (code generator) and `appolow-blueprint-front` (the generated target app). `appolow-library` is yet another sibling repo that publishes the `@appolow/*` npm packages consumed here.

### Simplified tree

```text
src/
├── app/
│   ├── core/                 # cross-cutting infra: auth, extensibility services, base classes, guards, interceptors
│   ├── shared/                # shared components, stores (DesignerStateStore), tokens, validators, decorators, pipes
│   ├── store/                 # classic NgRx root store (App + Databases slices only)
│   ├── layout/                 # app shell (wrapper, side menu, breadcrumbs)
│   ├── apps/, user-management/, role-management/, group-management/,
│   │   data-management/, page-management/, widget-management/,
│   │   theme-management/, marketplace/, config/, deployments-history/,
│   │   bpmn-management/, sections-management/, cluster-management/,
│   │   connections/, document-manager/, deploy-app/                # feature areas ("apps" in Angular parlance)
│   ├── builder/widgets/        # widget-authoring framework (base edition/preview components)
│   ├── error/                  # error route
│   ├── app.config.ts, app.routes.ts
├── definitions/                # shared submodule: app-structure & data-source contracts
├── modules/                    # low-code EXTENSION modules (core, elliot, example, notices, projects)
├── widgets/                    # low-code CORE widgets (table, board, calendar, form, chart, ...)
├── plugins/                    # low-code plugins (dataSource, links, mapping, preset-filters, ...)
├── utils/                      # shared submodule: cross-cutting utils
├── environments/
├── assets/
└── styles/                     # SCSS tokens & partials, imported from styles.scss
```

**Architectural philosophy.** Two philosophies coexist deliberately:

1. **A conventional layered admin app** for platform management (users, roles, groups, apps, databases, deployments, themes) — standalone components, feature routes, `CollectionService`-based CRUD services, reusable list/edit patterns.
2. **A plugin/registry-driven extensibility runtime** for the actual low-code design surface (page designer, widget designer) — decorator-declared descriptors (`@ModuleService`, `@WidgetService`, `@PluginService`), lazy `import()`-based registries (`WIDGET_REGISTRY`, `PLUGIN_REGISTRY`), a single centralized `DesignerStateStore`, and a router that is **rebuilt at runtime** (`Router.resetConfig()`) once the user's permitted modules are known.

Both share the same core/shared infrastructure (auth, i18n, design tokens, forms library), which is what keeps the app coherent despite the two philosophies.

---

## 2. The extensibility system: modules, widgets, plugins

This is the single most distinctive architectural decision in the codebase and it deserves its own section rather than being folded into "features." Full detail lives in `documentation/architecture/modules-widgets-plugins.md`, `documentation/extension-generation/*`, and `documentation/architecture/page-designer.md` — read those before touching a designer. Summary:

**Three extension kinds, one loading story:**

| Piece | Registered by | Lives in | Loaded |
| --- | --- | --- | --- |
| **Module** | `@ModuleService({...})` decorator on a class extending `BaseModuleService` | `src/modules/{name}/{name}-module.service.ts` | Lazily, gated by `readPermission` against the logged-in user's `allowedModules` |
| **Widget** | `@WidgetService({...})` decorator on a class extending `BaseWidgetService` | `src/modules/{m}/widgets/{w}/` or `src/widgets/{w}/` (core) | Lazily, only when its module activates / it's dragged onto the canvas |
| **Plugin** | `@PluginService({...})` on a class extending `BasePluginService` | `src/plugins/{p}/` or `src/modules/{m}/plugins/{p}/` | Lazily, resolved per-widget via `getPluginsForWidget()` |

**Services that orchestrate this** (`src/app/core/services/`): `ExtensibilityService` (facade, entry point), `ModuleLoaderService` (discovers modules, filters by permission, splices routes into the live router via `Router.resetConfig()`), `WidgetLoaderService`, `PluginLoaderService`, `HookRunnerService` (runs `beforeSave`/`afterSave`/migration hooks in a fixed order: widget hook → plugin hooks → persist), `TranslationLoaderService`, `WidgetRegistryService`.

**The one rule that matters most for this system**: *all* structural mutation to a page/widget/plugin configuration must go through the store — never through local component state, `valueChanges` callbacks proxied by a parent, or ad-hoc events. `AGENTS.md` states this as a **critical project rule**:

> Any page designer, widget designer, widget, slot, or plugin edition persistence must go through `DesignerStateStore`. The component that edits a value is responsible for persisting it. Parent components must not proxy child structural persistence through callbacks.

See [§5](#5-state-management) for the store itself.

**Data model** (`documentation/architecture/page-designer.md`, source of truth `src/definitions/app-structure/slot.ts` / `page.ts`): a `Page` is a tree of `Slot`s. A slot's `format` is `GENERIC` (holds `slotWidgets[]`, i.e. actual widgets), `TABS` (holds `TAB` children only), or `TAB` (holds exactly one nested `GENERIC` or `TABS`). Widgets only ever live inside `GENERIC` slots. This is enforced structurally, not just by convention — see the composition-rule table in that doc if you're building anything that manipulates the tree.

**Widget anatomy**: a widget has up to three components — an optional **init wizard** (captures required setup, e.g. choosing a datasource, before the widget can be created), an **edition** component (the properties panel, typically extending `DesignerStoreEditingComponent<T>`), and a **preview** component (extends `BaseWidgetPreviewComponent<T>`, reactive to `formValueChanges()`). Its configuration is typed via `WidgetConfig<T>`, where `T` is a per-widget `definition` interface — simple widgets define an ad hoc interface, widgets bound to data extend `DataSourceJsonSchema` (`src/definitions/json-schema/data-source-json-schema.ts`).

**When building a *business feature* rather than an extension**, you generally do **not** need this system — it's for adding new widget/plugin/module *types* to the designer palette. Ordinary CRUD screens (user management, role management, etc.) follow the conventional pattern in [§3](#3-feature-architecture--conventions) instead.

---

## 3. Feature architecture & conventions

Feature ("app") folders under `src/app/` (e.g. `user-management/`, `role-management/`, `data-management/`) follow a consistent, if not 100%-rigid, internal shape:

```text
feature/
├── components/           # list, edit, detail components
│   └── x-list/, x-edition/
├── services/              # x.service.ts, usually extends CollectionService<T> or AppCollectionService<T>
├── resolvers/              # x.resolver.ts — functional ResolveFn, fetch-or-null-for-'add' idiom
├── guards/                 # feature-specific guards (rare — most guards live in core/)
├── interfaces/              # domain types
├── x.routes.ts              # exported `routes: Routes`, composed into a parent route file
```

Larger feature areas (`apps/`, `data-management/`) nest sub-domains this way recursively (e.g. `data-management/apis/`, `data-management/databases/` each with their own `components/services/resolvers`).

**Convention to reuse for a new admin feature**: one `x.routes.ts`, a list component extending `PaginatedTableComponent<T>` ([§13](#13-tables--list-pages)), an edit component extending `EditingFormComponent<T>` / `EditingFormInModal<T>` ([§9](#9-forms)), a service extending `CollectionService<T>` or `AppCollectionService<T>` ([§6](#6-api--backend-communication)), and a resolver following the "`id === 'add'` → `of(null)`, else `service.find(id)`" idiom. This combination is what most of `user-management`, `role-management`, `group-management`, `theme-management`, and the `data-management` sub-features look like — it is the strongest, most reused convention in the whole app.

---

## 4. Component design patterns

Evidence (grep counts across the whole codebase, ~365 `@Component` usages / 324 component files):

| Pattern | Adoption | Verdict |
| --- | --- | --- |
| Standalone components | 128 files explicit `standalone: true`, only 3 explicit `standalone: false`, 7 `@NgModule`s total | **Overwhelming default.** NgModules are vestigial, kept only for a few library `.forRoot()` bridges and one legacy routing module (`ConfigRoutingModule` in `config.routes.ts`). |
| `inject()` vs constructor DI | 542 files use `inject()`, 82 use constructor params | **`inject()` is the house style.** Constructor use is mostly `constructor() { super(); ... }` for lifecycle wiring, not for DI. |
| `ChangeDetectionStrategy.OnPush` | Only 5 files | **Not a convention.** The app relies on signals + Angular's default zone-based CD rather than explicit `OnPush`. Don't assume it's set. |
| `input()` / `output()` / `model()` | 113 / 45 / 32 files | Standard for new code. |
| `computed()` / `effect()` / `resource()` | 105 / 68 / 55 files | Heavily used, including `resource()` for data fetching tied to signal inputs (e.g. `role-edition.component.ts:136`). |
| `linkedSignal()` | 1 occurrence total | Essentially unused — don't reach for it by habit. |
| `@Input()`/`@Output()` decorators, `@ViewChild` | 22 / 1 / 3 files | Legacy remnants from pre-signal code; new code uses signal-based `input()`/`output()`/`viewChild()`. |
| `host: {}` metadata vs `@HostListener` | 126 vs 9 files | `host: {}` object metadata is preferred over the decorator. |
| `<ng-content>` / `ContentChild` | 3 files / 0 files | Composition favors `@Input`/portal/store wiring over content projection — don't reach for content projection as the default extensibility mechanism here. |

**Most modern reference**: `src/app/shared/components/designer-property-edition/designer-property-edition.component.ts` — pure `inject()`, layered `computed()` chains, `effect()` for form↔store sync, no constructor, extends a generic base (`DesignerStoreEditingComponent<T>`).

**Representative transitional/legacy reference**: `src/app/role-management/components/role-edition/role-edition.component.ts` — mixes modern `resource()`/`effect()` with imperative `FormGroup.patchValue` and manual `ChangeDetectorRef.detectChanges()` calls. This is a good example of "recent code retrofitted onto an older base class," not code to copy uncritically.

**Templates**: new control-flow syntax has essentially fully replaced the old structural directives — `@if` 967 vs `*ngIf` 3, `@for` 199 vs `*ngFor` 2, `@switch` 48 vs `*ngSwitch` 5. **Every** remaining `*ngIf`/`*ngFor`/`*ngSwitch` usage is confined to `src/modules/elliot/` (an older, vendored submodule) — treat any `*ngIf`/`*ngFor` you encounter as a signal you're in legacy/third-party code, not a pattern to replicate. Every single `@for` block (199/199) declares a `track` expression — no exceptions. `@defer` exists but is barely used (2 occurrences, both `@defer (when form) { ... }` gating widget edition panels on form readiness — not used for route-level or list-level lazy rendering).

**Selectors are not consistently prefixed** — `app-` and `apw-` are both used within the same folder (e.g. `src/app/apps/components/`). Don't infer a rule from the prefix; check the actual selector.

**Private fields**: native `#private` fields are preferred over the TS `private` keyword in newer code (`#authSvc`, `#portal = inject(...)`), though both exist.

---

## 5. State management

State management here is genuinely three-tier, and each tier has a distinct, non-overlapping job. Do not reach for the wrong tier.

### 5.1 Classic NgRx Store — narrow, deliberately small

Root reducer map (`src/app/store/app.state.ts`) combines exactly **two** slices:

```ts
export const appState: ActionReducerMap<any> = { app: appReducer, databases: databasesReducer };
```

- `app` (`src/app/store/reducers/app.reducer.ts`): the currently-loaded `App` (the low-code application being designed), `{ app, loaded, error }`.
- `databases` (`src/app/store/reducers/databases.reducer.ts`): a large derived-selector surface (~25 selectors) over the entity/database/relationship graph for the currently loaded app.

A `clearState` action + `clearStore` meta-reducer (`src/app/store/reducers/environment.reducer.ts`, wired as a `MetaReducer` in `app.config.ts`) resets the entire store on logout. `AppEffects` (`src/app/store/effects/app.effects.ts`) is the one effects class registered, handling `loadDatabases$` (debounced, diffed via `distinctUntilChanged`) and `loadAppFailure$` (toast + redirect on error).

**Conclusion**: classic NgRx is used for exactly one concern — "what app/databases are currently loaded" — not as a general state-management layer. Do not add new feature domains to this store; it was intentionally kept small.

### 5.2 `@ngrx/signals` SignalStore — one store, and it's the important one

Only **one** `signalStore(...)` exists in the codebase: `DesignerStateStore` (`src/app/shared/stores/designer-state.store.ts`, `providedIn: 'root'`, injected everywhere via the `DESIGNER_STATE_STORE` token — never inject the class directly, per `documentation/extension-generation/annexes/stores-reference.md`). It unifies **both** Page Designer and Widget Designer editing (`mode: 'page' | 'widget'`) in a single global-singleton store, not a route-scoped one.

- **State**: `mode`, `page`, `widget`, `form: FormGroup`, `descriptor`, `slots`, `activeWidgetUUID`, `activeSlotUUID`, `isDirty`, `isSaving`, `designMode`, `currentViewport`, `isPreviewMode`, `isDragging`, `previewTheme`, `validationErrors`.
- **Computed**: `allWidgets`, `activeWidget`, `activeSlot`, `widgetSlots`, `definition`, `plugins`, `canSave` (`form.valid && isDirty()`).
- **Methods**: a large surface (`initializePage`, `initializeWidget`, `save`, slot-tree CRUD, tab operations, widget mutation, UI-state setters) — all mutate via `patchState(store, {...})`.
- Notably **no `rxMethod`/`withEffects`** — form↔store sync uses a plain RxJS `Subscription` on `form.valueChanges`, not the `@ngrx/signals/rxjs-interop` helpers. If you extend this store, matching its existing style (plain subscriptions, not `rxMethod`) is more consistent than introducing a new pattern.

Consuming components (`PageDesignerComponent`, `WidgetDesignerComponent`, `SlotRendererComponent`, and ~27 others) inject the token once and re-expose the signals they need directly as component fields (`slots = this.#store.slots;`), then call methods directly (`this.#store.save()`). **The rule from the store's own docs**: the component that edits a value calls the store directly — never proxy a child's structural change through a parent callback.

### 5.3 Component-local state — mixed, no single rule

Three coexisting idioms, pick based on what surrounds the code you're touching:

- Plain `signal()`/`computed()` for simple local UI state (e.g. `ExtensibilityService`'s private `#initialized`/`#initializing` signals; `PaginatedTableComponent`'s `reloadInterval`/`filters`).
- RxJS `BehaviorSubject` + `combineLatest` for reactive local UI composition (`IconSelectorComponent`).
- A global singleton with a plain counter + `ReplaySubject` for cross-cutting concerns like the HTTP loading spinner (`LoadingService`) — an older RxJS-era pattern that predates signals and hasn't been migrated, presumably because it needs to be a true cross-request singleton.

### 5.4 Loading/error state — no single convention

You will see at least four different shapes for "is this loading / did this fail" in the wild: SignalStore booleans (`isSaving`/`isDirty` on `DesignerStateStore`), a standalone `signal<EnumState>` living *next to* (not inside) an NgRx reducer (`DatabaseLoadingState` in `databases.reducer.ts` — a hybrid pattern worth noting as unusual), a global `LoadingService` for HTTP-wide spinners, and a plain `error` field on the classic `AppState`. When adding new loading state, match whichever of these your immediate neighborhood already uses rather than inventing a fifth.

---

## 6. API & backend communication

**Layering**: `Component → Feature Service (extends CollectionService<T>) → HttpClient → environment.baseURLV2`. There is no separate "data service" layer between feature service and `HttpClient` — the feature service *is* the API layer.

### 6.1 Base classes

- **`CollectionService<T>`** (`src/app/core/services/collection.service.ts`) — the generic CRUD base. Subclasses declare `protected abstract path: string`. Provides:
  - `list(request)` — thin wrapper over `paginate()` with `perPage: 9999`.
  - `paginate(request)` — builds `HttpParams` (`size`, `page` 0-indexed, `sort`, `sortField`) and a JSON body (`sortField`, `sort`, `where: filters`, optional `generalSearch: {value, fields}`), `POST`s to `${baseURLV2}/${path}/search`, maps backend `PaginatedResponse` (`content/page/totalPages/totalElements/size`) to app-side `PaginatedData` (`data/currentPage/lastPage/total/perPage`). Swallows errors into an empty page rather than propagating (`catchError` returns empty `PaginatedData`) — **be aware of this when debugging "silent" empty tables**.
  - `find(id)` — `GET /${path}/${id}`.
  - `save(item)` — `POST` if no `id`, `PUT /${path}/${id}` if present (method chosen dynamically via `this.http[method]`).
  - `delete(id)` — `DELETE /${path}/${id}`.
  - `updateOrCreate(value)` — same POST/PUT branching, also accepts `FormData` (file uploads).
  - `exists(filters)` — `list({filters, perPage: 1})`, checks length — the standard way async uniqueness validators check the backend.
  - A `@Cacheable(...)` decorator (from the `ts-cacheable` dependency) is present above `paginate()` **but commented out**, alongside a dead `cacheBuster$` Subject. **Caching is not actually active anywhere in the codebase** — don't assume responses are cached.
- **`AppCollectionService<T>`** (`src/app/core/services/app-collection.service.ts`) extends `CollectionService<T>` and app-scopes every request: subclasses declare `resourcePath` instead of `path`, and the real `path` getter prepends `applications/{currentApp().id}/`, throwing if no app is currently selected in the store. Supports an explicit `applicationId` override for call sites outside the normal app context.

### 6.2 Representative subclasses

- `EntitiesService extends CollectionService<Entity>` — mostly a thin subclass, with one interesting composition example (`entitiesOfSchemas()` combines two services' `.list()` via `combineLatest` + `switchMap`).
- `UserService extends CollectionService<User>` — trivial subclass overriding only `path` and default ordination.
- `RolesService extends AppCollectionService<NavigationPermissions>` — overrides `find()`/`paginate()` for a custom sub-route; some duplicated logic against the base class rather than composing it (worth normalizing if you touch this file).

### 6.3 File upload / download

Uploads use raw `FormData` bodies posted directly (browser sets the multipart boundary) — see `DatabasesService.loadCsvFiles()`, `ApisService.loadFromFile()`. **No client-side file-type/size validation** was found around these call sites. **No download/blob pattern** (`responseType: 'blob'`) exists anywhere in `src/app` — if you need file download, there's no existing convention to copy; you'll be establishing one.

### 6.4 Interceptors (`src/app/core/auth/interceptors/`, all DI-based, registered in `app.config.ts`)

| Interceptor | Responsibility |
| --- | --- |
| `JWTInterceptor` | Skips auth for `i18n`/`GetCapabilities`/`GetFeatureInfo`/login URLs. Adds `Authorization: Bearer <token>` from `localStorage`. On `401`, coordinates a **single in-flight refresh** across concurrent requests via an `#isRefreshing` flag + `BehaviorSubject<string>` queue — other 401'd requests wait on the subject and retry with the new token once available. Forces logout if refresh itself fails. |
| `AcceptLanguageInterceptor` | Adds `Accept-Language` from `navigator.language`, skipping `i18n` requests. |
| `NavigationLoadingInterceptor` | Drives the global loading spinner from both router navigation events and HTTP request lifecycles (`finalize()`); tracks per-request timestamps and force-hides + warns on a 30s **client-side timeout monitor** (not a real cancelling timeout). |

**Not present, confirmed by direct search**: RxJS `retry()`/`shareReplay()` resiliency operators on HTTP calls, `AbortController`-based cancellation, active response caching, CSRF/XSRF token handling (no `HttpClientXsrfModule`, bearer-token auth is used instead of cookie sessions).

---

## 7. Authentication & authorization

```text
Login (LoginComponent)
  ↓ AuthService.login() → POST /auth/login
Token storage (localStorage: token, expiresAt, refreshToken, refreshExpiresAt)
  ↓
JWTInterceptor (adds Authorization header; coordinates single-flight refresh on 401)
  ↓
Authenticated API requests
```

**`AuthService`** (`src/app/core/auth/services/auth.service.ts`, `providedIn: 'root'`) exposes `token = signal(...)` and `user = signal<User>(null)`, both seeded from `localStorage`.

- **Token storage**: `localStorage` exclusively (`token`, `expiresAt`, `refreshToken`, `refreshExpiresAt`) — no cookies, no `sessionStorage`. This means tokens are readable by any script running in the page (standard XSS exposure trade-off of bearer-token-in-localStorage; see [§21](#21-security--accessibility)).
- **Session check**: `isLoggedIn()` compares `dayjs()` against the stored `expiresAt`.
- **Refresh**: `refreshToken()` → `POST /auth/refresh`; triggered from two places — `JWTInterceptor` reactively on 401, and `childrenAuthGuard` proactively on navigation when the access token looks expired but a refresh token is still present.
- **Logout**: `POST /auth/invalidate`, then (in `tap`, `catchError`, *and* `finalize` — cleanup happens no matter what) clears storage, dispatches the NgRx `clearState()` action, clears the `user` signal, and navigates to the login path.
- **Guards** (`src/app/core/auth/guards/`, `src/app/core/guards/`, plus feature-specific ones):

| Guard | Purpose |
| --- | --- |
| `childrenAuthGuard` (`auth.guard.ts`) | Global authentication gate; redirects unauthenticated → login, authenticated-away-from-login → home; silently attempts token refresh before giving up |
| `rolesGuard` / `childRolesGuard` (`role.guard.ts`) | Reads `route.data.roles`, checks `AuthService.hasPermits(roles)` |
| `appAccessLevelGuard` (`src/app/apps/guards/app-access-level.guard.ts`) | Per-app access-level check against `route.data.appAccessLevel`, with admin bypass |
| `canDeactivateAppFn` (`src/app/core/guards/app.guard.ts`) | Clears NgRx app state when navigating between different `appId`s (state hygiene, not auth) |
| `modalGuard` (`src/app/core/guards/modal.guard.ts`) | Blocks navigation while any `@appolow/modal` is open |
| `canDeactivateFormFn` (`src/app/core/guards/form.guard.ts`) | Prompts a confirm dialog before navigating away from a dirty form |
| `previewModeCanDeactivate` (`src/app/page-management/guards/preview-mode-exit.guard.ts`) | Turns off designer preview mode on route exit |

**Role/permission model**: `AuthService.hasPermits()` / `hasSomePermits()` normalize direct + group-inherited roles and treat `environment.auth.adminRoleName` (`'ROLE_ADMIN'`) as an implicit super-role that bypasses all checks. Two structural directives expose this to templates: `[withRoles]` (**all** listed roles required) and `[withSomeRoles]` (**any** role required) — `src/app/core/auth/directives/`. Reach for these directly in templates rather than writing `*ngIf="authSvc.hasPermits([...])"` by hand.

**Note the two-layer permission model in the extensibility system**: a module's `readPermission` gates whether it *loads at all*; `canActivate(ctx)` on the module service gates *navigation* to it at runtime. Both exist and serve different purposes — see [§2](#2-the-extensibility-system-modules-widgets-plugins).

---

## 8. Routing architecture

Root routes (`src/app/app.routes.ts`) compose per-feature route files (`apps.routes.ts`, `config.routes.ts`, `user-management.routes.ts`, `group-management.routes.ts`, `marketplace.routes.ts`, `page-designer.routes.ts`, `deployment-history.routes.ts`) via `children:` (same URL tree) or `loadChildren:` (separate chunk, e.g. `AuthRoutingModule`). Leaf routes overwhelmingly use `loadComponent: () => import('./x.component').then(c => c.XComponent)`.

**Two additional layers on top of vanilla Angular routing:**

1. **Guards + resolvers composed on parent routes**, then inherited by children — e.g. `apps/:appId` carries `resolve: { app, databases }` and `canDeactivate: [canDeactivateAppFn, modalGuard]` once, and every child route (`pages`, `widgets`, `roles`, ...) gets that context for free.
2. **Runtime router composition for extension modules.** `ModuleLoaderService.initializeRoutes()` finds the module-mount node in the *live* `Router.config`, appends each permitted module's route tree, and calls `router.resetConfig(currentConfig)`. Extension-module routes are **not** statically present in `app.routes.ts` — they're spliced in after login, based on the user's `allowedModules`. If you're chasing a routing bug for something under `/modules/...`, start in `ModuleLoaderService`, not `app.routes.ts`.

**Resolvers** (`src/app/*/resolvers/*.resolver.ts`): functional (`ResolveFn<T>` or a plain typed arrow function), with a very consistent idiom repeated across `user.resolver.ts`, `role.resolver.ts`, `cluster.resolver.ts`, `environment.resolver.ts`, `group.resolver.ts`, `theme.resolver.ts`, `widget.resolver.ts`:

```ts
(route) => route.params['id'] === 'add' ? of(null) : service.find(route.params['id']).pipe(catchError(() => of(null)));
```

Use this exact shape for new edit-route resolvers — it's what every existing "add vs edit" route does.

**Breadcrumbs**: `route.data.breadcrumb` is either a translation key string (`'USER_LIST.BREADCRUMBS.MAIN'`) or a function of resolved data (`(data) => data.value?.username`, `(data) => \`${data.app.name}\``). Rendered by `@appolow/breadcrumbs` in the shell (`src/app/layout/components/wrapper/wrapper.component.ts`). There is no separate route `title` property in use — breadcrumb keys serve that role.

**No Angular route `title` property usage was found** — don't introduce it inconsistently; follow the breadcrumb-key convention instead if you need a page title.

---

## 9. Forms

**Reactive Forms, untyped** — `UntypedFormBuilder`/`FormBuilder` across 48 files, no typed (`nonNullable`) reactive forms anywhere. Don't introduce typed forms in isolation; it would be inconsistent with everything else.

**UI library**: `@appolow/form` supplies the actual input components — `apw-input`, `apw-select` (via `AppolowSelectModule`), `apw-textarea`, `apw-fieldset`, plus `AppolowUcfirstPipe` (`| apwUcfirst`, capitalizes translated labels) and directives like `apwLoadingButton`/`apwTooltip`. Bind them with plain `formControlName` exactly like native controls:

```html
<apw-input type="text" [label]="'...' | transloco | apwUcfirst" formControlName="name"></apw-input>
```

Validation-error display is owned internally by the `apw-*` components (label/placeholder/`formText` inputs) — the app layer does not hand-roll `invalid-feedback` markup per field.

**Validators** (`src/app/shared/validators/`):

- `common/`: `at-least-one.validator.ts`, `conditional.validator.ts` (generic `conditionalValidator(conditionFn, errorFn)` wrapper), `json.validator.ts`, `only-one.validator.ts`, `classname.validator.ts`.
- `strings/`: `alphabetic`, `alphabetic-start`, `alphabetic-and-underscore`, `no-number-start`, `database-name`, `equal` (cross-field match, e.g. password confirmation), `url`, `fqdn`.
- Async: `@core/validators/function-validator.validator` → `asyncFunctionValidator(fn, errorKey, debounceMs)`, used for backend uniqueness checks against `service.exists(filters)`.

**Check this folder before writing a new validator** — the string-validation set in particular covers most "identifier-like field" cases you'll need.

**Submission pattern**: `@AsyncCheckFormValidity()` method decorator (`src/app/shared/decorators/async-check-form-validity.decorator.ts`) wraps `save()`/`saveAndClose()`. It debounces briefly (lets async validators settle), and if the form is invalid, marks everything dirty/touched and shows a `Toast.error(...)` keyed either to the first invalid control or a generic `GENERIC.MESSAGES.ERROR.INVALID_FORM` fallback — otherwise it calls through to your real method. This is how *every* save button in the app behaves consistently without each component re-implementing the check.

**The generic editing-form abstraction** — the strongest, most valuable reusable pattern in the forms layer, three layered base classes in `src/app/shared/components/`:

1. **`EditingFormComponent<I, O>`** (`editing-form/editing-form.component.ts`) — page-routed editing. Injects `fb`/`router`/`activatedRoute`; `id`/`value` are input signals (`value` falls back to a `DATA_TOKEN` injection); `isNew` is `computed()` from whether `id() === 'add'`; `save()` (decorated `@AsyncCheckFormValidity()`) calls `dataSvc.updateOrCreate(value)`, patches the result back into the form, and toasts success/error; `cancelEdit()` navigates `'../'` so `canDeactivate` guards fire correctly. An `effect()` on the `value` input calls `form.patchValue(value); form.markAsPristine()` whenever resolver data arrives — this is the uniform "load record into edit form" mechanism used everywhere.
2. **`EditingFormInModal<I, O>`** — same base, but resolves its input from `PLUGIN_RUNTIME`/`MODAL_DATA_TOKEN`, adds `saveAndClose()` (save → disable form → close modal with result), and guards `dismiss()` with `@CheckFormDirt({ formKeyName: 'form' })` to prompt on unsaved changes.
3. **`EditingFormInPortal<I, O>`** — structurally identical, targets `AppolowActivePortal`/`PORTAL_DATA` for embedding an edit form inside a widget/plugin surface instead of a modal.

**To build a new edit screen**: `class XEditionComponent extends EditingFormComponent<X>` (or `EditingFormInModal`/`EditingFormInPortal` for modal/portal hosting), set `dataSvc: CollectionService<X>` (or a subclass), define `form = this.fb.group({...})`. Patching existing records, dirty-state discard prompts, validity-gated submission, and success/error toasts all come for free — see [§23](#23-existing-solutions-you-should-reuse).

---

## 10. UI, design system & styling

Full detail: `documentation/design-system/` (`theme-system.md`, `css-variables-practical-guide.md`, `variables-css-appolow-library.md`). Summary of the layered token model:

```text
--appolow-ref-*        primitives (e.g. --appolow-ref-color-blue-500)
   ↓
--appolow-sys-*         semantic tokens (e.g. --appolow-sys-color-primary)
   ↓
--appolow-{component}-*  widget/component-scoped tokens
   ↓
--appolow-container-*    shared "repeated item" surface tokens (board card, list item, calendar event — via resolveContainerTokens / ContainerComputedStylePipe)
```

Base tokens live in `src/styles/tokens/appolow-base-tokens.scss` (canonical source — "if a variable is part of the design system, it must first exist here"). `appolow-global-token-mappings.scss` is an explicitly-temporary compatibility layer translating canonical tokens to what library components currently consume — expected to shrink over time, not a place to add new permanent tokens. `appolow-platform-shell-tokens.scss` + `_appolow-shell-brand-palette.scss` are shell-only (never shipped to generated Blueprint apps) and feed both Bootstrap's SCSS variables and the `--appolow-sys-color-*` custom properties from one source of truth.

**Deprecated and enforced by lint**: raw `var(--bs-*)` and bare aliases like `var(--appolow-primary)`. Run `npm run lint:tokens` (`scripts/lint-deprecated-tokens.mjs`) — this is a real, wired-up guard rail, not aspirational documentation.

**`src/styles.scss`** load order: fonts/vendor CSS (Appolow icon font, `@appolow/form` base styles, Google Inter + Material Symbols Outlined, Quill, CDK overlay) → `styles/custom/variables.scss` + `bootstrap/scss/bootstrap` → the three token files above → `ngx-toastr` theme → platform custom partials (`styles/custom/{drag_and_drop,icons,spacing,badge,dropdown,pages,utilities,steppers,input}.scss`) → misc global rules.

**Theming**: `src/app/theme-management/` is full CRUD over themes (list/edit/import/import-summary), with utilities to parse/classify/group/label CSS variables from imported theme CSS. `DesignerStateStore.previewTheme` serializes the active theme to inline CSS on the designer preview shell — theme preview is store-driven, not a separate mechanism.

### Reusable components (`src/app/shared/components/`)

| Need | Component | Notes |
| --- | --- | --- |
| Confirmation dialog | `ConfirmDialogComponent` (`confirm-dialog/`) | **Don't open it directly** — use the `@Confirmable(...)` method decorator, which opens it in a modal, awaits the result, and only runs your method on confirm |
| Empty state | `apw-empty-list` (`empty-list/`) | Signal inputs `content`, `icon`, `handler`, `linkContent` |
| Inline loading skeleton | `appolow-loading-block` (`loading-block/`) | `height`/`width` inputs |
| Global HTTP loading spinner | `LoadingService` (`ngx-loading/services/loading.service.ts`) | Singleton, reference-counted `show()`/`hide()`, paired with `NavigationLoadingInterceptor` |
| Icon picking | `IconSelectorComponent` (`icon-selector/`, `app-icon-selector`) | `ControlValueAccessor` over an `Icon` model, supports material/font-awesome/appolow/custom-upload |
| Icon rendering | `IconPreviewComponent` (`icon-preview/`, `apw-icon-preview`) | Switches on `config.library` |

### Icons

Mixed strategy selected per-icon via `Icon.library`:

- **Material Symbols** (default) — full webfont loaded globally, rendered as `<span class="material-symbols-outlined">`. No asset change needed to use any Material icon; `MaterialService` + `grouped-icons.ts` provide a curated, categorized subset for icon-picker UX.
- **Custom Appolow SVG font** — 28 hand-authored SVGs under `src/assets/icons/font/*.svg`, compiled into `src/assets/fonts/appolow/css/appolow.css`, rendered as `<i class="icon-{value}">`. **Adding a new one requires adding the SVG and regenerating the font** — this is the one icon path with real build friction.
- **Font Awesome** — `<i class="fa-solid fa-{value}">`.
- **Custom upload** — user-provided images (≤ `APP_MAX_ICON_SIZE`, ≤256×256), stored/rendered as data URLs.

---

## 11. Icons & assets

(Covered together with the design system in [§10](#10-ui-design-system--styling) since icon strategy is tightly coupled to the `Icon` model and `IconPreviewComponent`.) Other assets: `src/assets/i18n/` (translation JSON + language metadata), `src/assets/icons/material-icon-avatars.json` (avatar icon/color presets), plus per-widget `assets/images/` folders under `src/widgets/*/assets/` and `src/modules/*/widgets/*/assets/` — these are wired into `angular.json`'s `assets` glob config specifically (`**/widgets/*/assets/images/**/*` → `/modules`, etc.), so a new widget's images just need to live in that conventional `assets/images/` subfolder to be picked up automatically.

---

## 12. Translation / i18n

**Library**: `@jsverse/transloco`, root loader `TranslocoHttpLoader` (`src/app/transloco-loader.service.ts`) fetches `/assets/i18n/${lang}.json`. Configured in `app.config.ts`: `availableLangs: ['en', 'es']`.

**Where translations live**:

- **Root/global**: `src/assets/i18n/en.json` / `es.json` — ~4,000 leaf keys across 37 top-level namespaces (`GENERIC`, `SIDEBAR_MENU`, `APP_LIST`, `PAGE_DESIGNER`, `AUTH`, `TABLE`, `DATA_MANAGEMENT`, `ENTITIES`, `WORKFLOW`, etc.).
- **Per-extension**: modules, plugins, and widgets ship their **own** translation JSON under `assets/i18n/{en,es}.json` next to the extension (`src/plugins/dataSource/assets/i18n/`, `src/modules/elliot/widgets/*/assets/i18n/`, etc.), loaded dynamically per the extension's `loadTranslations` hook via `TranslationLoaderService` — this is *part of* the extensibility contract (`BaseWidgetService`/`BasePluginService` document `loadTranslations: { en: (await import('./assets/i18n/en.json')).default, es: ... }`).

**Key naming convention**: `SCREAMING_SNAKE` namespace segments joined by dots, feature-first: `<FEATURE>.<SECTION>.<ITEM>`, e.g. `GENERIC.TITLES.DASHBOARD`, `APP_ACCESS.MESSAGES.DELETE_ACCESS`, `USER_LIST.MESSAGES.CANNOT_DELETE_LAST_USER`, `GENERIC.MESSAGES.ERROR.FQDN`. Common `SECTION` values: `TITLES`, `LABELS`, `BUTTONS`, `DESCRIPTIONS`, `MESSAGES.{INFO|WARNING|ERROR}`, `BREADCRUMBS`, `MENU`.

**Consumption**: the `transloco` pipe dominates (`{{ 'X.Y' | transloco }}`, 248 template files) — including dynamic keys (`{{ 'APP_ACCESS.LEVELS.' + property | transloco }}`). The `*transloco` structural directive is **not used anywhere** — don't introduce it inconsistently. For imperative/non-template use, the whole codebase goes through the **`Translations`** static-facade service (`src/app/core/services/translations.service.ts`), not `TranslocoService` directly:

- `Translations.instant(key, params?, lang?)` — one-off imperative lookups (127 call sites).
- `Translations.watch<T>(key, params?)` — returns an `Observable<string>` that stays reactive to language changes; prefer this over `instant()` for anything the user might see change live under a language switch.
- `Translations.currentLanguage` — a `signal`, seeded from `localStorage.getItem('language')` or `navigator.language`; setting it drives an internal `effect()` that also re-syncs `ngx-timeago` and the paginable-table library's own translation service.
- `Translations.setActiveLang(lang)` persists to `localStorage`.

**Validation error translation**: `src/app/core/constants/errors.ts` maps Angular validator error keys → translation keys (`required → GENERIC.MESSAGES.ERROR.REQUIRED_FIELD`, `pattern`/`email → GENERIC.MESSAGES.ERROR.PATTERN`, `uniqueName → GENERIC.MESSAGES.ERROR.NAME_ALREADY_EXISTS`, etc.), with `DEFAULT_ERROR_TRANSLATION` as a fallback. This is wired globally in `app.config.ts` as `AppolowLibraryModule.forRoot({ invalidFeedbackTemplateFn: ... })` — so `apw-*` form controls' built-in error rendering automatically resolves through this table. **Add new validator-key → translation-key mappings here**, not per-component.

**Language switching UI**: a dropdown in `src/app/layout/components/wrapper/wrapper.component.html`, iterating `availableLangs`, calling `Translations.currentLanguage.set(lang)` on click.

### How to add translations for a new feature

1. Add keys to `src/assets/i18n/en.json` and `es.json` under a new or existing feature namespace, following `<FEATURE>.<SECTION>.<ITEM>`.
2. If you're building a **module/widget/plugin** (extensibility system), instead ship `assets/i18n/{en,es}.json` next to it and declare `loadTranslations` in the descriptor — do not put extension copy in the global file.
3. Use `| transloco` in templates; use `Translations.watch()`/`Translations.instant()` (not raw `TranslocoService`) in TypeScript.
4. If the copy is a validator error message, add the mapping to `ERROR_TRANSLATIONS` in `core/constants/errors.ts` instead of hand-writing per-field error text.

---

## 13. Tables & list pages

`@appolow/paginable`'s `TableComponent`/`TableModule` is registered once, globally, via `TableModule.forRoot()` in `app.config.ts`. There **is** a standard list-page pattern, and it's one of the most consistently followed conventions in the app: **28 components** extend the abstract base **`PaginatedTableComponent<T>`** (`src/app/shared/v2/components/paginated-table/paginated-table.component.ts`) — `user-list`, `role-list`, `widget-list`, `page-list`, `app-list`, `group-list`, `theme-list`, `cluster-list`, `environment-list`, `database-list`, `entity-list`, `field-list`, `api-list`, `connection-list`, and more.

**What the base class gives you for free**: signals for `page`/`perPage`/`searchTerm`/`ordination`/`dynamicFilters`/`mandatoryFilters` → a computed `filters`, a debounced `request` computed, `paginatedData = resource({ params: request, loader: fetchFn })` (data fetching is a `resource()`, not manual subscription management), URL query-param sync (`TableUrlSyncService`), generic `view()`/`edit()` (opens an edit component in an `AppolowModal`), `delete()` decorated with `@Confirmable(...)` + `Toast.success/error`, and `navigateTo`/`navigateToEdition` helpers.

**Standard template skeleton** (from `user-list.component.html`, mirrored across all 28 list pages):

```html
<div class="list-page__header">
  <h2 class="list-page__title">…</h2>
  <button class="btn btn-primary" *withRoles="[...]">add</button>
</div>
<div class="list-page__content">
  <appolow-table [headers]="headers" [data]="value?.data" [totalItems]="value?.total"
    [searchable]="true" [(searchTerm)]="searchTerm" [(filters)]="dynamicFilters"
    [(ordination)]="ordination" [(perPage)]="perPage" [(page)]="page"
    [clickFn]="navigateToEdition.bind(this)">
    <ng-template paginableTableCell header="active" …>…</ng-template>
    <ng-template paginableTableCell header="actions" …>
      <button (click)="deleteUser(item, $event)">…</button>
    </ng-template>
    <ng-template paginableTableNotFound>…</ng-template>
  </appolow-table>
</div>
```

`.list-page__*` classes are defined in `src/styles/custom/_pages.scss`. Row-level actions can also be declared through `headers[].buttons[]` instead of an `ng-template` (see `RoleListComponent`) for simpler cases. **No bulk multi-select action pattern exists anywhere in the sampled list pages** — if you need bulk actions, there's no convention to copy; you'd be establishing one.

### To build a new list page

1. `class XListComponent extends PaginatedTableComponent<X>`.
2. Set `dataSvc` to your `CollectionService<X>` subclass, define `headers: PaginableTableHeader[]`, override `searchKeys`/`ordination` as needed.
3. Copy the template skeleton above; wrap the "add" button and row actions in `*withRoles`/`*withSomeRoles` per required permission.
4. Override `getDeleteConfirmTitle`/`getDeleteConfirmContent` if you need custom confirm-dialog copy.

---

## 14. Error handling, loading & notifications

There is **no single centralized global HTTP error handler** (no `ErrorHandler` override, no catch-all interceptor that converts every failed request into a toast) — error handling is deliberately local:

- `CollectionService.paginate()` swallows errors into an empty page (logs, doesn't rethrow) — list pages degrade to "no results" rather than crashing on a failed search.
- `JWTInterceptor` handles exactly one cross-cutting error case (401 → refresh-or-logout).
- Everywhere else, **`Toast`** (`src/app/core/services/toast.service.ts`) is the actual centralized mechanism — a thin static wrapper around `ngx-toastr`, callable from anywhere without DI: `Toast.success(msg, title?)`, `Toast.info(...)`, `Toast.error(...)`, `Toast.warning(...)`, `Toast.clear()`.

**Convention**: `Toast.error(Translations.instant(error.message))` — note that the **backend's `error.message` is itself treated as a translation key** and piped through `Translations.instant()`. If you're adding a new backend error surface, the backend needs to return a translation key, not free text, for this convention to keep working.

**Toast translation key convention**: `GENERIC.MESSAGES.{INFO|WARNING|ERROR}.<KEY>` for shared copy, `<FEATURE>_LIST.MESSAGES.<KEY>` / `<FEATURE>_LIST.MESSAGES.INFO.<KEY>` for feature-scoped copy. Confirm-dialog content keys conventionally end in `?` (e.g. `GENERIC.MESSAGES.WARNING.DELETE_ELEMENT?`).

**Confirmation workflow**: never open `ConfirmDialogComponent` manually — use `@Confirmable({ title, content, ... })` on the method that performs the destructive action; it wraps the method, shows the dialog, and only proceeds on confirm, routing unexpected errors to `Toast.error()` automatically. `PaginatedTableComponent.delete()` is the reference implementation.

**Loading states**: form-level "is this saving" uses `DesignerStateStore.isSaving` / equivalent local signals; page/table-level loading comes for free from `resource()` (`paginatedData.isLoading()`); app-wide HTTP loading uses the global `LoadingService` + `NavigationLoadingInterceptor` combo, which also covers router navigation, not just HTTP.

---

## 15. Services & dependency injection

**Singleton root services dominate** — `providedIn: 'root'` appears in 77+ service files, the default for both cross-cutting infra (`core/services/`) and feature services (`<feature>/services/`). Feature services mirror their domain 1:1 (`data-management/services/entities.service.ts`, `data-management/apis/services/*.service.ts` — even API sub-resources get their own service file). Cross-cutting infrastructure lives in `core/services/` (loaders, registries, extensibility, translations, toast) and `core/classes/` (abstract bases).

**Facades**: `ExtensibilityService` (`core/services/extensibility.service.ts`) is the one intentionally-documented facade — its own docblock states it provides a single entry point over `WidgetLoaderService`, `WidgetRegistryService`, `PluginLoaderService`, `ModuleLoaderService`, `TranslationLoaderService`, `HookRunnerService`. No other service claims this role — don't build a second facade over the extensibility system.

**Abstract base classes** (`src/app/core/classes/`): `BaseWidgetService` (convention-based lazy component/icon loading, no-op override hooks for the full widget lifecycle, `createDefaultWidget()` factory) and `BasePluginService` (the plugin equivalent). Both are populated by their respective decorators (`@WidgetService`, `@PluginService`, in `core/decorators/`) which inject config metadata into `declare readonly` fields — read `documentation/extension-generation/annexes/*-decorator-properties.md` before writing a new widget/plugin service, since the decorator contract is not obvious from the base class alone.

**Injection tokens** worth knowing:

| Token | Purpose |
| --- | --- |
| `DESIGNER_STATE_STORE` | The store — always inject via this token, never the class |
| `WIDGET_RUNTIME` / `PLUGIN_RUNTIME` | Runtime context injected into widget/plugin components (`inject(WIDGET_RUNTIME, { optional: true })`) |
| `CONFIRMATION_SERVICE` | Confirmation dialog abstraction used by `@Confirmable(...)` |
| `PORTAL_DATA` / `MODAL_DATA_TOKEN` | Data passed into portal- or modal-hosted components |
| `InjectionService.createToken(name)` | A **factory that mints new `InjectionToken`s at runtime** — an unusual, dynamic pattern; see `core/services/injection.service.ts` before assuming you need a new static token |

**When to create a new service vs. extend an existing abstraction**: if it's CRUD against a REST resource, extend `CollectionService`/`AppCollectionService` — do not hand-write `HttpClient` calls. If it's a widget/plugin/module descriptor, extend the matching `Base*Service` and use the matching decorator — do not build a parallel registration mechanism. Only reach for a brand-new standalone service when neither of these fits (e.g. a genuinely new cross-cutting concern like `Toast` or `LoadingService`).

---

## 16. TypeScript & naming conventions

- **Interfaces over `type`**: `export interface` is the primary modeling tool (108+ files); `export type` is used sparingly (19 files) for narrow unions/aliases. **No `I`-prefix convention** — only 6 files use `IWhatever`; the norm is a plain PascalCase name (`NavigationPermissions`, `SectionPermission`).
- **Enums**: real TS `enum` still used but not pervasive (9 files) — sometimes declared locally right inside a component file when the enum is only relevant there (e.g. `StandardScopes` in `role-edition.component.ts`).
- **File naming**: consistent kebab-case + role suffix — `.component.ts`, `.service.ts`, `.routes.ts`, `.guard.ts`, `.resolver.ts`, `.interceptor.ts`, `.directive.ts`, `.decorator.ts`, `.validator.ts`. **No `.model.ts` files exist at all** — domain types live in plainly-named files inside `models/`/`interfaces/`/`definitions/` folders instead of being suffix-tagged.
- **Barrels**: 27 `index.ts` barrel files for shared component/module folders — import from the barrel (`@shared/components`) rather than deep-pathing into a component file when one exists.
- **Type-only imports**: `import type { ... }` used in 87 files — prefer this for type-only imports in new code, it's an established habit here.
- **Generics**: meaningful, not decorative — `EditingFormComponent<I = null, O = I>`, `BasePluginEdition<T>`, `DesignerStoreEditingComponent<T>` are all genuinely reused generic abstractions (see [§9](#9-forms) and [§2](#2-the-extensibility-system-modules-widgets-plugins)), not one-off type parameters.
- **Selectors**: inconsistent prefix (`app-` and `apw-` coexist even within the same folder) — don't infer a rule; match whatever the immediate neighbor components use.
- **Signals**: **no `$` suffix** — plain camelCase names (`propertyFormat`, `showColumnFormatPanel`). This is the opposite of the Observable convention below — don't cargo-cult a `$` suffix onto a signal.
- **Observables**: a **partial** `$` suffix convention exists (`collection$`, `error$`, `filteredCategories$`) but is not universally applied — treat it as "nice to have, not enforced."
- **Private fields**: native `#field` is the modern preferred style over the `private` keyword.

---

## 17. RxJS & Signals

**RxJS operator frequency** (files using each): `catchError` 40, `switchMap` 19, `tap` 18, `takeUntilDestroyed` 14, `takeUntil` 9, `finalize` 5, `combineLatest` 5, `shareReplay` 2, and **zero** uses of `mergeMap`, `concatMap`, `exhaustMap`, `forkJoin`. **Do not reach for the "advanced" flattening operators** — this codebase consistently prefers `switchMap` plus `firstValueFrom`/`async-await` for sequencing instead. If you find yourself wanting `forkJoin`, check whether a `resource()` or a couple of awaited calls fits the existing style better.

**Best RxJS reference in the codebase**: `src/app/core/auth/interceptors/jwt.interceptor.ts` — the 401/refresh coordination flow (`catchError` → single in-flight `refreshToken()` → `BehaviorSubject` queue with `filter(Boolean), take(1), switchMap(...)` for waiters) is a genuinely well-structured concurrent-request-coalescing pattern worth modeling other "coordinate concurrent async work" problems on.

**Modern signal-era RxJS idiom**: `.pipe(takeUntilDestroyed(this.#destroyRef), debounceTime(150), distinctUntilChanged(...))` (e.g. `fieldset-edition.component.ts`) — `takeUntilDestroyed` is the preferred unsubscription mechanism in new code over manual `Subject`-based teardown.

**Custom RxJS/lifecycle decorators** (`src/app/shared/decorators/`) — legacy-leaning utilities with sparse real adoption (mostly used in their own specs plus a handful of call sites like `widget-designer.component.ts`); understand them if you encounter them, but they are **not** the recommended way to write new subscription-management code (`takeUntilDestroyed` is):

| Decorator | What it does |
| --- | --- |
| `@AutoUnsubscribe()` | Property decorator; patches `ngOnDestroy` to auto-unsubscribe any `Subscription` assigned to the decorated property |
| `@DebounceTime(delay=512)` | Method decorator; naive `setTimeout`/`clearTimeout` debounce — **not actually RxJS `debounceTime`** despite the name |
| `@Delay({time, waitFor, condition})` | Rewrites the constructor to defer assigning an Observable/function-valued property until a lifecycle hook fires |
| `@WaitFor({observableName})` | Delays a method call until a named observable property on the instance emits truthy |

**Signals** are the default for new component/store state (see [§4](#4-component-design-patterns) adoption table). `resource()` is used for signal-driven data fetching (widely, 55 files) — prefer it over manual `subscribe()`-in-`ngOnInit()` for "fetch data that depends on a signal input" scenarios. `linkedSignal()` is essentially unused (1 occurrence) — don't assume it's an established pattern here even though it's a valid Angular API.

---

## 18. Directives, pipes & decorators

**Permission directives**: `[withRoles]` (all-of) / `[withSomeRoles]` (any-of), `src/app/core/auth/directives/` — use these in templates instead of hand-rolled `*ngIf="authSvc.hasPermits(...)"`.

**Formatting/translation pipes**: `transloco` (i18n, see [§12](#12-translation--i18n)), `apwUcfirst` (from `@appolow/form`, capitalizes translated strings — the standard way labels get sentence case after translation).

**Reusable method decorators** (`src/app/shared/decorators/`) — these substitute for boilerplate you'd otherwise write per-component, and are genuinely idiomatic here (unlike the RxJS lifecycle decorators in [§17](#17-rxjs--signals)):

| Decorator | Use it for |
| --- | --- |
| `@Confirmable({title, content, ...})` | Any destructive action that needs a confirm dialog before running |
| `@AsyncCheckFormValidity()` | Any form-submission method — validity gating + dirty/touched marking + error toast |
| `@CheckFormDirt({formKeyName})` | Any "close/dismiss" method on a form host that should prompt on unsaved changes |

Check these three before writing manual `if (form.invalid) {...}` or `confirm()`-style logic anywhere near a form or a delete button.

---

## 19. Testing architecture

**Runner**: Vitest, via `@angular/build:unit-test` (`angular.json` → `test` target), config `vitest.config.ts`, setup `src/testing/vitest.setup.ts`.

**Volume**: **464** `*.spec.ts` files repository-wide. `documentation/frontend/testing/test-coverage-plan.md` is a live, partially-executed roadmap (18 phases, currently prioritizing security/auth and validators, working toward the largest remaining gap — `src/modules/` at Phase 14) — its own snapshot numbers (279 specs at last update) are already stale versus the current 464, so **treat the plan as directional, not as an accurate current-state document**; count specs yourself if you need a real number.

**Patterns observed**:

- Pure-function/util specs need no `TestBed` at all (e.g. `app-access.util.spec.ts` calls exported functions directly) — prefer this for anything that's actually a pure function.
- A real, shared test-infrastructure layer exists at `src/testing/`: `providers/` (`toastTestingProvider`, `appolowFormsTestingProvider`, `activeModalTestingProvider`), `i18n/transloco-testing.module.ts` (`getTranslocoTestingModule()`), `test-stubs.ts`, `mocks/designer-state-store.stub.ts`. **Use these rather than hand-mocking Transloco/Toast/modals/the designer store per spec file** — they exist specifically so you don't have to.
- Component specs use Angular `TestBed`/`ComponentFixture` with hand-built `vi.fn()` spies (Vitest, not Jasmine) rather than a mocking library.
- Some specs mock `Translations` at the instance level (`Translations.translateInstance` replaced with a plain object) rather than going through the real Transloco testing module — a hybrid approach; either is acceptable depending on how deep the test needs Transloco to actually function.
- A known weak spot the coverage plan itself flags: a number of specs are "should create" smoke tests only (e.g. `app-acess-name.pipe.spec.ts`) — don't treat the existence of a `.spec.ts` file as proof of real coverage.

**For new tests**: put shared mocking needs in `src/testing/` if they'll be reused, import via `@testing/*`; favor plain function tests for utils/validators; use `TestBed` + the existing testing providers for components that touch Transloco/Toast/modals/the designer store.

---

## 20. Performance patterns

- **`@defer`**: essentially unused — 2 occurrences total, both gating a widget edition panel on form readiness (`@defer (when form) { ... }`), not used for route-level or list-level deferred rendering. Don't assume `@defer` is an established pattern to extend broadly; it's an isolated experiment so far.
- **`OnPush`**: only 5 components. The app leans on signals for fine-grained reactivity rather than `OnPush` + manual `markForCheck()`.
- **`@for`/`track`**: 100% adoption where the new control-flow syntax is used (199/199 `@for` blocks have `track`) — no untracked loops exist. Old `trackBy` (paired with `*ngFor`) has zero occurrences.
- **Virtual scrolling**: `@angular/cdk/scrolling` used in exactly 2 places (`detail-widget-preview`, `form-widget-preview`) for large field lists — not a general list-page pattern (the paginated table pattern in [§13](#13-tables--list-pages) handles large lists via server-side pagination instead).
- **Code splitting**: the extensibility system ([§2](#2-the-extensibility-system-modules-widgets-plugins)) is *entirely* built on dynamic `import()` for modules, widgets, plugins, edition panels, and per-extension translation files — this is the dominant, load-bearing code-splitting mechanism in the app, well beyond ordinary router lazy-loading.
- **Not present**: `NgOptimizedImage`/`ngSrc` (zero usage — plain `<img src>` throughout).

---

## 21. Security & accessibility

### Security

- **XSS**: Angular's default auto-sanitization is relied on almost everywhere; `DomSanitizer.bypassSecurityTrustHtml` appears in only two places (`src/modules/elliot/pipes/safe-html.pipe.ts`, a theme-CSS-import summary component) — narrow, explicit opt-ins, not a broad pattern. If you're rendering HTML from a new source, treat these two as the only precedent, and scrutinize the input source before copying them.
- **CSRF**: no XSRF token handling exists (`HttpClientXsrfModule` is not configured). Bearer-token auth in an `Authorization` header is used instead of cookie sessions, which sidesteps classic CSRF exposure but is not itself CSRF protection — this is a deliberate trade-off of the auth model, not an oversight to "fix" in isolation.
- **Token storage**: access/refresh tokens and their expiry live in plain `localStorage` — readable by any script in-page. This is the standard trade-off of bearer-token SPA auth; if you're touching auth, don't "improve" this to `httpOnly` cookies without understanding it's a deliberate, systemic choice tied to the interceptor-based auth flow, not a local bug.
- **File uploads**: no client-side type/size validation was found around the `FormData` upload call sites — if you add a new upload flow, there's no existing client-side validation convention to copy.
- **Password policy**: `PASSWORD_REGEX` in `core/auth/interfaces/constants.ts` (min 8 chars, upper/lower, special character) — client-side only.

### Accessibility

ARIA/role usage exists but is uneven: 76 `role=` and 62 `aria-label` occurrences across only 38 of 324 component templates; explicit `<label for=...>` associations are sparse (11 occurrences) — many forms likely rely on the `apw-*` form component library handling label association internally rather than hand-authored `for`/`id` pairs (not independently confirmed inside the library itself, since it's a separate repo). No `cdkTrapFocus` usage anywhere — modal focus trapping/restoration is handled internally by `@appolow/modal` (confirmed in its type declarations), not implemented per-component in this repo. Manual `.focus()` calls are rare (6 total) and narrowly scoped (inline rename inputs, rich-text editor focus). **Takeaway**: accessibility here is partially a shared-component-library concern (modal focus, form control labeling) rather than something every feature author must reimplement — but ARIA attributes on custom, one-off UI are inconsistently applied, so don't assume a new component gets accessibility "for free" unless it's built entirely from `@appolow/*` primitives.

---

## 22. Patterns worth learning from this codebase

- **Facade over an extensibility runtime, not over the whole app.** `ExtensibilityService` doesn't try to be a god-object facade for the entire application — it facades exactly the module/widget/plugin loading subsystem, with a small, stable public API (`initialize`, `getAvailableWidgets`, `getWidgetService`, `getPluginsForWidget`, `runHooks`, `loadModuleTranslations`, `clear`). This is a good model for "when a facade earns its keep": a genuinely complex subsystem with many internal collaborators and one clear external contract.
- **Decorator-declared registries with structural enforcement.** `@ModuleService`/`@WidgetService`/`@PluginService` turn "register a new extension" into filling out a typed config object rather than manually wiring into a registry — and the composition rules of the slot tree ([§2](#2-the-extensibility-system-modules-widgets-plugins)) are enforced by the store's mutation methods, not just documented. This combination (declarative registration + structurally-enforced invariants) is why the extensibility system scales to dozens of widget types without each one needing bespoke wiring code.
- **A single source of truth for edit-state, injected via a token.** `DesignerStateStore`, injected only via `DESIGNER_STATE_STORE`, is a clean example of "don't let components sync with each other directly" — every editor, every preview, every plugin panel reads/writes the same store, and the token indirection means the implementation can change without touching 27+ consumer files.
- **A three-layer generic form abstraction that actually gets reused.** `EditingFormComponent` / `EditingFormInModal` / `EditingFormInPortal` ([§9](#9-forms)) turn "create an edit screen" into "extend a base class and define a form" — patching, dirty-checking, and toast feedback are handled once, not per-feature. Combined with `PaginatedTableComponent` ([§13](#13-tables--list-pages)), most CRUD screens in the app are startlingly thin.
- **Single-flight refresh coordination in `JWTInterceptor`.** A textbook example of using a `BehaviorSubject` as a coordination point so N concurrent 401s trigger exactly one refresh call, with everyone else queued behind it — worth copying verbatim if you ever need similar single-flight coordination elsewhere.
- **Token-layered CSS variables with a lint gate.** The `ref → sys → component → container` cascade plus an actual enforced lint script (`lint:tokens`) is a rare case of a design-token system that isn't just aspirational documentation — it has teeth.
- **Method decorators that replace boilerplate, not hide it.** `@Confirmable`, `@AsyncCheckFormValidity`, `@CheckFormDirt` each collapse a well-understood, repetitive pattern (confirm-then-act, validate-then-submit, warn-on-dirty-dismiss) into one line, and they compose (a save method can be both form-validity-gated and confirmable).

---

## 23. Existing solutions you should reuse

```text
Do not open ConfirmDialogComponent manually.
Use: the @Confirmable(...) method decorator (src/app/shared/decorators/confirm.decorator.ts).

Do not write a new paginated table / list page from scratch.
Use: PaginatedTableComponent<T> (src/app/shared/v2/components/paginated-table/) — extend it,
supply `dataSvc` + `headers`, copy the .list-page__* template skeleton (see §13).

Do not hand-roll create/edit form save-and-navigate logic.
Use: EditingFormComponent<I,O> / EditingFormInModal<I,O> / EditingFormInPortal<I,O>
(src/app/shared/components/editing-form*/).

Do not write raw HttpClient CRUD calls for a REST resource.
Use: CollectionService<T> or AppCollectionService<T> (src/app/core/services/).

Do not write a new "check permission" *ngIf.
Use: [withRoles] / [withSomeRoles] structural directives (src/app/core/auth/directives/).

Do not hand-check form validity before submit.
Use: @AsyncCheckFormValidity() (src/app/shared/decorators/).

Do not warn about unsaved changes yourself.
Use: @CheckFormDirt({ formKeyName }) (src/app/shared/decorators/).

Do not import ToastrService directly or build another notification wrapper.
Use: the static Toast service (src/app/core/services/toast.service.ts).

Do not call TranslocoService directly outside a template.
Use: Translations.instant() / Translations.watch() (src/app/core/services/translations.service.ts).

Do not build a second widget/plugin/module registration mechanism.
Use: @ModuleService / @WidgetService / @PluginService decorators + BaseModuleService /
BaseWidgetService / BasePluginService (src/app/core/classes/, src/app/core/decorators/).

Do not mutate page/slot/widget/plugin config through local component state or parent callbacks.
Use: DESIGNER_STATE_STORE, injected via the token, from the component that owns the edit
(critical rule — see AGENTS.md and §2/§5).

Do not add a new async-uniqueness / regex-shaped validator without checking first.
Use: src/app/shared/validators/{common,strings}/ — alphabetic, database-name, url, fqdn, equal,
conditional, at-least-one, only-one, json, and asyncFunctionValidator for backend checks.

Do not hand-mock Transloco / Toast / modals / the designer store in a new spec.
Use: src/testing/providers/* and src/testing/mocks/designer-state-store.stub.ts.
```

---

## 24. How to implement a new feature in this application

**First, decide which of the two architectural philosophies your feature belongs to** ([§1](#1-architecture-overview)):

- A new **widget/plugin/module type** for the low-code designer palette → follow the extensibility guide (`documentation/extension-generation/00-overview.md` onward) — outside the scope of a quick checklist, read that guide.
- A **conventional admin/CRUD screen** (the common case for most day-to-day work) → follow the steps below, which reflect what `user-management`, `role-management`, `theme-management`, etc. actually do.

1. **Create the feature folder** under `src/app/` (or a subfolder of an existing large feature area), following the shape in [§3](#3-feature-architecture--conventions): `components/`, `services/`, `resolvers/`, `interfaces/`.
2. **Define the domain interface(s)** in `interfaces/` (or reuse one from `src/definitions/` if it's a shared app-structure concept).
3. **Create the service** extending `CollectionService<T>` or `AppCollectionService<T>` ([§6](#6-api--backend-communication)); set `path`/`resourcePath`, override `defaultListOrdination` if needed.
4. **Create the resolver** using the `id === 'add' ? of(null) : service.find(id).pipe(catchError(() => of(null)))` idiom ([§8](#8-routing-architecture)).
5. **Create the route file** (`x.routes.ts`) with list/add/`:id` routes, `resolve`, and `data.breadcrumb`; wire it into the parent route file via `children:`.
6. **Build the list page**: `class XListComponent extends PaginatedTableComponent<X>`, define `headers`, copy the `.list-page__*` template skeleton ([§13](#13-tables--list-pages)).
7. **Build the edit form**: `class XEditionComponent extends EditingFormComponent<X>` (or the modal/portal variant), define `form = this.fb.group({...})` using `apw-*` controls and validators from `shared/validators/` ([§9](#9-forms)).
8. **Add translations**: `<FEATURE>.TITLES/LABELS/BUTTONS/MESSAGES...` keys in `src/assets/i18n/{en,es}.json` ([§12](#12-translation--i18n)).
9. **Gate visibility/actions by role**: wrap add/edit/delete affordances in `*withRoles`/`*withSomeRoles`, and if the whole route needs gating, add `canActivate: [rolesGuard]` with `data.roles` ([§7](#7-authentication--authorization)).
10. **Wire up destructive actions and submission** with `@Confirmable(...)`, `@AsyncCheckFormValidity()`, `@CheckFormDirt(...)` as applicable ([§18](#18-directives-pipes--decorators)).
11. **Write tests**: pure-function tests for any utils/validators with no `TestBed`; `TestBed`-based component specs using `src/testing/providers/*` for anything touching Transloco/Toast/modals ([§19](#19-testing-architecture)).

---

## 25. Example feature blueprint

Derived directly from `src/app/user-management/`, `src/app/role-management/`, and `src/app/theme-management/` — this is the real, repeated shape, not an invented one:

```text
x-management/
├── components/
│   ├── x-list/
│   │   ├── x-list.component.ts        # extends PaginatedTableComponent<X>
│   │   ├── x-list.component.html      # .list-page__header / .list-page__content + appolow-table
│   │   └── x-list.component.scss
│   └── x-edition/
│       ├── x-edition.component.ts     # extends EditingFormComponent<X> (or …InModal / …InPortal)
│       ├── x-edition.component.html   # apw-* controls, formControlName-bound
│       └── x-edition.component.scss
├── services/
│   └── x.service.ts                    # extends CollectionService<X> / AppCollectionService<X>
├── resolvers/
│   └── x.resolver.ts                   # id === 'add' ? of(null) : service.find(id)
├── interfaces/
│   └── x.ts
└── x-management.routes.ts              # list / add / :id, resolve, data.breadcrumb, canActivate guards
```

Wired into `src/app/app.routes.ts` (or a parent feature's route file, e.g. `apps.routes.ts`) via `children: xManagementRoutes`.

---

## 26. Architectural observations

### Strong architectural decisions

- Splitting state management by *actual scope* — a tiny classic-NgRx slice for "current app," one SignalStore for the entire designer edit surface, and plain signals/RxJS for everything local — rather than forcing everything through one state paradigm.
- The extensibility system's lazy-loading-by-default posture (modules, widgets, plugins, translations all behind `() => import(...)`) genuinely keeps the initial bundle scoped to what a given user can access.
- The `CollectionService`/`AppCollectionService` + `EditingFormComponent` + `PaginatedTableComponent` trio makes new admin CRUD screens cheap and consistent — this is the single best-leveraged abstraction pair in the app.
- The design-token cascade with an actually-enforced deprecation lint (`lint:tokens`) — most design-token systems are documentation-only; this one has a CI-relevant guard rail.
- The `DESIGNER_STATE_STORE` token indirection over the concrete class is a small but real example of designing for the store's implementation to change without a 27-file refactor.

### Inconsistent patterns

- Component selector prefixing (`app-` vs `apw-`) is not standardized, even within one folder.
- Loading/error state has at least four different shapes in the wild (SignalStore booleans, a signal living beside — not inside — an NgRx reducer, a global RxJS `LoadingService`, a plain reducer `error` field) with no single house style.
- `RolesService.paginate()` duplicates most of `CollectionService.paginate()`'s logic instead of composing it — a sign of copy-then-modify rather than extend-then-override in at least one place.
- The `Observable` `$`-suffix convention is followed in some files and ignored in others.

### Legacy patterns

- `src/modules/elliot/` is the one place in the app where old structural directives (`*ngIf`/`*ngFor`/`*ngSwitch`) still appear — everywhere else has fully migrated to `@if`/`@for`/`@switch`. Treat this submodule as an older baseline, not as evidence of current conventions.
- `ConfigRoutingModule` (`config.routes.ts`) is a leftover `NgModule`-based route module coexisting with the standalone `routes` const used everywhere else.
- The RxJS lifecycle decorators (`@AutoUnsubscribe`, `@DebounceTime`, `@Delay`, `@WaitFor`) predate `takeUntilDestroyed()` and signals; they still exist and work, but new code should prefer `takeUntilDestroyed()` and signal-based reactivity instead of adopting these decorators further.
- The `LoadingService` global-counter-plus-`ReplaySubject` pattern predates the signals-based state style used in newer stores/components.
- `ts-cacheable`'s `@Cacheable` decorator is present in the dependency tree and even referenced (commented-out) in `CollectionService`, but caching is not actually active anywhere — a half-finished exploration, not a pattern to extend as-is.

### Modern patterns

- Signal-first component authoring: `input()`/`output()`/`model()`/`computed()`/`effect()`/`resource()`, `inject()` over constructor DI, native `#private` fields, `@if`/`@for`/`@switch`/`track` in every new template.
- `resource()` for signal-driven data fetching, replacing manual `subscribe()`-in-lifecycle-hook patterns.
- `takeUntilDestroyed()` for subscription teardown in place of manual `Subject`-based unsubscription.
- `@ngrx/signals` `signalStore` for the one piece of state that genuinely needed a rich, centralized, computed-heavy store (`DesignerStateStore`), while classic NgRx was deliberately *not* expanded to cover it.

---

## 27. Important files to study

| File | Purpose | Why it matters | What you learn from it |
| --- | --- | --- | --- |
| `src/app/app.config.ts` | Application bootstrap | Every global provider, interceptor, and third-party module bridge in one place | How standalone bootstrap composes classic NgModule-based libraries alongside `provide*()` functions |
| `src/app/app.routes.ts` | Root routing | Shows guard/resolver composition on parent routes and the app-shell split (`wrapper` vs `auth` vs `error`) | The canonical shape for a new top-level route tree |
| `src/app/core/services/extensibility.service.ts` | Facade over the module/widget/plugin system | The one deliberate facade in the app | What a well-scoped facade's public API looks like |
| `src/app/core/services/module-loader.service.ts` | Runtime module discovery + router splicing | Explains why extension-module routes aren't in `app.routes.ts` | `Router.resetConfig()`-based dynamic routing |
| `src/app/shared/stores/designer-state.store.ts` | The one `signalStore` in the app | Central to the entire designer experience | How to structure a large `@ngrx/signals` store (state/computed/methods split, no `rxMethod`) |
| `src/app/shared/tokens/designer-state-store.token.ts` | Token indirection for the store | Small file, big lesson | Why you'd inject a concrete singleton via a token instead of directly |
| `src/app/core/classes/base-widget.service.ts` | Widget contract base class | Every widget in the app extends this | Convention-based lazy loading + lifecycle hook design |
| `src/app/core/classes/collection.service.ts` (`core/services/collection.service.ts`) | Generic CRUD base | Backbone of nearly every feature service | The list/find/save/delete/exists contract and its pagination request/response shape |
| `src/app/core/services/app-collection.service.ts` | App-scoped CRUD base | Shows composition over `CollectionService` | How to layer a scoping concern onto a generic base without duplicating it |
| `src/app/shared/components/editing-form/editing-form.component.ts` | Generic edit-form base | The most-reused form abstraction | Signal inputs + `effect()`-driven patch-on-load + decorator-gated save |
| `src/app/shared/components/editing-form-in-modal/editing-form-in-modal.ts` | Modal variant of the above | Shows the modal/portal hosting seam | `PLUGIN_RUNTIME`/`MODAL_DATA_TOKEN` resolution pattern |
| `src/app/shared/v2/components/paginated-table/paginated-table.component.ts` | Generic list-page base | Backbone of every list page | `resource()`-based fetching + URL-synced filter/sort/page signals |
| `src/app/core/auth/interceptors/jwt.interceptor.ts` | Auth token attach + refresh | Best RxJS coordination example in the codebase | Single-flight refresh via `BehaviorSubject` queueing |
| `src/app/core/auth/services/auth.service.ts` | Auth state + flows | Full login/logout/refresh/permission story | Signal-based auth state, localStorage token handling |
| `src/app/core/auth/directives/with-roles.directive.ts` | Permission directive | Used throughout templates | Structural directive over a permission check |
| `src/app/shared/decorators/async-check-form-validity.decorator.ts` | Save-gating decorator | Used by essentially every save button | Decorator-based cross-cutting form behavior |
| `src/app/shared/decorators/confirm.decorator.ts` | Confirm-then-act decorator | Used by essentially every delete button | Decorator wrapping a modal + promise flow |
| `src/app/core/services/translations.service.ts` | i18n facade over Transloco | Used everywhere instead of `TranslocoService` directly | Static-facade-over-a-DI-service pattern, signal-driven language switching |
| `src/app/transloco-loader.service.ts` | i18n HTTP loader | Small but foundational | How translation JSON is actually fetched |
| `documentation/architecture/modules-widgets-plugins.md` | Extensibility architecture | Primary source of truth for the whole low-code system | The full initialization/creation/hook-execution flow |
| `documentation/architecture/page-designer.md` | Slot/page data model | Defines the structural rules for page composition | `GENERIC`/`TABS`/`TAB` composition rules |
| `documentation/extension-generation/annexes/stores-reference.md` | `DesignerStateStore` API reference | The critical-rule document for designer work | Full state/computed/method surface of the store |
| `documentation/design-system/theme-system.md` | Token layering model | Explains `ref → sys → component → container` | How to add or change a design token correctly |
| `src/definitions/app-structure/slot.ts` | Slot/page contract | Source of truth for the page tree shape | The actual TypeScript types behind the composition rules |
| `tsconfig.json` | Path aliases | Defines every `@x/*` import boundary | The module boundaries the whole codebase respects |

---

## 28. Final developer cheat sheet

### Architecture
- Two philosophies coexist: conventional CRUD admin screens, and a decorator-driven, lazily-loaded extensibility system (modules/widgets/plugins) for the low-code designer. Know which one you're in before you start.
- Always import across `src/app/core`, `src/app/shared`, `src/definitions`, `src/utils`, `src/widgets`, `src/plugins`, `src/modules` via the `@core/*`/`@shared/*`/`@definitions/*`/`@utils/*`/`@widgets/*`/`@plugins/*`/`@modules/*` aliases, not relative paths.

### Components
- Standalone, `inject()`, signal `input()`/`output()`/`model()`/`computed()`/`effect()`/`resource()`. Don't assume `OnPush` is set. New templates: `@if`/`@for` (with `track`)/`@switch` only — `*ngIf`/`*ngFor` mean you're looking at `src/modules/elliot` or dead code.

### State
- Global "current app/databases" → the two-slice classic NgRx store. Designer edit state → `DesignerStateStore` via `DESIGNER_STATE_STORE`. Everything else → local `signal()`/`computed()`, or `resource()` for fetches. Don't add a new classic-NgRx slice or a second `signalStore` without a strong reason — both are deliberately singular in this app.

### API
- Extend `CollectionService<T>`/`AppCollectionService<T>`; never hand-write `HttpClient` CRUD. Expect `paginate()` to swallow errors into an empty page. No response caching, no retry, no request cancellation exist today — don't assume them.

### Forms
- `UntypedFormBuilder` + `apw-*` controls from `@appolow/form`, bound with plain `formControlName`. Extend `EditingFormComponent`/`EditingFormInModal`/`EditingFormInPortal`. Gate submission with `@AsyncCheckFormValidity()`, dirty-dismiss with `@CheckFormDirt(...)`. Reuse validators in `shared/validators/` before writing a new one.

### UI
- List pages: extend `PaginatedTableComponent<T>` + the `.list-page__*` skeleton. Confirmations: `@Confirmable(...)`, never open `ConfirmDialogComponent` directly. Empty state: `apw-empty-list`. Notifications: the static `Toast` service.

### Styling
- Respect the `--appolow-ref-* → --appolow-sys-* → --appolow-{component}-* → --appolow-container-*` token cascade; never use raw `var(--bs-*)` or bare `var(--appolow-primary)`-style aliases — `npm run lint:tokens` will flag it. New global partials go in `src/styles/custom/` and get `@import`ed from `src/styles.scss`.

### Translation
- Keys: `<FEATURE>.<SECTION>.<ITEM>`, uppercase namespaces. Templates: `| transloco`. TypeScript: `Translations.instant()`/`Translations.watch()`, never `TranslocoService` directly. Extensions (module/widget/plugin) ship their own `assets/i18n/{en,es}.json`, not the global file.

### Routing
- Feature `x.routes.ts` exporting `routes: Routes`, composed via `children:`/`loadChildren:` into a parent. Resolvers: `id === 'add' ? of(null) : service.find(id).pipe(catchError(() => of(null)))`. Breadcrumbs via `data.breadcrumb` (string or `(data) => string`). Extension-module routes are spliced in at runtime by `ModuleLoaderService` — don't look for them in `app.routes.ts`.

### Permissions
- `[withRoles]`/`[withSomeRoles]` in templates, `rolesGuard`/`childRolesGuard` + `data.roles` on routes, `AuthService.hasPermits()`/`hasSomePermits()` in TypeScript. Remember the two-layer module permission model: `readPermission` (load-time) vs `canActivate` (navigation-time).

### Errors & notifications
- No global HTTP error handler exists — handle errors where they occur, via `Toast.error(...)`. Backend `error.message` is treated as a translation key. Destructive actions: `@Confirmable(...)`.

### Testing
- Vitest via `@angular/build:unit-test`. Pure functions/utils: no `TestBed`. Components: `TestBed` + `src/testing/providers/*` (Toast, Appolow forms, active modal) and `src/testing/i18n/transloco-testing.module.ts` — don't hand-mock these per spec.

### Before writing new code, check
- `src/app/shared/components/` (confirm dialog, empty state, loading block, icon selector/preview, editing-form variants) — full inventory in [§10](#10-ui-design-system--styling)/[§23](#23-existing-solutions-you-should-reuse).
- `src/app/shared/validators/{common,strings}/` — before writing a new validator.
- `src/app/shared/decorators/` — `@Confirmable`, `@AsyncCheckFormValidity`, `@CheckFormDirt` before hand-rolling that logic.
- `src/app/core/classes/` — `BaseWidgetService`/`BasePluginService`/`CollectionService`/`AppCollectionService` before writing a new service from scratch.
- `src/testing/providers/` and `src/testing/mocks/` — before hand-mocking Transloco/Toast/modals/the designer store in a spec.
- `documentation/` — especially `architecture/`, `extension-generation/`, `design-system/` — before touching anything designer-related; `AGENTS.md`'s critical rule about `DesignerStateStore` persistence is not optional guidance.
