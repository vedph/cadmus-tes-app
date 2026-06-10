# History

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
