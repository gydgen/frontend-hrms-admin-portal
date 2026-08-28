# Appolow Angular Component Library Architecture Review and Rebuild Guide

This document is grounded in the repository as inspected on 2026-08-28. It is not a generic Angular library tutorial. Every major observation points back to files in this repository.

## 1. Repository Overview

Current implementation:

This is an Angular CLI workspace, not an Nx workspace. The root project is a documentation/demo application named `library-test`, and the reusable UI ecosystem lives in multiple independent Angular library projects under `projects/`.

Evidence:

- `angular.json`
- `package.json`
- `tsconfig.json`
- `src/app/app.config.ts`
- `src/app/app.routes.ts`
- `projects/*/ng-package.json`
- `projects/*/package.json`

High-level shape:

```text
appolow-library/
+-- src/                         Demo/docs/showcase Angular app
+-- projects/                    Publishable Angular libraries
|   +-- form/                    Main form/control package: @appolow/form
|   +-- utils/                   Shared utilities: @appolow/utils
|   +-- modal/                   Modal service/window stack: @appolow/modal
|   +-- portal/                  Portal service/window stack: @appolow/portal
|   +-- paginable/               Table/list/pagination package: @appolow/paginable
|   +-- board/                   Kanban board package: @appolow/board
|   +-- accordion/               Accordion package: @appolow/accordion
|   +-- avatar/                  Avatar package: @appolow/avatar
|   +-- breadcrumbs/             Breadcrumb package: @appolow/breadcrumbs
|   +-- calendar/                Calendar package: @appolow/calendar
|   +-- sortable/                SortableJS Angular wrapper: @appolow/sortable
|   +-- stepper/                 Stepper/wizard package: @appolow/stepper
+-- docs/                        Repository-level docs
+-- scripts/                     Shell helper scripts
+-- dist/                        Build output
+-- .gitlab-ci.yml               GitLab build, deploy, publish workflow
+-- Dockerfile                   Demo app container build
+-- angular.json                 Angular CLI project registry and targets
+-- package.json                 Root scripts and workspace dependencies
+-- tsconfig.json                Workspace compiler options and path aliases
```

Major folder purposes:

| Folder | Purpose | Consumer-facing? | What belongs there | What should not belong there |
| --- | --- | --- | --- | --- |
| `projects/form` | Main form UI package with inputs, select, datepicker, textarea, fieldset, tabs, directives, pipes, validators, styles | Yes, published as `@appolow/form` | Public form controls, shared form base, form styles, validators, form directives | Demo-only examples, unrelated overlay services already in `utils` |
| `projects/utils` | Shared low-level utilities, pipes, i18n, overlay, popup, focus trap, scrollbar, transitions | Yes, published as `@appolow/utils` | Cross-package primitives used by modal/portal/paginable/calendar | Component-specific UI decisions |
| `projects/modal` | Modal facade, stack, ref, config, window and backdrop components | Yes, published as `@appolow/modal` | Modal service API and dynamic DOM lifecycle | General overlay primitives that should be shared |
| `projects/portal` | Dynamic portal service, ref, window, stack, toggle behavior | Yes, published as `@appolow/portal` | Dynamic container-rendered content APIs | Modal-specific naming and duplicated modal logic |
| `projects/paginable` | Table, list, paginator, dropdown, filters, i18n dictionaries | Yes, published as `@appolow/paginable` | Data grid/list components and table-specific directives | Generic i18n/overlay logic except via `utils` |
| `projects/board` | Standalone Kanban board with drag/drop, templates, models, CSS variables | Yes, published as `@appolow/board` | Board component, template directives, board models | CDK/global app docs |
| `projects/accordion` | Accordion and panel compound components | Yes, published as `@appolow/accordion` | Accordion components, panel header directive, collapse model, config service | App-specific routing/docs |
| `projects/avatar` | Avatar component with source strategies and source factory | Yes, published as `@appolow/avatar` | Avatar source strategies and config | General image loader unrelated to avatar |
| `projects/breadcrumbs` | Breadcrumb component, service, route-driven models/templates | Yes, published as `@appolow/breadcrumbs` | Breadcrumb navigation APIs | General router app setup |
| `projects/calendar` | Standalone calendar with views, event models, templates, i18n | Yes, published as `@appolow/calendar` | Calendar data model, templates, date view logic | Generic datepicker/form logic |
| `projects/sortable` | SortableJS wrapper directive/module | Yes, published as `@appolow/sortable` | Sortable binding logic and SortableJS type re-exports | Non-sortable drag/drop components |
| `projects/stepper` | Stepper and step compound components/directives | Yes, published as `@appolow/stepper` | Stepper flow, navigation slots, i18n | Global design-system foundation |
| `src/app` | Demo/docs/playground application | No npm library API | Documentation routes, examples, manual QA views | Library internals |
| `src/assets/docs` | Markdown docs rendered by the docs app | Consumer documentation, not package API | Component docs and usage examples | Source of truth for runtime code |
| `src/styles.scss` | Demo app global style imports and docs overrides | No, app-only | Demo-global theme/style imports | Library package styles that must ship independently |

## 2. Executive Architecture Overview

Current implementation:

The ecosystem is a multi-package Angular UI family. It does not have a single `core` package, but `@appolow/utils` partially fills that role. Each package has its own primary entry point and ng-packagr build.

Actual architectural layers:

```text
Consumer application
  -> Public package entry point
  -> Components, directives, services, types
  -> Shared utilities from @appolow/utils where adopted
  -> Angular forms, router, DI, browser DOM, third-party widgets
  -> CSS custom properties and SCSS component styles
```

Dependency direction:

```text
Application / docs app
  |
  +-- imports package APIs through tsconfig aliases
      |
      +-- @appolow/form
      |   +-- appolow form components
      |   +-- form directives, pipes, validators
      |   +-- ModuleConfigService
      |   +-- ng-select, ngx-daterangepicker-bootstrap, dayjs, Bootstrap styles
      |
      +-- @appolow/paginable
      |   +-- table/list/paginator/dropdown components
      |   +-- @appolow/utils translation and pipes
      |
      +-- @appolow/modal, @appolow/portal
      |   +-- @appolow/utils ContentRef, focus trap, scrollbar, transitions
      |
      +-- @appolow/board, accordion, calendar, stepper
          +-- mostly standalone signal-based components
```

Recommended implementation:

For a rebuild, make `@appolow/core` or strengthen `@appolow/utils` into an explicit core package. Put platform-safe DOM helpers, overlay primitives, i18n, tokens, focus management, and common type utilities there. Feature packages should depend on core, not on each other directly.

## 3. Angular Workspace Architecture

Current implementation:

- Workspace type: Angular CLI.
- Monorepo style: yes, because many libraries live in one repo.
- Nx: no `nx.json`, project tags, affected graph, or dependency constraints were found.
- Application: `library-test` rooted at `src`.
- Libraries: `form`, `board`, `portal`, `utils`, `modal`, `stepper`, `breadcrumbs`, `paginable`, `avatar`, `accordion`, `calendar`, `sortable`.
- Build executor: `@angular/build:ng-packagr` for libraries.
- App build executor: `@angular/build:application`.
- Tests: `@angular/build:karma`.

Evidence:

- `angular.json`
- `projects/form/ng-package.json`
- `projects/board/ng-package.json`
- `projects/paginable/ng-package.json`
- `projects/*/tsconfig.lib.prod.json`

Project boundaries are maintained by package folders and path aliases rather than by tooling constraints:

- `tsconfig.json` maps `@appolow/form` to `projects/form/src/public-api.ts`.
- Some library tsconfigs override `@appolow/utils` to `../../dist/utils`, meaning those packages are expected to build against the compiled utils package.
- CI builds packages in a fixed order: `utils accordion avatar board breadcrumbs calendar form modal paginable portal sortable stepper`.

Evidence:

- `tsconfig.json`
- `projects/modal/tsconfig.lib.json`
- `projects/portal/tsconfig.lib.json`
- `projects/paginable/tsconfig.lib.json`
- `.gitlab-ci.yml`

## 4. Package Architecture

Current implementation:

Each library becomes an npm package through ng-packagr:

```text
projects/<package>/src/public-api.ts
  -> ng-packagr entryFile
  -> dist/<package>
  -> package metadata from projects/<package>/package.json
  -> npm/GitLab package registry
  -> consumer imports from @appolow/<package>
```

Examples:

| Package | Name | Entry file | Output |
| --- | --- | --- | --- |
| `projects/form` | `@appolow/form` | `src/public-api.ts` | `dist/form` |
| `projects/utils` | `@appolow/utils` | `src/public-api.ts` | `dist/utils` |
| `projects/board` | `@appolow/board` | `src/public-api.ts` | `dist/board` |
| `projects/avatar` | `@appolow/avatar` | `src/public_api.ts` | `dist/avatar` |

Evidence:

- `projects/form/package.json`
- `projects/form/ng-package.json`
- `projects/avatar/ng-package.json`
- `projects/board/package.json`
- `projects/utils/ng-package.json`

Important package details:

- Most packages set `"sideEffects": false`, improving tree-shaking when imports are pure.
- `form` marks Bootstrap as a peer dependency and allows non-peer dependencies for `dayjs`, `@ng-select/ng-select`, and `ngx-daterangepicker-bootstrap`.
- `sortable` depends directly on `sortablejs` and re-exports SortableJS types from its public API.
- `modal`, `portal`, `paginable`, `calendar`, and `stepper` depend on `@appolow/utils`.
- There are no secondary entry points like `@appolow/form/input`; each package exposes a single package-level entry point.

Recommended implementation:

For PrimeNG-like scale, add secondary entry points once package size grows:

```text
@appolow/form/input
@appolow/form/select
@appolow/overlay
@appolow/tokens
```

Do this only after internal imports are cleaned so components do not import each other's private files.

