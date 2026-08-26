# Angular Translation / i18n Guide (@jsverse/transloco)

> Companion to [`ANGULAR_APP_STRUCTURE_TEMPLATE.md`](./ANGULAR_APP_STRUCTURE_TEMPLATE.md). This file
> is the full, standalone reference for wiring translations into any Angular app so it matches the
> convention every feature in that guide assumes (`| transloco` in templates, `Translations.instant()`/
> `Translations.watch()` in TypeScript).
>
> Derived from how this platform uses `@jsverse/transloco`, generalized so it carries zero dependency
> on `@appolow/*` — the only third-party dependency is Transloco itself.

---

## Table of contents

1. [Why Transloco, and the rules that follow from it](#1-why-transloco-and-the-rules-that-follow-from-it)
2. [Install & wire up](#2-install--wire-up)
3. [Where translation files live](#3-where-translation-files-live)
4. [Key naming convention](#4-key-naming-convention)
5. [The `Translations` static facade](#5-the-translations-static-facade)
6. [Consuming translations: template vs. TypeScript](#6-consuming-translations-template-vs-typescript)
7. [Validation-error → translation-key mapping](#7-validation-error--translation-key-mapping)
8. [`FieldErrorComponent` — rendering validator errors under a control](#8-fielderrorcomponent--rendering-validator-errors-under-a-control)
9. [Language switching](#9-language-switching)
10. [Lazy-loaded feature translations](#10-lazy-loaded-feature-translations)
11. [Checklist: adding translations for a new feature](#11-checklist-adding-translations-for-a-new-feature)

---

## 1. Why Transloco, and the rules that follow from it

Transloco is chosen because it's framework-idiomatic (signals-friendly, standalone-provider based), well documented, and is what this codebase's authors already validated at scale (~4,000 keys, 37 namespaces, two languages, per-extension lazy translation bundles). Picking a different i18n library per app would mean re-deriving all of the conventions below from scratch each time — don't do that without a specific reason.

Two hard rules fall out of standardizing on it:

- **Never inject `TranslocoService` directly in feature code.** Everything imperative goes through the `Translations` facade (§5) — this is what lets base classes like `PaginatedTableComponent<T>` and the decorators in the structure guide call `Translations.instant(...)` without needing Angular DI context (decorators aren't components; they can't `inject()`).
- **The `transloco` pipe is the only template-level mechanism used.** Transloco also ships a `*transloco` structural directive; don't introduce it — pick one and stay consistent so every template looks the same.

---

## 2. Install & wire up

```bash
npm install @jsverse/transloco
```

```ts
// app/transloco-loader.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Translation, TranslocoLoader } from '@jsverse/transloco';

@Injectable({ providedIn: 'root' })
export class TranslocoHttpLoader implements TranslocoLoader {
  private readonly http = inject(HttpClient);

  getTranslation(lang: string) {
    return this.http.get<Translation>(`/assets/i18n/${lang}.json`);
  }
}
```

```ts
// app.config.ts (excerpt — see also §15 of the structure guide for full context)
import { provideTransloco } from '@jsverse/transloco';
import { TranslocoHttpLoader } from './transloco-loader.service';
import { environment } from '../environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    // ...other providers
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

`reRenderOnLangChange: true` matters: it makes every `| transloco` binding in the app re-render automatically the instant the active language changes, so the language switcher (§9) doesn't need any manual "reload the page" or per-component subscription logic.

Root translation files must exist before first run:

```
src/assets/i18n/en.json
src/assets/i18n/es.json
```

Start them as `{}` and grow them feature by feature (§11).

---

## 3. Where translation files live

- **Root/global**: `src/assets/i18n/en.json` / `es.json` — shared, app-wide copy: generic buttons, labels, error messages, navigation, and every conventional-admin-feature's own namespace (`PRODUCT_LIST.*`, `USER_LIST.*`, etc.) unless that feature is lazy-loaded from a separate deployable unit.
- **Per lazy-loaded feature/plugin** (only if your app has an extensibility system that dynamically loads separately-bundled features — see §10): its own `assets/i18n/{en,es}.json` shipped next to the feature code, merged in at load time via a Transloco **scope**. Don't put copy for a genuinely separate deployable unit into the global file — it defeats the purpose of loading it independently.

---

## 4. Key naming convention

`SCREAMING_SNAKE` namespace segments joined by dots, feature-first:

```
<FEATURE>.<SECTION>.<ITEM>
```

Common `SECTION` values:

| Section | Used for |
|---|---|
| `TITLES` | Page/section headings |
| `LABELS` | Form field labels, table column headers |
| `BUTTONS` | Button text |
| `DESCRIPTIONS` | Helper/subtitle text |
| `MESSAGES.INFO` / `MESSAGES.WARNING` / `MESSAGES.ERROR` | Toasts, confirm-dialog copy, inline messages |
| `BREADCRUMBS` | Route `data.breadcrumb` values |
| `MENU` | Navigation menu entries |

Examples:

```
GENERIC.TITLES.DASHBOARD
GENERIC.BUTTONS.SAVE
GENERIC.MESSAGES.ERROR.REQUIRED_FIELD
PRODUCT_LIST.LABELS.NAME
PRODUCT_LIST.MESSAGES.CANNOT_DELETE_LAST_PRODUCT
GENERIC.MESSAGES.WARNING.DELETE_ELEMENT?
```

Confirm-dialog **content** keys conventionally end in `?` (it's a question being asked of the user, and it visually distinguishes "prompt" keys from "statement" keys at a glance when scanning the JSON).

Dynamic keys are allowed and used (`'X_ACCESS.LEVELS.' + property | transloco`) — just make sure every value the interpolated segment can take has a corresponding key, or you'll silently render the raw key string to the user.

---

## 5. The `Translations` static facade

Same rationale as the `Toast` facade in the structure guide (§8 there): a static class callable from anywhere (components, decorators, guards, non-injectable helper classes), backed by a real `TranslocoService` instance registered once via a small DI "bridge" class.

```ts
// core/services/translations.service.ts
import { Injectable, effect, inject, signal } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { Observable } from 'rxjs';

/** Provided once at root; registers the live TranslocoService and syncs active-lang changes into it. */
@Injectable({ providedIn: 'root' })
export class TranslationsBridgeService {
  private readonly translocoService = inject(TranslocoService);

  constructor() {
    Translations.register(this.translocoService);
    effect(() => {
      this.translocoService.setActiveLang(Translations.currentLanguage());
    });
  }
}

export class Translations {
  private static translocoService: TranslocoService | null = null;

  /** Seeded from localStorage, falling back to the browser's language. Setting this drives the effect above. */
  static readonly currentLanguage = signal<string>(
    localStorage.getItem('language') ?? navigator.language.split('-')[0] ?? 'en',
  );

  static register(service: TranslocoService): void {
    Translations.translocoService = service;
  }

  /** One-off imperative lookup. Use for things computed once (e.g. building a static options list). */
  static instant(key: string, params?: Record<string, unknown>): string {
    if (!Translations.translocoService) {
      console.warn('[Translations] TranslocoService not registered yet — did you inject TranslationsBridgeService in the app shell?');
      return key;
    }
    return Translations.translocoService.translate(key, params);
  }

  /**
   * Reactive lookup — stays live across a language switch. Prefer this over instant()
   * for anything the user might see change without a page reload while a language
   * switch happens (e.g. a value shown via async pipe in a template built imperatively).
   */
  static watch(key: string, params?: Record<string, unknown>): Observable<string> {
    if (!Translations.translocoService) {
      throw new Error('[Translations] TranslocoService not registered yet.');
    }
    return Translations.translocoService.selectTranslate(key, params);
  }

  static setActiveLang(lang: string): void {
    localStorage.setItem('language', lang);
    Translations.currentLanguage.set(lang);
  }
}
```

**Wiring** (once, in the app shell — same place `ToastBridgeService` is injected):

```ts
// layout/components/shell/shell.component.ts
export class ShellComponent {
  private readonly translationsBridge = inject(TranslationsBridgeService); // side-effecting registration
  private readonly toastBridge = inject(ToastBridgeService);
}
```

---

## 6. Consuming translations: template vs. TypeScript

| Context | Use |
|---|---|
| Component template | `{{ 'X.Y.Z' | transloco }}` |
| Dynamic key in a template | `{{ ('X.LEVELS.' + level) | transloco }}` |
| TypeScript, one-off (build a static list, log message, etc.) | `Translations.instant(key, params?)` |
| TypeScript, value the user might see live-update on language switch | `Translations.watch(key, params?)` (subscribe or pipe through `async`) |
| Inside a decorator (no DI context) | `Translations.instant(...)` — this is exactly why the facade exists; `inject(TranslocoService)` isn't available there |

Never call `translocoService.translate(...)` directly in feature code — always through `Translations`.

---

## 7. Validation-error → translation-key mapping

Centralize the mapping from Angular validator error keys to translation keys in one place, so `@AsyncCheckFormValidity` and `FieldErrorComponent` (§8) both resolve error copy consistently without every component hand-writing per-field error text.

```ts
// core/constants/errors.ts
export const ERROR_TRANSLATIONS: Record<string, string> = {
  required: 'GENERIC.MESSAGES.ERROR.REQUIRED_FIELD',
  email: 'GENERIC.MESSAGES.ERROR.PATTERN',
  pattern: 'GENERIC.MESSAGES.ERROR.PATTERN',
  minlength: 'GENERIC.MESSAGES.ERROR.MIN_LENGTH',
  maxlength: 'GENERIC.MESSAGES.ERROR.MAX_LENGTH',
  uniqueName: 'GENERIC.MESSAGES.ERROR.NAME_ALREADY_EXISTS',
  notEqual: 'GENERIC.MESSAGES.ERROR.FIELDS_DO_NOT_MATCH',
  fqdn: 'GENERIC.MESSAGES.ERROR.FQDN',
  json: 'GENERIC.MESSAGES.ERROR.INVALID_JSON',
  atLeastOne: 'GENERIC.MESSAGES.ERROR.AT_LEAST_ONE_REQUIRED',
};

export const DEFAULT_ERROR_TRANSLATION = 'GENERIC.MESSAGES.ERROR.INVALID_FORM';
```

**Add new validator-key → translation-key mappings here, not per-component.** When you write a new custom validator (§11 of the structure guide), its error key belongs in this table the same day.

---

## 8. `FieldErrorComponent` — rendering validator errors under a control

Since this template doesn't depend on the source platform's `apw-*` form-control library (which auto-renders errors), reproduce that behavior with one small reusable component:

```ts
// shared/components/field-error/field-error.component.ts
import { Component, computed, input } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { TranslocoPipe } from '@jsverse/transloco';
import { DEFAULT_ERROR_TRANSLATION, ERROR_TRANSLATIONS } from '../../../core/constants/errors';

@Component({
  selector: 'app-field-error',
  standalone: true,
  imports: [TranslocoPipe],
  template: `
    @if (errorKey(); as key) {
      <small class="p-error">{{ key | transloco }}</small>
    }
  `,
})
export class FieldErrorComponent {
  readonly control = input.required<AbstractControl | null>();

  readonly errorKey = computed(() => {
    const control = this.control();
    if (!control?.errors || (!control.dirty && !control.touched)) return null;
    const firstKey = Object.keys(control.errors)[0];
    return ERROR_TRANSLATIONS[firstKey] ?? DEFAULT_ERROR_TRANSLATION;
  });
}
```

Usage under any PrimeNG input:

```html
<input pInputText formControlName="name" />
<app-field-error [control]="form.controls.name" />
```

---

## 9. Language switching

```ts
// layout/components/language-switcher/language-switcher.component.ts
@Component({
  selector: 'app-language-switcher',
  standalone: true,
  imports: [SelectModule, FormsModule],
  template: `
    <p-select
      [options]="languages"
      [ngModel]="Translations.currentLanguage()"
      (ngModelChange)="Translations.setActiveLang($event)"
      optionLabel="label"
      optionValue="code"
    />
  `,
})
export class LanguageSwitcherComponent {
  protected readonly Translations = Translations;
  readonly languages = [
    { code: 'en', label: 'English' },
    { code: 'es', label: 'Español' },
  ];
}
```

Because `Translations.setActiveLang()` both persists to `localStorage` and updates the `currentLanguage` signal, and `TranslationsBridgeService`'s `effect()` syncs that into `TranslocoService`, this is the entire language-switching implementation — no manual reload, no manual re-subscription anywhere else in the app.

---

## 10. Lazy-loaded feature translations

Only relevant if your app has an extensibility/plugin system where whole features are loaded dynamically (via `import()`), separately from the main bundle — skip this section for a purely conventional app where every feature ships in the same build.

Ship the feature's own `assets/i18n/{en,es}.json` next to its code, and register a **Transloco scope** when the feature loads:

```ts
// inside the dynamic-loading code path for a feature/module/plugin
import { TranslocoService } from '@jsverse/transloco';

async function loadFeatureTranslations(translocoService: TranslocoService, featureName: string) {
  const [en, es] = await Promise.all([
    import(`../features/${featureName}/assets/i18n/en.json`),
    import(`../features/${featureName}/assets/i18n/es.json`),
  ]);
  translocoService.setTranslation(en.default, 'en', { merge: true });
  translocoService.setTranslation(es.default, 'es', { merge: true });
}
```

`{ merge: true }` is what lets a lazily-loaded feature's keys coexist with the global namespace without clobbering it. Call this once, as part of whatever lifecycle hook already loads the feature's code — don't duplicate the load on every navigation into the feature.

---

## 11. Checklist: adding translations for a new feature

1. Add keys to `src/assets/i18n/en.json` and `es.json` under a new `<FEATURE>` namespace, following `<FEATURE>.<SECTION>.<ITEM>` (§4).
2. If the feature is a lazy-loaded extension (§10), ship its own `assets/i18n/{en,es}.json` instead of touching the global file.
3. Use `| transloco` in templates; use `Translations.watch()`/`Translations.instant()` (never raw `TranslocoService`) in TypeScript.
4. If the copy is a validator error message, add the mapping to `ERROR_TRANSLATIONS` in `core/constants/errors.ts` (§7) instead of hand-writing per-field error text.
5. Keep `en.json` and `es.json` key-for-key in sync — a key present in one and missing in the other renders as the raw key string for that language.
