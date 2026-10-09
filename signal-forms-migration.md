# Signal forms migration log

Migration of the workspace libraries from reactive forms to Angular signal forms, after updating the `@myrmidon/cadmus-*` core packages to v20 (2026-10-09).

Every statement below is marked **measured** (observed in a build, test or browser run, with how) or **believed** (not measured, with how it could be checked).

## Scope

- `@myrmidon/cadmus-part-tes-site-resources`: `SiteResourcesPartComponent` (part editor, derived from `ModelEditorComponentBase`) and `SiteResourceEditor` (manual-save sub-editor). `SiteResourcesPartFeature` has no form and was not changed.
- `@myrmidon/cadmus-part-tes-pg`: routes only, no forms. Not changed, just rebuilt and retested.
- The demo app (`src/`) is out of scope. It still uses reactive forms in its login/user pages, and it builds.

Baseline (measured, `ng build @myrmidon/cadmus-part-tes-site-resources` before any edit): the build failed only in `SiteResourcesPartComponent`, on the v20 `ModelEditorComponentBase` contract (abstract `form`, parameterless constructor, `FieldTree` instead of `FormGroup`).

## Tooling

- `scripts/build-libs.mjs` (copied from `cadmus-shell-v3`): builds the libraries in dependency order, or the named ones plus everything downstream (`pnpm build:libs [lib...]`, `--dry` to print the order). Measured: the order is site-resources, then pg.
- `scripts/check-local-libs.js`: fails if a local library is missing from tsconfig `paths` or exists in `node_modules` in any form, including a symlink. This workspace resolves local libraries through one mechanism only, tsconfig `paths` → `dist/`. It runs from `build:libs`, `start`, `build` and `check-libs`. Measured: it passes on the current tree, and it exited with 1 when an empty `node_modules/@myrmidon/cadmus-part-tes-pg` directory was created (the directory was then removed).
- Measured at the start: no local library was present in `node_modules/@myrmidon`.

## `SiteResourceEditor`

Pattern: the bricks `signal-forms-component-template.md`, manual-save flavour.

- Draft `SiteResourceControls`, built by the pure `toDraft()` and mapped back by `toModel()`. Text fields use `''`. Location and date are `T | null`, and arrays use `[]`.
- `_draft` is a `linkedSignal` with the `previous` echo check. An effect keyed on the draft calls `form().reset()` when the draft is back in sync with the bound resource. `save()` also resets.
- Features: the draft holds feature IDs, and the picker's entries are the computed `pickedFeatures` (IDs resolved against `featureEntries`, with unknown IDs shown as they are). This makes `toDraft()` pure. The old code read `featureEntries` `untracked` inside the form update.
  - Measured: the picker (`cadmus-thesaurus-store`) emits `entriesChange` only on user actions, or on `autoSort`, which is not used here (read from its installed fesm code).
- Child editors (location, date, counts) are set through `setFieldFromChild` with `copyFormValue`. The features picker is a user action, so it sets the value and calls `markAsDirty()`.
- No `<form>`. The accept button is `type="button" (click)="save()"`, and Enter-to-accept is kept through `(keydown.enter)` + `isImplicitSubmission`. As in the shell's editors, Enter does nothing while the accept button is disabled (invalid or pristine). Before, Enter on a pristine valid form re-emitted the unchanged resource.
- Removed the "tag required/too long" and "EID required/too long" messages. Those fields never had validators, so the messages could never appear.
- **Behaviour change (measured):** `maxLength(p.type, 100)` sets a native `maxlength="100"` attribute on the input (seen in the rendered DOM of the failing test), so the browser stops typing and pasting at 100 characters. Before, the user could type past the limit and got an error. The "type too long" error still appears for a bound value over the limit (the test was split to pin both).
- Behaviour change (measured by spec): reverting an edit by hand makes the editor pristine again, and the accept button becomes disabled.

## `SiteResourcesPartComponent`

Pattern: the CHANGELOG's "Migrating a part editor" section and the app-parts list-part template.