## 5. Public API Strategy

Current implementation:

The public API is defined by `public-api.ts` or `public_api.ts`. Consumers should import from package root aliases:

```ts
import { AppolowInputComponent, AppolowLibraryModule } from '@appolow/form';
import { AppolowBoardComponent, CardTemplateDirective } from '@appolow/board';
import { AppolowModal } from '@appolow/modal';
import { TableComponent } from '@appolow/paginable';
```

API exposure map:

```text
@appolow/form
+-- AppolowLibraryModule
+-- AppolowSelectModule, AppolowDatepickerModule, AppolowDropdownModule
+-- AppolowInputComponent, AppolowSelectComponent, AppolowTextareaComponent
+-- AppolowDatepickerComponent, AppolowProgressBarComponent, AppolowSliderComponent
+-- AppolowButtonComponent, AppolowFieldsetComponent, appolow-tabs barrel
+-- Directives from lib/directives/index.ts
+-- Interfaces from lib/interfaces/index.ts
+-- Pipes and appolow-are-equal validator

@appolow/utils
+-- Focus trap, popup, scrollbar, transitions, util
+-- i18n provider/service/token
+-- overlay service/ref/position/config/types
+-- standalone utility pipes

@appolow/modal
+-- AppolowModal, AppolowModalModule, AppolowModalRef, AppolowActiveModal
+-- AppolowModalConfig, AppolowModalOptions, placement and dismiss reasons

@appolow/paginable
+-- TableComponent, ListComponent, PaginatorComponent, DropdownComponent
+-- table/list template directives
+-- interfaces, services, i18n dictionaries, enums

@appolow/board
+-- AppolowBoardComponent, BoardModule
+-- board template directives
+-- board/card/column models and drag-drop event utilities
```

Evidence:

- `projects/form/src/public-api.ts`
- `projects/utils/src/public-api.ts`
- `projects/modal/src/public-api.ts`
- `projects/paginable/src/lib/index.ts`
- `projects/board/src/public-api.ts`

Semi-public/internal leakage:

- `@appolow/utils` exports broad utilities including DOM helpers and `ContentRef`. That is useful for internal package sharing, but it exposes implementation detail to consumers.
- `@appolow/form` exports all interfaces through a barrel, which is good, but it also makes it easy to accidentally depend on internal configuration shapes.
- `@appolow/paginable` re-exports `AppolowTranslationService` from `@appolow/utils`, which couples table consumers to the shared translation implementation.

## 6. Representative Component Architecture

### Simple Component: `AppolowButtonComponent`

Current implementation:

Folder:

```text
projects/form/src/lib/components/appolow-button/
+-- appolow-button.component.ts
+-- appolow-button.component.html
+-- appolow-button.component.scss
+-- appolow-button.component.spec.ts
```

API:

- Selector: `apw-button`.
- Inputs: `config`, `disabled`.
- Internal state: `computed()` class list derived from variant, color, and size.
- Content projection: `<ng-content>`.
- Host binding: `class.apw-disabled`.
- Uses `ApwTooltipDirective`.
- Exposes `htmlElement`.

Evidence:

- `projects/form/src/lib/components/appolow-button/appolow-button.component.ts`
- `projects/form/src/lib/components/appolow-button/appolow-button.component.html`

Usage:

```html
<apw-button [config]="{ color: 'primary' }">Save</apw-button>
```

### Form Component: `AppolowInputComponent`

Current implementation:

Folder:

```text
projects/form/src/lib/components/appolow-input/
+-- appolow-input.component.ts
+-- appolow-input.component.html
+-- appolow-input.component.scss
+-- appolow-input.component.spec.ts
```

API:

- Selector: `apw-input`.
- Extends `AppolowFormControl`.
- Implements `ControlValueAccessor`.
- Uses signal inputs: `type`, `label`, `placeholder`, `min`, `max`, `disabled`, `required`, `append`, `prepend`, `formText`, `default`, `value`, `downloadLabel`.
- Outputs: `valueChange`, `enter`.
- Template customization: `apwFormText`, `apwButtonContent`, `apwValidationError`.
- Native validation support when not attached to Angular forms.
- Reactive forms integration through `NgControl` and `ControlContainer`.

Evidence:

- `projects/form/src/lib/components/appolow-input/appolow-input.component.ts`
- `projects/form/src/lib/components/appolow-input/appolow-input.component.html`
- `projects/form/src/lib/shared/appolow-form-control.ts`

Execution path:

```text
User types in native input
  -> template calls setValue($event)
  -> component normalizes value by input type
  -> native errors updated if no NgControl
  -> _value signal updates
  -> ControlValueAccessor onChange invoked
  -> valueChange output emitted
  -> template re-renders invalid/help/counter state
```

Usage:

```html
<apw-input
  type="email"
  label="Email"
  formControlName="email"
  [formText]="'We will only use this for notifications'"
>
  <ng-template apwValidationError key="email">
    This is not an email.
  </ng-template>
</apw-input>
```

### Overlay/Dropdown/Form Component: `AppolowSelectComponent`

Current implementation:

- Selector: `apw-select`.
- Wraps `NgSelectComponent` from `@ng-select/ng-select`.
- Implements `ControlValueAccessor`.
- Has multiple formats: dropdown, buttons, checkbox, radio.
- Supports content templates through `apwOption`, `apwLabel`, `apwMultiLabel`, `apwOptGroup`, `apwAddTag`.
- Outputs selection, search, add/remove, open/close/focus/blur, scroll events.

Evidence:

- `projects/form/src/lib/components/appolow-select/appolow-select.component.ts`
- `projects/form/src/lib/directives/apw-select-templates.directive.ts`
- `projects/form/package.json`

Usage:

```html
<apw-select
  label="Country"
  formControlName="country"
  [items]="countries"
  bindLabel="name"
  bindValue="id"
  [searchable]="true"
>
  <ng-template apwOption let-item>
    {{ item.name }}
  </ng-template>
</apw-select>
```

### Complex Stateful Component: `TableComponent`

Current implementation:

- Selectors: `appolow-table`, `appolow-ui-table`.
- Standalone.
- Implements `ControlValueAccessor` for row selection.
- Uses signal inputs/models for headers, filters, rows, page, perPage, totalItems, loading, search term, ordination.
- Bridges RxJS and signals with `toSignal`, `BehaviorSubject`, debounce, and custom `debouncedSignal`.
- Uses many template directives for headers, cells, filters, loading, errors, expanding rows, no-results state.

Evidence:

- `projects/paginable/src/lib/components/table/table.component.ts`
- `projects/paginable/src/lib/components/table/table.component.html`
- `projects/paginable/src/lib/utils.ts`
- `projects/paginable/src/lib/directives/*`

Execution path for filters:

```text
headers input
  -> fixedHeaders computed normalizes strings to objects
  -> headerFilters computed detects filterable columns
  -> initializeFilterFG creates FormGroup controls
  -> filtersFG.valueChanges converted to signal with debounce
  -> effect writes filters model
  -> consumer observes [(filters)] or reacts to model binding
```

### Content Projection Component: `AppolowBoardComponent`

Current implementation:

- Selectors: `appolow-board`, `appolow-ui-board`.
- Standalone.
- Input data model: `board`.
- Outputs: `onCardClick`, `onCardMoved`, `onColumnMoved`, `reachedEnd`.
- Template slots: card, column header/footer, placeholders, drag previews.
- Uses native HTML5 drag/drop, not Angular CDK.
- CSS variables are defined in component stylesheet, not required as global import.

Evidence:

- `projects/board/src/lib/components/board/board.component.ts`
- `projects/board/src/lib/components/board/board.component.html`
- `projects/board/src/lib/components/board/board.component.scss`
- `projects/board/src/lib/directives/card-template.directive.ts`

Execution path for card move:

```text
dragstart on card
  -> dragState signal stores source column/card and item
  -> dragover on target column computes drop index
  -> drop mutates source/target card arrays
  -> _columnsVersion signal forces recomputation
  -> onCardMoved emits CardDragDropEvent
```

### Shared Infrastructure Component: `AppolowModal`

Current implementation:

- Consumer injects `AppolowModal`.
- `open()` merges options with `AppolowModalConfig`.
- `AppolowModalStack` creates content, backdrop, window component, attaches them to body or configured container.
- `AppolowModalRef` exposes `result`, `closed`, `dismissed`, `hidden`, `shown`, `update`, `close`, `dismiss`.
- `AppolowModalWindow` handles DOM event streams, escape/backdrop behavior, focus restoration, and transitions.

Evidence:

- `projects/modal/src/lib/modal.ts`
- `projects/modal/src/lib/modal-stack.ts`
- `projects/modal/src/lib/modal-ref.ts`
- `projects/modal/src/lib/modal-window.ts`

Usage:

```ts
const ref = modal.open(EditUserDialogComponent, {
  title: 'Edit user',
  size: 'lg',
  backdrop: 'static',
  data: user
});
```

## 7. Component Design Pattern

Current implementation:

There is no single pattern used everywhere. The repository has three visible generations:

1. Modern standalone/signal components.
   Evidence: `projects/board/src/lib/components/board/board.component.ts`, `projects/calendar/src/lib/components/calendar/calendar.component.ts`, `projects/paginable/src/lib/components/table/table.component.ts`, `projects/accordion/src/lib/components/accordion/accordion.component.ts`.

2. Hybrid standalone components grouped by compatibility NgModules.
   Evidence: `projects/board/src/lib/board.module.ts`, `projects/paginable/src/lib/paginable.module.ts`, `projects/stepper/src/lib/stepper.module.ts`.

3. Older NgModule-first packages with service/factory patterns.
   Evidence: `projects/avatar/src/lib/avatar.module.ts`, `projects/form/src/lib/appolow-library.module.ts`.

Strong repeated patterns:

