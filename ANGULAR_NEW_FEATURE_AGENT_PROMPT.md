# New-Feature Scaffolding Prompt (for AI coding agents)

> Copy everything in the fenced block below into your AI coding agent (Claude Code, Cursor, etc.),
> fill in the `<PLACEHOLDERS>`, and let it scaffold a new conventional CRUD feature that follows
> [`ANGULAR_APP_STRUCTURE_TEMPLATE.md`](./ANGULAR_APP_STRUCTURE_TEMPLATE.md) and
> [`ANGULAR_I18N_TRANSLATION_GUIDE.md`](./ANGULAR_I18N_TRANSLATION_GUIDE.md). Both files must already
> exist in the target repo (or be pasted in as context) — the agent is instructed to treat them as the
> source of truth rather than inventing its own patterns.

---

## Prompt template

```
You are scaffolding a new conventional admin/CRUD feature in an Angular app. Before writing any
code, read these two files in full — they define every pattern you must follow:

  1. ANGULAR_APP_STRUCTURE_TEMPLATE.md
  2. ANGULAR_I18N_TRANSLATION_GUIDE.md

Do not invent alternative patterns for anything those files already cover (pagination, forms,
permissions, notifications, confirmation, i18n). If something this feature needs isn't covered by
either file, say so explicitly instead of silently improvising — I'd rather extend the base
pattern than have one feature drift from it.

## Feature to build

- Entity name (PascalCase, singular):        <ENTITY_NAME e.g. Product>
- Feature folder name (kebab-case):           <FEATURE_FOLDER e.g. product-management>
- Backend REST resource path:                 <API_RESOURCE_PATH e.g. products>
- Fields (name: type — validation rules):
    <FIELD_1: type — required/optional, any special validator (fqdn, database-name, equal-to-X, etc.)>
    <FIELD_2: type — ...>
    <... add as many as needed>
- List page columns (subset of fields, plus any computed/derived display columns):
    <COLUMN_1, COLUMN_2, ...>
- Search fields (which columns the search box should query on the backend):
    <SEARCH_FIELD_1, SEARCH_FIELD_2>
- Default sort field:                         <DEFAULT_SORT_FIELD>
- Permission roles required:
    - Read/list:    <ROLE_READ e.g. PRODUCT_READ>
    - Create:       <ROLE_CREATE e.g. PRODUCT_CREATE>
    - Edit:         <ROLE_EDIT e.g. PRODUCT_EDIT>
    - Delete:       <ROLE_DELETE e.g. PRODUCT_DELETE>
- Edit form hosting:                          <route-page | dialog>   (EditingFormComponent vs EditingFormInDialog)
- Parent route file to wire into:             <e.g. app.routes.ts, or an existing parent feature's routes file>
- Any uniqueness constraints requiring an async backend check (e.g. name must be unique):
    <FIELD -> uses CollectionService.exists()>

## What to produce

Follow §13 ("Step-by-step recipe for a new feature") and the full worked example in §14 of
ANGULAR_APP_STRUCTURE_TEMPLATE.md as your literal template, substituting the entity above:

1. <FEATURE_FOLDER>/interfaces/<entity-name>.ts
2. <FEATURE_FOLDER>/services/<entity-name>.service.ts — extends CollectionService<T>
3. <FEATURE_FOLDER>/resolvers/<entity-name>.resolver.ts — id === 'add' ? of(null) : service.find(id) idiom
4. <FEATURE_FOLDER>/components/<entity-name>-list/ — <EntityName>ListComponent extends PaginatedTableComponent<T>,
   using the PrimeNG p-table `.list-page__*` template skeleton from §6, with row actions and the
   "add" button gated by *hasRole using the roles specified above
5. <FEATURE_FOLDER>/components/<entity-name>-edition/ — <EntityName>EditionComponent extends
   EditingFormComponent<T> (or EditingFormInDialog<T> per the hosting choice above), reactive form
   built with PrimeNG input/select/etc. controls bound via formControlName, validators pulled from
   shared/validators/ where one already fits (check before writing a new one — see §11 of the
   structure guide) plus <app-field-error> under every control
6. <FEATURE_FOLDER>/<feature-folder>.routes.ts — list / add / :id routes, resolve, data.breadcrumb,
   canActivate: [rolesGuard] with data.roles, canDeactivate: [canDeactivateFormFn] on the edit route
7. Translation keys added to src/assets/i18n/en.json AND es.json under the
   <ENTITY_NAME_UPPER>_LIST namespace (TITLES, LABELS for every field, BUTTONS, MESSAGES,
   BREADCRUMBS) — follow ANGULAR_I18N_TRANSLATION_GUIDE.md §4 exactly, and keep en/es key-for-key
   in sync
8. Wire <feature-folder>.routes.ts into the parent route file specified above via `children:`

## Self-check before you finish (go through this list explicitly)

- [ ] No manual HttpClient calls anywhere in the feature — everything goes through the service,
      which extends CollectionService<T>
- [ ] No manual `*ngIf="authService.hasPermits(...)"` — only *hasRole / *hasAnyRole, and
      canActivate: [rolesGuard] on routes that need it
- [ ] No manually opened confirm dialog — delete() uses @Confirmable(...)
- [ ] No hand-written `if (form.invalid)` check before save — save()/saveAndClose() use
      @AsyncCheckFormValidity(...)
- [ ] No hand-written unsaved-changes prompt — dismiss()/dialog-close uses @CheckFormDirt(...),
      and the routed edit page has canDeactivate: [canDeactivateFormFn]
- [ ] No manual pagination/sorting/search state in the list component — it all comes from
      PaginatedTableComponent<T>'s signals; the component only supplies dataSvc + headers
      (+ searchKeys/defaultSort overrides)
- [ ] No raw ToastrService/MessageService injected directly in feature code — only the static
      Toast facade, or MessageService only where a base class already exposes it (per the guide)
- [ ] No raw TranslocoService injected in feature code — only Translations.instant()/
      Translations.watch() or the `| transloco` pipe
- [ ] en.json and es.json have the same keys, nothing added to one and forgotten in the other
- [ ] Checked shared/validators/{common,strings}/ before writing any new validator
- [ ] Every destructive/action button and every route-level gate uses the exact role names
      specified above, not invented ones

Report back with the final file tree and flag anything you deviated from the two reference
guides on, with a one-line reason why.
```

---

## Notes for whoever fills this in

- If the feature is app-scoped/multi-tenant (needs the `ScopedCollectionService<T>` variant from §5
  of the structure guide), say so explicitly in the prompt — the agent won't infer that from field
  names alone.
- If several fields need cross-field validation (e.g. "end date after start date"), name the exact
  validator (`equal`, `conditional`, or "needs a new one — describe the rule") in the fields list
  instead of leaving it implicit.
- If you're scaffolding several related features at once (e.g. `product-management` and
  `product-category-management` where products reference categories), run this prompt once per
  feature, in dependency order (the referenced entity first), and mention the dependency in the
  prompt for the second one so the agent wires the FK field as a PrimeNG `p-select` populated via
  `CategoryService.list()`.
