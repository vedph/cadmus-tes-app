# Cadmus TES App

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 21.1.2.

- [Cadmus TES backend](https://github.com/vedph/cadmus-tes)
- [Cadmus documentation](https://vedph.github.io/cadmus-doc)

## Docker

🐋 Quick Docker image build:

1. `pnpm run build-lib`.
2. update version in `env.js` and `ng build --configuration production`.
3. `docker build . -t vedph2020/cadmus-tes-app:0.0.4 -t vedph2020/cadmus-tes-app:latest` (replace with the current version).

⚠️ Note: to enable Zotero lookup, you must add an `env.local.js` file next to the `env.js` file with a content like this:

```js
// development overrides for env.js
// DO NOT COMMIT THIS FILE TO THE REPOSITORY

// Zotero
window.__env.zoteroApiKey = "...put API key here...";
window.__env.zoteroUserId = "...put Zotero numeric user ID here...";
window.__env.zoteroLibraryId = "...put Zotero numeric library ID here...";
```

Typically you do it in your host by adding a volume in the `docker-compose.yml` script and creating the JS file in the same folder of the script, e.g.:

```yml
  # Cadmus NDP App
  cadmus-tes-app:
    # ...
    volumes:
      - ./env.js:/usr/share/nginx/html/env.js
      - ./env.local.js:/usr/share/nginx/html/env.local.js
```

## History

### 0.0.4

- 2026-03-22:
  - 🆕 added facet editor, updating app routes and admin menus accordingly.
  - updated Angular and packages.
- 2026-03-19:
  - updated Angular and packages.
  - removed `@myrmidon/cadmus-ui-pg`.
- 2026-03-18: migrated shell app to M3 themes and added dark theme support to components.

### 0.0.3

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

### 0.0.2

- 2026-02-18: initial release after completing models.

### 0.0.1

- initial release without custom parts.