- Use signal `input()`, `model()`, `output()` for public APIs in newer code.
- Use content template marker directives for customization.
- Use BEM-style CSS classes such as `appolow-table__cell`, `appolow-board__card`, `appolow-input__control`.
- Use CSS custom properties as styling tokens.
- Use services for global/runtime APIs such as modal, portal, translation, pagination.

Recommended implementation:

Standardize on:

```text
Component
+-- public signal API: input/model/output
+-- typed config interfaces
+-- local signals/computed state
+-- template-slot marker directives
+-- optional ControlValueAccessor for form controls
+-- CSS variables in host or package style entrypoint
+-- behavior delegated to core utilities/services
+-- compatibility NgModule only when required
```

## 8. Standalone Components vs NgModules

Current implementation:

Both are used.

Standalone components:

- `AppolowBoardComponent`
- `AppolowCalendarComponent`
- `TableComponent`
- many board/paginable/form directives

Evidence:

- `projects/board/src/lib/components/board/board.component.ts`
- `projects/calendar/src/lib/components/calendar/calendar.component.ts`
- `projects/paginable/src/lib/components/table/table.component.ts`
- `projects/form/src/lib/directives/apw-validationError.directive.ts`

NgModules:

- `AppolowLibraryModule.forRoot()`
- `AvatarModule.forRoot()`
- `AppolowModalModule`
- `AppolowPortalModule`
- `BoardModule` compatibility wrapper
- `AppolowUITableModule.forRoot()`
- `StepperModule.forRoot()`

Evidence:

- `projects/form/src/lib/appolow-library.module.ts`
- `projects/avatar/src/lib/avatar.module.ts`
- `projects/modal/src/lib/modal.module.ts`
- `projects/portal/src/lib/portal.module.ts`
- `projects/board/src/lib/board.module.ts`
- `projects/paginable/src/lib/paginable.module.ts`
- `projects/stepper/src/lib/stepper.module.ts`

Recommendation:

For new work, follow the board/calendar/paginable direction: standalone components first, with optional NgModule wrappers only for legacy apps.

## 9. Signals and Reactive Architecture

Current implementation:

Signals are used heavily in newer components:

- `input()`: public component configuration.
- `model()`: two-way bindable state such as selected date, disabled, page, perPage, filters.
- `output()`: typed event emission.
- `signal()`: internal mutable state.
- `computed()`: derived state.
- `effect()`: synchronization with content children, forms, async setup, resize/selection wiring.

RxJS remains important for:

- DOM event streams.
- animation/transition lifecycle.
- translation update streams.
- forms `valueChanges`/`statusChanges`.
- modal/portal lifecycle.
- debouncing search/filter streams.

Decision table:

| Use case | Pattern used | Evidence | Why |
| --- | --- | --- | --- |
| Local component state | `signal()` | `board.component.ts`, `calendar.component.ts`, `table.component.ts` | Simple synchronous UI state |
| Derived view state | `computed()` | `TableComponent.fixedHeaders`, `CalendarComponent.weeks`, `BoardComponent.columns` | Recomputes declaratively when inputs change |
| Two-way input state | `model()` | `AppolowInputComponent.disabled`, `CalendarComponent.view`, `TableComponent.page` | Consumer can use banana-in-a-box binding |
| Form integration | CVA plus signals | `AppolowInputComponent`, `TableComponent`, `AccordionComponent` | Angular forms still require CVA |
| DOM streams | RxJS `fromEvent` | `modal-window.ts`, `focus-trap.ts`, `autoclose.ts` | Easier cleanup with `takeUntil` |
| Cross-component events | Services/subjects/EventEmitter | `AppolowModalStack`, `AppolowTranslationService` | Shared lifecycle beyond one component |
| Debounced inputs | RxJS plus signal bridge | `TableComponent.searchProxy$`, `debouncedSignal` | Existing form streams are Observable-based |

## 10. Dependency Injection Architecture

Current implementation:

DI appears in four patterns:

1. Root services with `providedIn: 'root'`.
   Evidence: `projects/modal/src/lib/modal.ts`, `projects/modal/src/lib/modal-stack.ts`, `projects/utils/src/lib/scrollbar.ts`, `projects/avatar/src/lib/avatar-config.service.ts`.

2. Module `forRoot()` providers.
   Evidence: `projects/form/src/lib/appolow-library.module.ts`, `projects/avatar/src/lib/avatar.module.ts`, `projects/paginable/src/lib/paginable.module.ts`, `projects/stepper/src/lib/stepper.module.ts`.

3. Injection tokens.
   Evidence: `projects/utils/src/lib/i18n/translation.tokens.ts`, `projects/avatar/src/lib/avatar-config.token.ts`, `projects/paginable/src/lib/services/paginate-config.service.ts`.

4. Direct `inject()` inside components/services.
   Evidence: `projects/modal/src/lib/modal-stack.ts`, `projects/calendar/src/lib/components/calendar/calendar.component.ts`, `projects/form/src/lib/components/appolow-input/appolow-input.component.ts`.

DI hierarchy examples:

```text
AppolowLibraryModule.forRoot(config)
  -> string token 'config'
  -> ModuleConfigService
  -> AppolowInputComponent / Select / Datepicker
```

```text
TableModule.forRoot(config)
  -> PaginableConfigService token
  -> PaginableService
  -> HUB_TRANSLATION_CONFIG factory
  -> AppolowTranslationService
  -> TranslatePipe / TableComponent
```

```text
AppolowModal
  -> AppolowModalConfig
  -> AppolowModalStack
  -> ScrollBar / focus trap / transitions
  -> AppolowModalRef
```

Recommendation:

Replace string tokens like `'config'` with typed `InjectionToken<ModuleConfig>`. Prefer `provideAppolowForm(config)` environment providers for standalone apps, while keeping `forRoot()` as a compatibility layer.

## 11. Global Library Configuration

Current implementation:

`@appolow/form` has global configuration:

- `AppolowLibraryModule.forRoot(config)`
- `AppolowLibraryModule.forChild(config)`
- `ModuleConfigService` merges defaults with user config.

Config values:

- `invalidFeedbackTemplateFn`
- `counterTemplateFn`
- `datepickerLocale`

Evidence:

- `projects/form/src/lib/appolow-library.module.ts`
- `projects/form/src/lib/services/module-config.service.ts`
- `projects/form/src/lib/interfaces/apw-module.interface.ts`
- `README.md`

`@appolow/avatar` has source/cache config:

- `AvatarModule.forRoot(avatarConfig)`
- `AVATAR_CONFIG`
- `AvatarConfigService`

Evidence:

- `projects/avatar/src/lib/avatar.module.ts`
- `projects/avatar/src/lib/avatar-config.token.ts`
- `projects/avatar/src/lib/avatar-config.service.ts`

`@appolow/paginable` has i18n/global table config:

- `TableModule.forRoot(config)`
- `PaginableConfigService`
- `HUB_TRANSLATION_CONFIG`

Evidence:

- `projects/paginable/src/lib/paginable.module.ts`
- `projects/utils/src/lib/i18n/translation.tokens.ts`

## 12. Styling Architecture

Current implementation:

The main styling technology is SCSS plus CSS custom properties.

`@appolow/form` uses a package style entrypoint:

```scss
@use './variables';
@use './input';
@use './select';
@use './textarea';
@use './datepicker';
@use './button';
@use './fieldset';
@use './progress';
@use './slider';
@use './tabs';
@use './tooltip';
@use './check';
@use './utilities';
```

Evidence:

- `projects/form/src/lib/styles/form.scss`
- `projects/form/src/lib/styles/_variables.scss`
- `projects/form/src/lib/styles/_config.scss`

`@appolow/board` uses component-scoped CSS variables in `:root, :host` and BEM selectors.

Evidence:

- `projects/board/src/lib/components/board/board.component.scss`
- `projects/board/docs/css-variables-reference.md`

The demo app imports Bootstrap, contextmenu styles, form styles, theme files, CDK overlay styles, Font Awesome, toastr and Quill assets.

Evidence:

- `src/styles.scss`
- `angular.json`

Recommended styling architecture:

```text
Primitive tokens
  -> semantic tokens
  -> component tokens
  -> component BEM classes
  -> theme scopes
```

## 13. Theme Architecture

Current implementation:

The form package has theme partials that override CSS variables under theme classes:

- `.appolow-form--theme-platform`
- `.appolow-form.theme-platform`
- `.appolow-form--theme-deployed-app`
- `.appolow-form.theme-deployed-app`

Evidence:

- `projects/form/src/lib/styles/themes/platform/platform.scss`
- `projects/form/src/lib/styles/themes/deployed-app/deployed-app.scss`
- `README.md`

The root demo app also has app-specific theme files:

- `src/styles/themes/nebula.scss`
- `src/styles/themes/aurora.scss`
- `src/styles/themes/seaglass.scss`
- `src/styles/themes/facet.scss`
- `src/app/app.component.ts` sets `data-theme`.

Recommendation:

Keep CSS-variable theming, but separate shipped package themes from demo-only app themes. Add a formal theme contract:

```text
tokens/
+-- primitives.css
+-- semantic.css
+-- components/form.css
+-- components/board.css
themes/
+-- appolow-light.css
+-- appolow-dark.css
+-- deployed-app.css
```

## 14. Design Tokens

Current implementation:

Token categories found:

- Core: body color/bg, border width/color/radius, focus ring.
- Input/select/textarea/date picker/button/check/tabs/tooltip/progress/slider/fieldset tokens.
- Board component tokens, including reference tokens (`--appolow-ref-*`) and semantic tokens (`--appolow-sys-*`).
- Modal-specific tokens in modal styles.

Evidence:

- `projects/form/src/lib/styles/_variables.scss`
- `docs/form-variables.md`
- `projects/board/src/lib/components/board/board.component.scss`
- `projects/board/docs/css-variables-reference.md`
- `projects/modal/src/lib/modal.scss`

