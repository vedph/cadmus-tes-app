# History

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