- `_draft = linkedSignal(() => toDraft(this.data()?.value))`, `form = this.createForm(...)`, and `NgxToolsSignalValidators.strictMinLength(p.entries, 1)`.
- Removed `buildForm`, `onDataSet`, `updateForm`, `updateThesauri`, the no-op `ngOnInit` override and the constructor parameters. `DialogService` is now injected with `inject()`.
- The thesauri are now `computed()` over `data().thesauri`. One small difference: before, data with no `thesauri` kept the previous entries. Now they become `undefined`.
- Entries are copied with `copyFormValue` on the way in, on the way out, and when they arrive from the resource editor. Measured by mutation: removing the copy in `getValue()` makes the "no Symbol tags" spec fail. So the form does tag array items, even though the template reads only `value()`.
- No `<form>`. Saving goes through `(saveRequest)="save()"`.
- `package.json` peers bumped to the versions the code now needs: `cadmus-core`/`cadmus-state` `^20.0.0`, and `cadmus-ui` `^20.0.1` (for the `isImplicitSubmission` nested-form fix). `ngx-tools` is now `^3.0.2`, the installed version built against. Believed: an earlier 3.0.x may also export `NgxToolsSignalValidators`. Check the ngx-tools changelog.

## Tests

- `site-resource-editor.spec.ts`: swapped `ReactiveFormsModule` for `FormField` in the imports, split the "too long" test (see above) and added: no `<form>`; stays pristine on a child echo; pristine again on revert; keeps the typed text when its own save echoes back normalized (`"abc "` → model `"abc"`, input still `"abc "`, then `"abc d"`); saved resource carries no Symbol tags.
- `site-resources-part.component.spec.ts`, added: pristine after binding; no `<form>`; Enter in the nested editor accepts the resource but does not save the part; the saved part carries no Symbol tags.
- Mutation checks (measured, source restored and diffed after each):
  - dropping the `previous` check → "keeps the typed text" fails (`Expected "abc "`, `Received "abc"`);
  - replacing `setFieldFromChild` with `set` + `markAsDirty` → "stays pristine on a child echo" fails. This held only after the stub's echo was made realistic (nulls dropped). With a plain JSON round-trip the echo is identical, the draft-in-sync reset hides the false dirty state, and the mutation survived;
  - adopting the child's count objects and emitting the draft's own array → "no Symbol tags" fails;
  - removing `copyFormValue` from the part's `getValue()` → the part's "no Symbol tags" fails.
- Final (measured): site-resources 79/79, pg 4/4. `pnpm build:libs` is clean, with no warnings, and the app builds (`ng build --configuration development`).

## Browser verification (measured, 2026-10-09)

Setup: `.angular/cache` deleted, `ng serve`, headless Chrome driven over CDP, logged in as zeus. I created a site-resources part in the mock DB on item `ceb37b0f…`, seeded with `null`s (`tag`, `features`, `counts`, nested location/date tags and assertions).

- **Served code is current:** every loaded script was fetched and grepped. The library comes from an app chunk compiled from `dist/` (not from a Vite `deps` pre-bundle), which contains `pickedFeatures`/`onFeatureEntriesChange` and no longer contains `updateThesauri`.
- At load: 2 rows, `isDirty() === false`, 0 `<form>` elements on the page.
- Opened the resource with location and date and waited 2.5 s. The date child echoed once (counted by wrapping the handler; location emitted 0 times after the wrap, which went in 50 ms after open). The accept button stayed disabled and the part stayed pristine. There were 0 `<form>` elements, including inside the child widgets.
- Typed `" x"` into EID and pressed Enter. The keydown was `defaultPrevented`, the editor closed, the row showed `q1 x` and the part became dirty. The API still had `eid: "q1"` with an unchanged `timeModified`, so the part was not saved.
- Clicked save. The snackbar said "Part saved", the API had `eid: "q1 x"` with location and date intact, and the part was pristine again.
- Reloaded, opened a resource, discarded it and closed the part. It was not dirty, no pending-changes dialog appeared, and the browser navigated to the item.

## Reported, not fixed (outside scope)

- The resource editor's panel title shows `resource #0` for a new resource (`editedIndex() + 1` with index -1). This predates the migration, and an existing spec pins it.
- The tag select has no "(none)" option, so a tag picked from the thesaurus cannot be cleared. This also predates the migration.
- The part editor has no `HelpLinkComponent` (`<cadmus-help-link>`), which the shell added to its editors on 2026-09-26.
- `cadmus-part-tes-site-resources/package.json` does not declare all the libraries it imports as peers (e.g. `cadmus-refs-*`, `cadmus-part-geo-asserted-locations`, `cadmus-thesaurus-store`, `cadmus-api`, `cadmus-item-editor`, `ngx-mat-tools`). Its version (1.0.1) and the pg library's peer range on it were not bumped, although its internals (`entries` → `form.entries`) changed incompatibly.
- `git status` showed `package.json`/`pnpm-lock.yaml` modified before this work (the v20 update); those changes are the owner's.