Recommended implementation:

Promote the board's reference/semantic/component split across the ecosystem. `@appolow/form` currently mixes primitive values and component tokens in one large `_variables.scss`; that is practical, but harder to scale.

## 15. Icons

Current implementation:

Icon support is mixed:

- CSS custom properties with inline SVG data URLs for form icons.
- Font Awesome assets loaded by the demo app.
- `AppolowIconComponent` in `paginable`.
- Inline SVG in table loading/error templates.
- Icon class strings in table actions.

Evidence:

- `projects/form/src/lib/styles/_variables.scss`
- `angular.json`
- `src/assets/fontawesome`
- `projects/paginable/src/lib/components/icon/icon.component.ts`
- `projects/paginable/src/lib/components/table/table.component.html`

Recommendation:

Create one icon policy:

- CSS-mask/data-url icons for internal control affordances.
- Public icon component or icon class config for consumer-provided icons.
- Avoid hard-coded inline SVG in default table loading/error states; convert them to tokenized/icon-component renderers.

## 16. Overlay Architecture

Current implementation:

There are three overlay-like implementations:

1. Generic overlay service in `@appolow/utils`.
2. Tooltip popup implementation in `@appolow/form`.
3. Full modal/portal stack implementations in `@appolow/modal` and `@appolow/portal`.

Generic overlay flow:

```text
OverlayService.create(config)
  -> OverlayRef
  -> create container/backdrop in document.body
  -> attach TemplateRef or component
  -> apply OverlayPosition
  -> detach/dispose cleanup
```

Evidence:

- `projects/utils/src/lib/overlay/overlay-service.ts`
- `projects/utils/src/lib/overlay/overlay-ref.ts`
- `projects/utils/src/lib/overlay/overlay-position.ts`

Tooltip flow:

```text
Host element with [apwTooltip]
  -> listenToTriggers()
  -> PopupService creates ApwTooltipWindow
  -> optional appendTo body
  -> positioning utility creates popper
  -> apwAutoClose wires outside/inside/Escape closing
  -> aria-describedby added/removed
```

Evidence:

- `projects/form/src/lib/directives/apw-tooltip/apw-tooltip.ts`
- `projects/form/src/lib/utils/popup.ts`
- `projects/form/src/lib/utils/positioning.ts`
- `projects/form/src/lib/utils/autoclose.ts`
- `projects/form/src/lib/utils/triggers.ts`

Modal flow:

```text
Consumer calls AppolowModal.open(content, options)
  -> AppolowModal merges AppolowModalConfig defaults
  -> AppolowModalStack resolves container
  -> hides scrollbar
  -> creates active modal context
  -> creates content from component, TemplateRef, or string
  -> creates backdrop and modal window
  -> attaches views to ApplicationRef and DOM
  -> focus trap + aria-hidden sibling isolation
  -> AppolowModalRef controls close/dismiss/update
  -> transitions complete
  -> DOM nodes and views destroyed
```

Evidence:

- `projects/modal/src/lib/modal.ts`
- `projects/modal/src/lib/modal-stack.ts`
- `projects/modal/src/lib/modal-window.ts`
- `projects/modal/src/lib/modal-ref.ts`
- `projects/utils/src/lib/focus-trap.ts`
- `projects/utils/src/lib/scrollbar.ts`

Recommended implementation:

Unify modal, portal, dropdown, tooltip, and future select/autocomplete positioning around one overlay package. The current duplication between modal and portal is substantial and should become configurable shared infrastructure.

## 17. Form Control Architecture

Current implementation:

Form controls share a base class:

- `AppolowFormControl` implements `OnInit`, `AfterContentInit`, `OnDestroy`.
- Adds `formControlName`, `required`, `hidden`.
- Adds show/hide/toggle methods to the underlying form control object.
- Detects required validators from reactive forms and updates `required`.

Evidence:

- `projects/form/src/lib/shared/appolow-form-control.ts`
- `README.md`

Control components implement CVA:

- `AppolowInputComponent`
- `AppolowSelectComponent`
- `AppolowTextareaComponent`
- `AppolowDatepickerComponent`
- `AccordionComponent`
- `TableComponent`

Evidence:

- `projects/form/src/lib/components/appolow-input/appolow-input.component.ts`
- `projects/form/src/lib/components/appolow-select/appolow-select.component.ts`
- `projects/form/src/lib/components/appolow-datepicker/appolow-datepicker.component.ts`
- `projects/accordion/src/lib/components/accordion/accordion.component.ts`
- `projects/paginable/src/lib/components/table/table.component.ts`

Recommended implementation:

Preserve the shared base idea, but avoid mutating Angular `AbstractControl` instances with `show`, `hide`, and `toggle`. Prefer an exported directive/service or a typed wrapper API so consumer forms remain predictable.

## 18. Accessibility Architecture

Current implementation:

Positive patterns:

- Modal host sets `role="dialog"`, `aria-modal`, `aria-labelledby`, `aria-describedby`, `tabindex="-1"`.
- Modal/portal stacks hide non-active siblings with `aria-hidden`.
- Focus trap utility supports Tab/Shift+Tab cycling.
- Modal restores focus to the previously focused element.
- Tooltip adds/removes `aria-describedby`.
- Accordion panel handles ArrowUp/ArrowDown/Home/End/Space/Enter.
- Inputs use labels with `[for]="id"`, native `required`, disabled, readonly, validation feedback.
- Table search has translated `aria-label`.

Evidence:

- `projects/modal/src/lib/modal-window.ts`
- `projects/modal/src/lib/modal-stack.ts`
- `projects/utils/src/lib/focus-trap.ts`
- `projects/form/src/lib/directives/apw-tooltip/apw-tooltip.ts`
- `projects/accordion/src/lib/components/accordion-panel/accordion-panel.component.ts`
- `projects/form/src/lib/components/appolow-input/appolow-input.component.html`
- `projects/paginable/src/lib/components/table/table.component.html`

Gaps:

- Board drag/drop is mouse/native drag focused and does not expose keyboard drag interactions.
- Table sortable buttons lack explicit `aria-sort` on headers.
- Some icon-only buttons do not consistently expose labels.
- Direct DOM query focus logic is repeated.

## 19. Template and Content Projection Architecture

Current implementation:

The library uses a strong template-slot directive pattern:

- Form error templates: `apwValidationError`.
- Form text: `apwFormText`.
- Select templates: `apwOption`, `apwOptGroup`, `apwLabel`, `apwMultiLabel`, `apwAddTag`.
- Board templates: `cardTpt`, `columnHeaderTpt`, `columnFooterTpt`, `cardPlaceholder`, `columnPlaceholder`, drag previews.
- Table templates: cell, row, header, filter, no results, loading, error, expanding rows.
- Calendar templates: event and day cell templates.
- Accordion panel header template.
- Stepper navigation and button slots.

Evidence:

- `projects/form/src/lib/directives/apw-select-templates.directive.ts`
- `projects/form/src/lib/directives/apw-validationError.directive.ts`
- `projects/board/src/lib/directives/card-template.directive.ts`
- `projects/paginable/src/lib/directives/*`
- `projects/calendar/src/lib/directives/*`
- `projects/accordion/src/lib/directives/accordion-panel-header.directive.ts`
- `projects/stepper/src/lib/stepper-nav.directive.ts`

Recommendation:

This is one of the best patterns in the repo. Standardize directive names and contexts in documentation so every complex component has predictable slot names and `let-*` variables.

## 20. Directives

Important directive categories:

| Category | Examples | Evidence |
| --- | --- | --- |
| Template markers | `apwValidationError`, `apwOption`, `cardTpt`, `cellTpt`, `eventTpt` | `projects/form/src/lib/directives`, `projects/board/src/lib/directives`, `projects/paginable/src/lib/directives` |
| Behavior directives | `apwAutoresizable`, `apwLoadingButton`, `apwTooltip`, `apwOnEllipsis` | `projects/form/src/lib/directives` |
| Compound component helpers | accordion panel header, stepper buttons/nav | `projects/accordion/src/lib/directives`, `projects/stepper/src/lib` |
| External integration | `SortableDirective` | `projects/sortable/src/lib/sortable.directive.ts` |

Why directives exist:

- Template marker directives let components discover custom templates without hard-coding content order.
- Behavior directives allow host element enhancements without requiring new components.
- Compound directives let parent components coordinate projected child structure.

## 21. Services

Service inventory:

| Service | Responsibility | Scope | Evidence |
| --- | --- | --- | --- |
| `ModuleConfigService` | Form defaults for validation/counter/datepicker locale | Module provider | `projects/form/src/lib/services/module-config.service.ts` |
| `AppolowModal` | Public modal facade | root | `projects/modal/src/lib/modal.ts` |
| `AppolowModalStack` | Dynamic modal creation, stacking, focus, scroll, cleanup | root | `projects/modal/src/lib/modal-stack.ts` |
| `AppolowModalConfig` | Modal defaults | root | `projects/modal/src/lib/modal-config.ts` |
| `AppolowPortalStack` | Portal creation/toggle lifecycle | root | `projects/portal/src/lib/portal-stack.ts` |
| `OverlayService` | Generic overlay creation | root | `projects/utils/src/lib/overlay/overlay-service.ts` |
| `ScrollBar` | Hide body scrollbar and compensate padding | root | `projects/utils/src/lib/scrollbar.ts` |
| `AppolowTranslationService` | Dictionary selection and translation lookup | provider configured | `projects/utils/src/lib/i18n/translation.service.ts` |
| `PaginationService` | Local search/sort/pagination | root | `projects/paginable/src/lib/services/pagination.service.ts` |
| `PaginableService` | Paginable configuration | module provider | `projects/paginable/src/lib/services/paginable.service.ts` |
| `AvatarService` | Avatar source priority, failure tracking, colors, fetch | root/module | `projects/avatar/src/lib/avatar.service.ts` |
| `SourceFactory` | Avatar source strategy creation | root | `projects/avatar/src/lib/sources/source.factory.ts` |
| `BreadcrumbsService` | Route breadcrumb generation | root | `projects/breadcrumbs/src/lib/services/breadcrumbs.service.ts` |

