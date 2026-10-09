# History

- 2026-10-09: added full component tests (Vitest + Angular Testing Library) for `@myrmidon/cadmus-part-tes-site-resources` and route tests for `@myrmidon/cadmus-part-tes-pg`. Fixes found while testing:
  - `SiteResourceEditor`:
    - accepting a resource also saved the whole part: the editor form is nested in the part form, and its `submit` event bubbled up to the part's `save()`. The editor now stops the event propagation (same pattern used in the bricks).
    - the "too long" errors were never shown because the template checked `errors.maxLength` instead of Angular's `errors.maxlength` key.
    - existing features were displayed with their IDs instead of their thesaurus labels, because the IDs were never resolved against `featureEntries`.
    - a blank EID or tag was saved as an empty string rather than omitted.
    - added `aria-label` to the icon-only buttons (AXE: buttons must have an accessible name).
  - `SiteResourcesPartComponent`:
    - type and tag columns did not show thesaurus labels: `flatLookup` was given `'id'` as its map instead of the thesaurus entries.
    - the row being edited was never highlighted, because it was compared by reference with a deep copy of it.
    - `assTagEntries` (`assertion-tags` thesaurus) was not passed to the resource editor.
    - moving or deleting resources while one was being edited left the edited index stale, so that saving the edited resource replaced the wrong one.
    - added `aria-label` to the icon-only buttons.
  - test infrastructure: added `@testing-library/angular`, `@testing-library/dom`, `@testing-library/user-event` and `@vitest/coverage-v8`. Added `zone.js` as a dev dependency and set the libraries test `buildTarget` to the (zoneless) app build: for library targets the Angular unit test builder otherwise tries to load `zone.js`, which was resolvable only via a transitive pnpm dependency and failed to import. Tests remain zoneless. Run with e.g. `ng test @myrmidon/cadmus-part-tes-site-resources --watch=false` (add `--coverage` for a coverage report).
- 2026-10-06: updated Angular and packages (still using Reactive forms).
- 2026-09-25: updated Angular and packages.
- 2026-07-27: ⚠️ upgraded `maplibre-gl` 5→6 and `@maplibre/ngx-maplibre-gl` 21→22. MapLibre v6 dropped its UMD/CommonJS build and ships ESM-only, which breaks the worker script lookup under Angular's esbuild bundler (`import.meta.url` resolves to the bundled chunk, not to `maplibre-gl.mjs`, so the default worker URL 404s and any map using a real source silently hangs instead of firing `load`/`idle`). To fix, repeat in any workspace using MapLibre:
  - in `angular.json`, remove `"maplibre-gl"` from `allowedCommonJsDependencies` (no longer needed, v6 has no CommonJS build) and add an `assets` entry copying the worker + its dependency chunk as static files:

    ```json
    {
      "glob": "maplibre-gl-{worker,shared}.mjs",
      "input": "node_modules/maplibre-gl/dist",
      "output": "assets/maplibre-gl"
    }
    ```

  - in `main.ts`, call `setWorkerUrl` from `maplibre-gl` before `bootstrapApplication`, pointing at the copied asset (respects `<base href>`):

    ```ts
    import { setWorkerUrl } from 'maplibre-gl';
    setWorkerUrl(new URL('assets/maplibre-gl/maplibre-gl-worker.mjs', document.baseURI).toString());
    ```

  - verified with a headless Chrome smoke test (GeoJSON source + `idle` event): without the fix the map never reaches `idle`; with it, it loads correctly.
  - no other code changes were needed: `@import 'maplibre-gl/dist/maplibre-gl.css';` path, TS target (`ES2022`), and CSP are all unaffected by v6.
  - ℹ️ not fixed here: `@myrmidon/cadmus-geo-location`'s own `package.json` still declares peer deps on `maplibre-gl@^5` / `@maplibre/ngx-maplibre-gl@^21` — harmless with pnpm (peers are resolved from what's hoisted) but worth bumping upstream.
- 2026-07-21: updated Angular and packages.
- 2026-03-13: ⚠️ migrated to new [Monaco wrapper](https://vedph.github.io/cadmus-doc/history/20260613-monaco.html).
- 2026-06-10: ⚠️ upgraded to Angular 22.

## 0.0.4

- 2026-03-22:
  - 🆕 added facet editor, updating app routes and admin menus accordingly.
  - updated Angular and packages.
- 2026-03-19:
  - updated Angular and packages.
  - removed `@myrmidon/cadmus-ui-pg`.
- 2026-03-18: migrated shell app to M3 themes and added dark theme support to components.

## 0.0.3

- 2026-03-03: ⚠️ migrated to zoneless with the following changes:
  - in `app.config`, replaced `provideZoneChangeDetection({ eventCoalescing: true }),` with `provideZonelessChangeDetection(),`.
  - in `main.ts`, removed `import 'zone.js';`. No need to change `angular.json` which had no reference to zone.
  - uninstalled `zone.js`
- 2026-03-03: updated packages.
- 2026-03-02:
  - updated Angular and packages.
  - ⚠️ migrated to `OnPush`.
- 2026-02-25:
  - minor fix to login page.
  - updated Angular and packages.
- 2026-02-22: updated Angular and packages.

## 0.0.2

- 2026-02-18: initial release after completing models.

## 0.0.1

- initial release without custom parts.