## 22. Utility Layer

Current utility groups:

```text
projects/utils/src/lib/
+-- util.ts
+-- focus-trap.ts
+-- popup.ts
+-- scrollbar.ts
+-- transitions/
+-- overlay/
+-- i18n/
+-- pipes/

projects/form/src/lib/utils/
+-- utils.ts
+-- util.ts
+-- popup.ts
+-- positioning.ts
+-- autoclose.ts
+-- focus-trap.ts
+-- rtl.ts
+-- transition/

projects/paginable/src/lib/
+-- utils.ts
+-- utils/icons.ts
```

Evidence:

- `projects/utils/src/lib/public-api.ts`
- `projects/form/src/lib/utils/*`
- `projects/paginable/src/lib/utils.ts`

Weakness:

There is duplicated utility responsibility between `projects/utils` and `projects/form/src/lib/utils`. Tooltip has its own popup/positioning/autoclose utilities instead of using the generic `@appolow/utils` overlay everywhere.

Recommendation:

Promote one `core/utils` or `@appolow/utils` structure:

```text
utils/
+-- dom/
+-- platform/
+-- forms/
+-- objects/
+-- arrays/
+-- i18n/
+-- overlay/
+-- a11y/
+-- signals/
```

## 23. Base Classes and Inheritance

Current implementation:

Inheritance is used mainly for form controls:

```text
AppolowFormControl
  -> AppolowInputComponent
  -> AppolowSelectComponent
  -> AppolowTextareaComponent
  -> AppolowDatepickerComponent
```

Evidence:

- `projects/form/src/lib/shared/appolow-form-control.ts`
- `projects/form/src/lib/components/appolow-input/appolow-input.component.ts`
- `projects/form/src/lib/components/appolow-select/appolow-select.component.ts`
- `projects/form/src/lib/components/appolow-datepicker/appolow-datepicker.component.ts`

Most other packages prefer composition and services.

Recommendation:

Keep inheritance for narrow form lifecycle code only. Use composition for overlay, i18n, focus, option normalization, and template-slot registries.

## 24. Interfaces, Types, and Enums

Current implementation:

Types live near each package:

- Form interfaces in `projects/form/src/lib/interfaces`.
- Board models in `projects/board/src/lib/models`.
- Calendar models in `projects/calendar/src/lib/models`.
- Paginable interfaces/enums/constants in `projects/paginable/src/lib/interfaces`, `enums`, `constants`.
- Modal config/ref placement types in `projects/modal/src/lib`.

Evidence:

- `projects/form/src/lib/interfaces/index.ts`
- `projects/board/src/lib/models/drag-drop-event.ts`
- `projects/calendar/src/lib/models/calendar-view.ts`
- `projects/paginable/src/lib/interfaces`
- `projects/modal/src/lib/modal-config.ts`

Recommendation:

Use this rule:

- Consumer config/event/data types live beside the component or in package `models`.
- Cross-package types live in core.
- Internal-only interfaces stay in the component file or an `internal/` folder and are not exported.

## 25. Naming Conventions

Observed conventions:

| Concern | Current convention | Evidence |
| --- | --- | --- |
| Package names | `@appolow/<feature>` | `projects/*/package.json` |
| Component selectors | `appolow-*`, `appolow-ui-*`, older `apw-*` | board, table, form components |
| Form component classes | `AppolowInputComponent`, `AppolowSelectComponent` | `projects/form/src/lib/components` |
| Form selectors | `apw-input`, `apw-select`, `apw-button` | `projects/form/src/lib/components/*` |
| CSS classes | BEM-like `appolow-block__element--modifier` | form, board, table styles |
| CSS variables | `--appolow-<component>-<token>` | form variables, board styles |
| Template directive names | short slot names: `cardTpt`, `cellTpt`; form uses `apw*` | board/paginable/form directives |
| Outputs | mixed: `onCardMoved`, `eventClick`, `valueChange`, `onSearch` | board/calendar/form/paginable |

Recommendation:

Normalize new APIs:

- Selectors: prefer `appolow-*` and keep `apw-*` as backwards compatibility aliases if needed.
- Outputs: avoid `on*` prefix for new Angular outputs, use `cardMoved`, `columnMoved`, `search`, `opened`, `closed`.
- CSS: keep BEM plus `--appolow-*` tokens.

## 26. State Management

Current implementation:

- No NgRx or global store.
- State is local to components with signals and plain fields.
- Shared service state exists for modal/portal stacks, translation dictionaries, source failure cache, paginator configuration.
- Demo app stores theme in `sessionStorage`.

Evidence:

- `projects/board/src/lib/components/board/board.component.ts`
- `projects/calendar/src/lib/components/calendar/calendar.component.ts`
- `projects/paginable/src/lib/components/table/table.component.ts`
- `projects/modal/src/lib/modal-stack.ts`
- `projects/utils/src/lib/i18n/translation.service.ts`
- `src/app/app.component.ts`

Recommended implementation:

Continue avoiding a global store in the library. Component libraries should expose state through inputs/models/outputs and services, not own application state.

## 27. Event Architecture

Current implementation:

- Newer components use `output<T>()`.
- Older parts still use `EventEmitter`.
- Modal/portal refs expose Promises and Observables.
- DOM events are bridged to Angular outputs or service methods.

Evidence:

- `projects/board/src/lib/components/board/board.component.ts`
- `projects/calendar/src/lib/components/calendar/calendar.component.ts`
- `projects/modal/src/lib/modal-ref.ts`
- `projects/form/src/lib/directives/apw-tooltip/apw-tooltip.ts`

Recommendation:

Use typed event interfaces for domain events, especially for board/table/calendar. Keep direct DOM event names internal.

## 28. Internationalization

Current implementation:

There are two i18n systems:

1. Demo app uses `@ngx-translate/core`.
   Evidence: `src/app/app.config.ts`, `src/assets/i18n/en.json`, `src/assets/i18n/es.json`.

2. Library utilities provide `AppolowTranslationService` with `HUB_TRANSLATION_CONFIG`.
   Evidence: `projects/utils/src/lib/i18n/translation.service.ts`, `translation.provider.ts`, `translation.tokens.ts`.

Paginable and stepper ship language dictionaries:

- `projects/paginable/src/lib/assets/i18n/*.ts`
- `projects/stepper/src/lib/assets/i18n/*.ts`

Calendar ships static dictionary data:

- `projects/calendar/src/lib/i18n/calendar-i18n.ts`

Recommendation:

Unify library i18n under `@appolow/utils` or `@appolow/core/i18n`, and keep demo app `ngx-translate` separate unless the library deliberately integrates with it.

## 29. RTL Support

Current implementation:

- Table supports RTL through `options().rtl` and host class `appolow-table--rtl`.
- Form has an `RtlService`.
- Overlay positioning and modal placement are not systematically direction-aware.

Evidence:

- `projects/paginable/src/lib/components/table/table.component.ts`
- `projects/form/src/lib/utils/rtl.ts`
- `projects/modal/src/lib/modal-placement.ts`

Recommendation:

Create one directionality service/token. Use logical CSS properties where possible. Make overlay placement map `start/end` based on direction.

## 30. Responsive Architecture

Current implementation:

- Angular app has production budgets including `anyComponentStyle`.
- Table has responsive breakpoint options.
- Modal has fullscreen breakpoint options.
- Styles rely mostly on CSS/Bootstrap utilities.

Evidence:

- `angular.json`
- `projects/paginable/src/lib/constants/breakpoints.ts`
- `projects/paginable/src/lib/components/table/table.component.ts`
- `projects/modal/src/lib/modal-config.ts`
- `projects/modal/src/lib/modal-window.ts`

Weakness:

The table `responsiveCSSClass` computed appears to return `'table-responsive-' + this.responsive` instead of calling `this.responsive()`, so it may generate the wrong class string.

Evidence:

- `projects/paginable/src/lib/components/table/table.component.ts`

## 31. Animation Architecture

Current implementation:

- Modal/portal/tooltip use transition helpers from `@appolow/utils` and form utilities.
- Table uses Angular animations for expanding rows.
- Board uses CSS keyframes for placeholder fade-in.

Evidence:

- `projects/utils/src/lib/transitions/transition.ts`
- `projects/form/src/lib/utils/transition/ngbTransition.ts`
- `projects/modal/src/lib/modal-window.ts`
- `projects/paginable/src/lib/components/table/table.component.ts`
- `projects/board/src/lib/components/board/board.component.scss`

Recommendation:

Keep a single transition utility and avoid duplicate copies in `form` and `utils`.

## 32. Testing Architecture

Current implementation:

Testing uses Karma/Jasmine and Angular TestBed.

Spec counts by package:

| Package | Spec count |
| --- | ---: |
| `accordion` | 2 |
| `avatar` | 3 |
| `board` | 6 |
| `breadcrumbs` | 3 |
| `form` | 11 |
| `modal` | 5 |
| `paginable` | 20 |
| `portal` | 4 |
| `sortable` | 7 |
| `stepper` | 1 |
| `utils` | 8 |

Evidence:

- `projects/*/**/*.spec.ts`
- `projects/board/src/lib/components/board/board.component.spec.ts`
- `projects/portal/src/lib/portal-stack.spec.ts`
- `projects/form/src/lib/components/appolow-input/appolow-input.component.spec.ts`

Quality varies:

- `board` has behavioral tests for rendering, outputs, drag/drop moves, and scroll-end detection.
- `portal-stack` has concurrency tests for `toggle()`.
- `sortable` has extensive directive tests.
- `form` has several smoke tests; `AppolowInputComponent` spec only asserts creation and uses `declarations` even though the component has `imports`, which is likely stale for standalone/hybrid Angular patterns.

Recommended testing checklist:

- Component creation.
- Public inputs, defaults, transforms.
- Outputs and event payloads.
- Forms CVA behavior: `writeValue`, `registerOnChange`, disabled/touched/validation.
- Keyboard interactions and ARIA attributes.
- Template slots and contexts.
- Theme token presence.
- Overlay cleanup and focus restoration.
- SSR/browser-API guard behavior.
- Memory cleanup for subscriptions/listeners.

## 33. Documentation Architecture

Current implementation:

The docs app routes map each docs page to a Markdown asset under `src/assets/docs`. `DocsComponent` loads the markdown via `HttpClient`, parses it with `marked`, and renders HTML through `[innerHTML]`.

Evidence:

- `src/app/app.routes.ts`
- `src/app/docs/docs.component.ts`
- `src/app/docs/docs.component.html`
- `src/assets/docs/*.md`

There are also package READMEs and docs:

- `projects/board/README.md`
- `projects/board/docs/css-variables-reference.md`
- `projects/paginable/docs/css-variables-reference.md`
- `projects/calendar/docs/css-variables-reference.md`
- `projects/modal/docs/css-variables-reference.md`
- `projects/avatar/docs/css-variables-reference.md`

Recommended implementation:

Keep docs close to packages and generate/copy them into the docs app. Avoid duplicating package truth between `src/assets/docs` and package READMEs without a generation workflow.

## 34. Demo / Showcase Application

Current implementation:

The root `library-test` app is both docs and playground.

Roles:

- Manual QA.
- Markdown documentation rendering.
- Example pages for each component.
- Playground pages for live experimentation.
- Deployment artifact via Docker/Nginx.

Evidence:

- `src/app/app.routes.ts`
- `src/app/examples`
- `src/app/playground`
- `Dockerfile`
- `.gitlab-ci.yml`

## 35. Build Process

Current implementation:

Root scripts:

```json
"start": "ng serve",
"build": "ng build",
"test": "ng test",
"build_lib": "ng build form",
"pack_lib": "ng build form && cd dist/form && npm pack",
"docs:form-vars": "node scripts/generate-form-variables-doc.js"
```

Evidence:

- `package.json`

Library build:

```text
ng build <package>
  -> angular.json target
  -> @angular/build:ng-packagr
  -> projects/<package>/ng-package.json
  -> projects/<package>/tsconfig.lib.prod.json
  -> partial Angular compilation
  -> dist/<package>
```

Weakness:

The root script `docs:form-vars` references `scripts/generate-form-variables-doc.js`, but that file was not present. Existing scripts are `scripts/klepto-commander.cmd`, `scripts/klepto-commander.sh`, and `scripts/repo-heist.sh`.

## 36. Publishing Process

Current implementation:

GitLab CI publishes packages on `main` when `.gitlab-ci.yml` or `projects/**/*` changes.

Flow:

```text
main branch change
  -> publish job
  -> create .npmrc if missing
  -> for each package in fixed list
  -> read package name/version
  -> npm view published versions
  -> npm i -f
  -> npm i projects/<package>/ -f
  -> npx ng build <package>
  -> npm pack
  -> npm publish tgz to GitLab registry if version missing
```

Evidence:

- `.gitlab-ci.yml`

Weaknesses:

- `npm i -f` runs inside every package loop, making CI slow.
- Versioning is manual through package.json version fields.
- The fixed package list encodes dependency order manually.
- The GitLab scope validation requires package names to match `$CI_PROJECT_ROOT_NAMESPACE`, which must be `appolow` for current package names.

## 37. Versioning Strategy

Current implementation:

Versioning is manual semver-like package versions. No Changesets, semantic-release, release-it, or conventional commit automation was found.

Evidence:

- `projects/*/package.json`
- `.gitlab-ci.yml`

Recommendation:

Adopt Changesets or semantic-release for multi-package versioning, with explicit dependency bumping when `@appolow/utils` changes.

## 38. CI/CD

Current implementation:

GitLab CI has:

- `publish` job for packages.
- `library-test-build` job that builds a Docker image.
- `library-test-deploy` job that updates a remote compose file and redeploys.

Evidence:

- `.gitlab-ci.yml`
- `Dockerfile`

There are no first-party GitHub Actions in `.github`.

## 39. Tree-Shaking and Bundle Size

Current implementation:

Strengths:

- Package-level `"sideEffects": false`.
- Standalone components allow direct imports.
- ng-packagr outputs Angular Package Format.

Risks:

- Single entry point per package means consumers import from broader package roots, not secondary entry points.
- `@appolow/form` exposes and ships wrappers around `ng-select`, `ngx-daterangepicker-bootstrap`, `dayjs`, and Bootstrap assumptions.
- `src/styles.scss` demo imports many vendor styles globally.
- `@appolow/paginable` public API exports nearly all of `./lib`.

Evidence:

- `projects/*/package.json`
- `projects/form/src/public-api.ts`
- `projects/paginable/src/public-api.ts`
- `src/styles.scss`

## 40. Performance

Current implementation:

Positive patterns:

- Signals and computed values in newer components.
- Table debounces filters/search.
- Table supports virtual scroll through select and pagination workflows.
- Board uses native drag/drop and track functions.
- Modal event listeners run outside Angular zone.

Evidence:

- `projects/paginable/src/lib/components/table/table.component.ts`
- `projects/form/src/lib/components/appolow-select/appolow-select.component.ts`
- `projects/board/src/lib/components/board/board.component.ts`
- `projects/modal/src/lib/modal-window.ts`

Risks:

- Deep equality using `JSON.stringify` appears in selection comparisons.
- Board mutates input arrays and uses `_columnsVersion` to force recomputation.
- Direct DOM query operations appear in drag/drop and overlay code.
- Many components omit explicit `ChangeDetectionStrategy.OnPush`, though signal components still benefit from Angular reactivity.

## 41. SSR and Browser Compatibility

Current implementation:

There are browser-only assumptions:

- `document.createElement`, `document.body`, `document.querySelector`.
- `window.innerWidth`, `window.getComputedStyle`, `window.matchMedia`.
- `localStorage` in old paginable view service.
- Direct `document.activeElement`.

Evidence:

- `projects/utils/src/lib/overlay/overlay-ref.ts`
- `projects/utils/src/lib/overlay/overlay-position.ts`
- `projects/utils/src/lib/scrollbar.ts`
- `projects/modal/src/lib/modal-window.ts`
- `projects/modal/src/lib/modal-stack.ts`
- `projects/calendar/src/lib/components/calendar/calendar.component.ts`
- `projects/avatar/src/lib/sources/gravatar.ts`
- `projects/paginable/src/lib/service/views.service.ts`

Recommendation:

Add platform guards around browser-only behavior:

```ts
const platformId = inject(PLATFORM_ID);
if (!isPlatformBrowser(platformId)) return;
```

Use injected `DOCUMENT` consistently rather than global `document`.

## 42. Security Considerations

Current implementation:

Potential risk areas:

- Markdown docs are parsed with `marked` and rendered through `[innerHTML]`.
- Form invalid feedback renders configured strings through `[innerHTML]`.
- Safe URL pipe bypasses Angular security for resource URLs.
- Avatar uses `bypassSecurityTrustUrl` for generated source URLs after some sanitization.
- Modal/portal allow string content, but they use `createTextNode`, which is safer than injecting HTML.

Evidence:

- `src/app/docs/docs.component.ts`
- `src/app/docs/docs.component.html`
- `projects/form/src/lib/components/appolow-input/appolow-input.component.html`
- `projects/form/src/lib/pipes/appolow-safe-url.pipe.ts`
- `projects/avatar/src/lib/avatar.component.ts`
- `projects/modal/src/lib/modal-stack.ts`

Recommendation:

Document trust boundaries. If consumers can pass HTML-returning functions, mark them as trusted HTML hooks and offer a plain-text default path.

## 43. How a New Component Is Added

Current implementation workflow, based on this repo:

1. Choose package.
   - Form control: `projects/form/src/lib/components`.
   - Data/display widget: likely its own package under `projects/<name>`.
   - Shared utility: `projects/utils/src/lib`.

2. Create component folder.
   - Example: `projects/form/src/lib/components/appolow-input`.
   - Example: `projects/board/src/lib/components/board`.

3. Define public API.
   - Component class with signal inputs/outputs.
   - Interfaces in package `interfaces` or `models`.
   - Template slot directives if customization is needed.

4. Implement component template and styles.
   - Use BEM classes.
   - Add CSS custom properties.
   - Use native semantics and ARIA.

5. Add form integration if needed.
   - Extend `AppolowFormControl`.
   - Implement CVA.
   - Add validation template support.

6. Add styles to package entrypoint if global package styles are used.
   - Example: add `@use './new-component';` to `projects/form/src/lib/styles/form.scss`.

7. Export public files.
   - Update `projects/<package>/src/public-api.ts` or package `src/lib/index.ts`.

8. Add docs.
   - Package README/docs.
   - `src/assets/docs/<component>.md`.
   - Route entry in `src/app/app.routes.ts`.
   - Example component under `src/app/examples/components/<component>`.
   - Optional playground component under `src/app/playground/components/<component>`.

9. Add tests.
   - Component creation.
   - Input transforms.
   - Output events.
   - CVA if applicable.
   - Template slots.
   - Accessibility behavior.

10. Build/test.
   - `ng test <package>`.
   - `ng build <package>`.
   - `ng serve` for demo QA.

## 44. Build One Example Component From Scratch: Badge

Reference pattern:

- Simple API from `AppolowButtonComponent`.
- CSS variables from `AppolowBoardComponent`.
- Public export from `projects/form/src/public-api.ts`.

Recommended files:

```text
projects/form/src/lib/components/appolow-badge/
+-- appolow-badge.component.ts
+-- appolow-badge.component.html
+-- appolow-badge.component.scss
+-- appolow-badge.component.spec.ts
+-- appolow-badge.interface.ts
```

Responsibilities:

- `appolow-badge.interface.ts`: `ApwBadgeColor`, `ApwBadgeVariant`, `ApwBadge`.
- Component TS: `selector: 'apw-badge'`, `input<ApwBadge>`, `input<boolean>` for pill/disabled if needed, `computed()` class list.
- Template: render `<span class="appolow-badge">` with `<ng-content>`.
- SCSS: define `--appolow-badge-*` variables and BEM modifiers.
- Public API: export component and interface from `projects/form/src/public-api.ts`.
- Docs: add `src/assets/docs/badge.md`, example route, example component.

## 45. Building Your Own Library From Scratch

Recommended phases:

### Phase 1: Workspace

Create Angular workspace with:

- Root docs/playground app.
- `projects/core` or `projects/utils`.
- First package, such as `projects/button`.
- Strict TypeScript and Angular template checking.
- Karma/Jasmine or Vitest setup.
- CI build/test job before publish.

### Phase 2: Core Infrastructure

```text
projects/core/src/lib/
+-- config/
+-- tokens/
+-- services/
+-- utilities/
+-- accessibility/
+-- platform/
+-- overlay/
+-- i18n/
```

Responsibilities:

- `platform`: safe `DOCUMENT`, browser checks.
- `accessibility`: focus trap, focus restoration, keyboard managers.
- `overlay`: container, position, scroll strategy, z-index stack.
- `i18n`: dictionaries, translation service, provider helper.
- `tokens`: shared DI tokens and typed config.

### Phase 3: Design System

```text
projects/theme/src/lib/
+-- primitives/
+-- semantic/
+-- components/
+-- themes/
+-- utilities/
```

Base this on the board token model and form variable coverage.

### Phase 4: First Components

Build in this order:

1. Button
2. Badge
3. Input
4. Textarea
5. Checkbox
6. Radio
7. Select
8. Tooltip
9. Dialog
10. Table

Why: button/badge prove tokens; input/textarea prove CVA; checkbox/radio prove native semantics; select/tooltip/dialog prove overlays; table proves complex templating and state.

### Phase 5: Overlay Infrastructure

Build overlay before dropdown, tooltip, select panel, dialog, datepicker, context menu.

### Phase 6: Form Infrastructure

Build a reusable CVA pattern. Avoid mutating Angular controls directly.

### Phase 7: Advanced Components

Add select, autocomplete, datepicker, menu, dialog, tree, table/data-grid, calendar, board.

### Phase 8: Documentation

Use package-local docs as source and generate docs app routes/pages.

### Phase 9: Testing

Add behavioral tests before packaging. Include a11y and overlay cleanup tests.

### Phase 10: Packaging

Use ng-packagr, peer dependencies, `sideEffects`, secondary entry points when needed.

### Phase 11: CI/CD

Install once, build dependency graph order, test, build, pack, publish.

### Phase 12: npm Publishing

Use Changesets. Publish only changed packages. Generate changelogs.

## 46. Proposed Folder Structure for Your Own Library

```text
repo/
+-- apps/
|   +-- docs/
|   +-- playground/
+-- projects/
|   +-- core/
|   |   +-- src/lib/accessibility/
|   |   +-- src/lib/config/
|   |   +-- src/lib/i18n/
|   |   +-- src/lib/overlay/
|   |   +-- src/lib/platform/
|   |   +-- src/lib/tokens/
|   |   +-- src/lib/utilities/
|   |   +-- src/public-api.ts
|   +-- theme/
|   |   +-- src/lib/primitives/
|   |   +-- src/lib/semantic/
|   |   +-- src/lib/components/
|   |   +-- src/lib/themes/
|   |   +-- src/public-api.ts
|   +-- button/
|   +-- form/
|   +-- overlay/
|   +-- table/
|   +-- board/
+-- docs/
+-- tools/
+-- angular.json
+-- package.json
+-- tsconfig.json
```

If you keep the current Angular CLI layout, replace `apps/docs` with root `src` as this repo does.

## 47. Standard Component Blueprint

```text
component-name/
+-- component-name.component.ts          mandatory
+-- component-name.component.html        mandatory unless tiny inline template
+-- component-name.component.scss        mandatory for visual component
+-- component-name.component.spec.ts     mandatory
+-- component-name.interface.ts          optional public config/events
+-- component-name.types.ts              optional type aliases
+-- component-name.tokens.ts             optional DI/config tokens
+-- component-name.config.ts             optional defaults
+-- component-name.directive.ts          optional template slots/behaviors
+-- index.ts                             optional package-local barrel
```

Rules:

- Keep public types beside the component or in package `models`.
- Keep internal-only types private unless reused.
- Export only consumer-facing APIs from `public-api.ts`.

## 48. Component Development Checklist

- API: selector, inputs, models, outputs, event types.
- Forms: CVA, disabled, touched, validators, default value.
- Accessibility: label, role, ARIA, keyboard, focus, disabled semantics.
- Templates: `ng-content` or marker directives with documented context.
- Styling: BEM classes, CSS variables, state modifiers.
- Theming: primitive/semantic/component token usage.
- Responsiveness: breakpoints or flexible CSS.
- State: signals/computed/effects, cleanup.
- Events: typed payloads, no accidental DOM leakage.
- Tests: creation, inputs, outputs, CVA, keyboard, templates, cleanup.
- Docs: README, docs asset, examples, playground.
- Packaging: public export, ng-package assets if needed.
- Build: `ng test <package>`, `ng build <package>`.

## 49. Architecture Rules

Derived rules:

- RULE-001: Consumer imports must go through package public APIs.
  Evidence: `projects/*/src/public-api.ts`, `tsconfig.json`.

- RULE-002: Shared cross-package infrastructure belongs in `@appolow/utils`.
  Evidence: modal/portal/paginable/calendar imports from `@appolow/utils`.

- RULE-003: Complex components should expose template-slot directives.
  Evidence: board, table, select, calendar, accordion, stepper directives.

- RULE-004: Visual components should use BEM-style `appolow-*` classes.
  Evidence: form, board, table styles/templates.

- RULE-005: Published packages should declare peer Angular dependencies and use ng-packagr.
  Evidence: `projects/*/package.json`, `projects/*/ng-package.json`.

- RULE-006: Form controls should implement `ControlValueAccessor`.
  Evidence: input/select/date picker/accordion/table.

- RULE-007: Overlay components must clean up DOM nodes, views, subscriptions, focus, and body scroll.
  Evidence: modal/portal ref and stack implementations.

Recommended additional rules:

- RULE-R001: No raw `document`/`window` usage without platform guard or injected `DOCUMENT`.
- RULE-R002: No new string DI tokens.
- RULE-R003: No public export of internal helpers unless intentionally documented.
- RULE-R004: No new component without non-smoke behavioral tests.
- RULE-R005: No duplicated overlay/popup utility across packages.

## 50. Anti-Patterns

Problem: Duplicated overlay/popup/transition utilities.

- Why it matters: Bugs fixed in one place may remain in another.
- Current evidence: `projects/utils/src/lib/popup.ts`, `projects/form/src/lib/utils/popup.ts`, duplicated transition utilities.
- Recommended improvement: move all overlay/popup/position/autoclose/transition primitives into one core package.
- Migration difficulty: medium.

Problem: Direct browser globals.

- Why it matters: SSR/hydration and tests become fragile.
- Current evidence: `overlay-ref.ts`, `overlay-position.ts`, `calendar.component.ts`, `modal-stack.ts`, `avatar/sources/gravatar.ts`.
- Recommended improvement: use `DOCUMENT`, platform guards, and platform services.
- Migration difficulty: medium.

Problem: Public/internal API leakage.

- Why it matters: Consumers can depend on internals, blocking refactors.
- Current evidence: broad `@appolow/utils` exports and `@appolow/paginable` `export * from './lib'`.
- Recommended improvement: curate exports and add `internal/` folders.
- Migration difficulty: medium.

Problem: Inconsistent standalone/NgModule patterns.

- Why it matters: Consumers see mixed integration stories.
- Current evidence: board standalone with deprecated module, avatar non-standalone module, form hybrid components.
- Recommended improvement: standalone-first with compatibility modules.
- Migration difficulty: medium to high.

Problem: Weak or stale tests in some areas.

- Why it matters: architecture changes can regress behavior silently.
- Current evidence: form input spec is creation-only.
- Recommended improvement: add behavior tests before refactors.
- Migration difficulty: low to medium.

Problem: Docs script references missing file.

- Why it matters: documented tooling cannot run.
- Current evidence: `package.json` has `docs:form-vars`; `scripts/generate-form-variables-doc.js` not found.
- Recommended improvement: restore script or remove root script.
- Migration difficulty: low.

Problem: Direct mutation of input data.

- Why it matters: consumers using immutable patterns or signals may see surprising behavior.
- Current evidence: board mutates `columns` and card arrays, then increments `_columnsVersion`.
- Recommended improvement: emit proposed changes or support immutable update mode.
- Migration difficulty: medium.

## 51. Architectural Improvements

Preserve:

- Multi-package architecture with independent npm packages.
- ng-packagr packaging.
- CSS variable theming.
- BEM naming.
- Template-slot directives.
- Standalone-first direction in newer packages.
- Modal/portal lifecycle depth: focus, scroll, ARIA hiding, cleanup.
- Typed domain event models in board/calendar/table.

Improve:

- Make `@appolow/utils` a deliberate core package.
- Unify overlay/tooltip/modal/portal primitives.
- Replace string tokens with typed injection tokens.
- Add environment provider APIs.
- Add secondary entry points for large packages.
- Standardize selectors and output naming.
- Increase tests around form controls and accessibility.
- Add platform guards for SSR.

Avoid replicating:

- Mutating Angular form controls with ad hoc methods.
- Broad `export *` of entire internal library folders.
- Missing/stale scripts.
- Browser globals in shared libraries.
- Duplicate utility copies.
- Inconsistent docs sources.

## 52. Architecture Decision Records

ADR-001: Angular CLI Multi-Package Workspace

- Context: The repo contains a docs app and many libraries.
- Decision: Use Angular CLI `angular.json` projects with ng-packagr.
- Reason: Simple, native Angular library builds.
- Trade-off: No Nx graph/enforced boundaries.
- Recommendation: Keep Angular CLI if the team wants simplicity; add dependency-boundary linting or Nx if package graph grows.

ADR-002: Standalone Components For Newer Widgets

- Context: Board/calendar/table use standalone components.
- Decision: Prefer standalone APIs and provide optional modules.
- Reason: Better modern Angular ergonomics and tree-shaking.
- Trade-off: Legacy apps need wrapper modules.
- Recommendation: Make standalone the default for new components.

ADR-003: CSS Variables For Theming

- Context: Form and board expose many CSS custom properties.
- Decision: Use CSS variables instead of runtime theme services.
- Reason: Works at runtime, scopes naturally, avoids JS for simple theme changes.
- Trade-off: Type safety and discoverability require docs.
- Recommendation: Preserve and formalize token layers.

ADR-004: Services For Dynamic Overlays

- Context: Modals and portals need DOM attachment outside component trees.
- Decision: Use facade services and stack/ref classes.
- Reason: Supports dynamic content, global body/focus/scroll lifecycle.
- Trade-off: More browser-specific and harder SSR support.
- Recommendation: Centralize in core overlay package.

ADR-005: Template Marker Directives For Customization

- Context: Board, table, select, calendar, accordion all use slots.
- Decision: Components discover `TemplateRef`s through marker directives.
- Reason: Strong customization without exposing internal DOM.
- Trade-off: More directives to import/document.
- Recommendation: Preserve and standardize.

## 53. Learning Roadmap

Angular Core:

- Must know: standalone components, signals, templates, DI, forms, routing.
- Should know: host bindings, content/view queries, environment providers.
- Advanced: dynamic component creation and partial compilation.

Advanced Angular:

- Must know: CVA, content projection, `TemplateRef`, `ViewContainerRef`.
- Should know: `ApplicationRef`, `EnvironmentInjector`, `NgZone`.
- Advanced: SSR-safe platform abstraction.

Library Engineering:

- Must know: `public-api.ts`, ng-packagr, peer dependencies.
- Should know: APF, side effects, secondary entry points.
- Advanced: multi-package release automation.

Design Systems:

- Must know: CSS variables, BEM, semantic tokens.
- Should know: theme scopes, dark mode, component token docs.
- Advanced: token generation pipelines.

Accessibility:

- Must know: labels, roles, ARIA, keyboard support.
- Should know: focus trap, focus restoration, roving tabindex.
- Advanced: WAI-ARIA widget pattern testing.

Testing:

- Must know: TestBed, component fixtures, inputs/outputs.
- Should know: CVA tests, fakeAsync, DOM event tests.
- Advanced: visual regression and accessibility automation.

Package Engineering:

- Must know: npm package metadata, semver, peer deps.
- Should know: Changesets, changelog generation.
- Advanced: package graph build order and provenance.

Performance:

- Must know: signals/computed, track functions, debouncing.
- Should know: change detection boundaries, virtualization.
- Advanced: bundle analysis and hydration performance.

Architecture:

- Must know: public vs internal API boundaries.
- Should know: core/feature package dependency direction.
- Advanced: ADRs, compatibility policies, migration guides.

DevOps / Publishing:

- Must know: CI install/test/build/publish.
- Should know: Docker app deployment, registry auth.
- Advanced: affected releases and automated version gates.

## 54. Step-by-Step Practical Implementation Plan

Stage 1: Create workspace.

- Create docs app and first library.
- Add strict TS and Angular template checking.
- Add `ng build` and `ng test` CI.

Stage 2: Create core package.

- Files: `core/src/lib/platform`, `accessibility`, `overlay`, `i18n`, `tokens`.
- Test: platform guards and i18n provider.

Stage 3: Create theme package.

- Files: primitive, semantic, component tokens.
- Test: CSS token docs generation.

Stage 4: Build button and badge.

- Responsibilities: simple input APIs, CSS variables, content projection.
- Test: class mapping, disabled state, token classes.

Stage 5: Build input and textarea.

- Responsibilities: CVA, validation, help/error templates, disabled/touched.
- Test: reactive form behavior, native validation, templates.

Stage 6: Build checkbox/radio/switch.

- Responsibilities: native input semantics, labels, groups.
- Test: keyboard and form integration.

Stage 7: Build overlay service.

- Responsibilities: container, backdrop, position, scroll, outside click, escape, focus.
- Test: attach/detach/dispose, focus trap, SSR guards.

Stage 8: Build tooltip/dropdown/select.

- Responsibilities: positioning, templates, keyboard nav, typeahead.
- Test: open/close, outside click, ARIA, option selection.

Stage 9: Build dialog/modal.

- Responsibilities: service facade, stack, ref, content injection, ARIA/focus/scroll.
- Test: close/dismiss promises, cleanup, stacked modals.

Stage 10: Build table/list.

- Responsibilities: data model, templates, filters, sorting, pagination, selection.
- Test: CVA selection, filter debouncing, custom cells, accessibility.

Stage 11: Build advanced widgets.

- Calendar, board, stepper, tree.
- Test: template slots, typed events, keyboard behavior.

Stage 12: Package and publish.

- Add package metadata, peer deps, sideEffects, changelogs.
- Add Changesets and CI publish.

## 55. Traceability Matrix

| Concept | Evidence |
| --- | --- |
| Angular CLI workspace | `angular.json` |
| Multi-package publishable libraries | `projects/*/package.json`, `projects/*/ng-package.json` |
| Root docs app | `src/app/app.routes.ts`, `src/app/docs/docs.component.ts` |
| Public API barrels | `projects/*/src/public-api.ts` |
| Path aliases | `tsconfig.json` |
| Form CVA base | `projects/form/src/lib/shared/appolow-form-control.ts` |
| Signal component APIs | `board.component.ts`, `calendar.component.ts`, `table.component.ts`, `accordion.component.ts` |
| Template slots | `projects/*/directives/*` |
| CSS variable tokens | `projects/form/src/lib/styles/_variables.scss`, `projects/board/src/lib/components/board/board.component.scss` |
| Overlay/dynamic DOM | `projects/utils/src/lib/overlay`, `projects/modal/src/lib`, `projects/portal/src/lib` |
| Focus management | `projects/utils/src/lib/focus-trap.ts`, `projects/modal/src/lib/modal-window.ts` |
| I18n | `projects/utils/src/lib/i18n`, `projects/paginable/src/lib/assets/i18n`, `projects/calendar/src/lib/i18n` |
| Publishing | `.gitlab-ci.yml` |
| Demo deployment | `Dockerfile`, `.gitlab-ci.yml` |

## 56. Final Architecture Map

Current architecture:

```text
CONSUMER APPLICATION
  |
  +-- @appolow/form
  |     +-- AppolowLibraryModule.forRoot()
  |     +-- form controls/components
  |     +-- form directives/templates
  |     +-- form pipes/validators
  |     +-- ModuleConfigService
  |     +-- SCSS form styles and themes
  |     +-- vendors: ng-select, daterangepicker, dayjs, Bootstrap
  |
  +-- @appolow/paginable
  |     +-- standalone table/list/paginator/dropdown
  |     +-- template directives
  |     +-- table services/config/i18n
  |     +-- depends on @appolow/utils
  |
  +-- @appolow/modal / @appolow/portal
  |     +-- facade service
  |     +-- stack service
  |     +-- ref/result lifecycle
  |     +-- dynamic component/template/string content
  |     +-- focus trap, scrollbar, transitions from @appolow/utils
  |
  +-- @appolow/board / calendar / accordion / stepper
  |     +-- standalone signal components
  |     +-- template slots
  |     +-- typed domain events
  |     +-- CSS variable styling
  |
  +-- @appolow/utils
        +-- overlay
        +-- popup/content ref
        +-- focus trap
        +-- scrollbar
        +-- transitions
        +-- i18n
        +-- utility pipes
```

Recommended rebuilt architecture:

```text
CONSUMER APPLICATION
  |
  +-- PUBLIC PACKAGE APIs
      |
      +-- @appolow/core
      |     +-- platform
      |     +-- config/tokens
      |     +-- accessibility
      |     +-- overlay
      |     +-- i18n
      |     +-- utilities
      |
      +-- @appolow/theme
      |     +-- primitives
      |     +-- semantic tokens
      |     +-- component tokens
      |     +-- themes
      |
      +-- FEATURE PACKAGES
            +-- button/badge
            +-- form controls
            +-- select/dropdown/tooltip
            +-- modal/portal/dialog
            +-- table/list
            +-- board/calendar/stepper/accordion
            |
            +-- all depend downward on core/theme
```

## 57. Final Deliverables Summary

This review provides:

1. Repository overview and folder map.
2. Architecture diagram and dependency direction.
3. Workspace, package, public API, and build architecture.
4. Component, directive, service, utility, forms, overlay, accessibility, state, event, i18n, RTL, responsive, animation, testing, docs, demo, CI/CD, publishing, tree-shaking, performance, SSR, and security analysis.
5. Strengths, weaknesses, anti-patterns, recommendations, ADRs, architecture rules.
6. New-component workflow, example component blueprint, from-scratch library roadmap, learning roadmap, and final architecture map.

