# Cadmus TES App

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 21.1.2.

- [Cadmus TES backend](https://github.com/vedph/cadmus-tes)
- [Cadmus documentation](https://vedph.github.io/cadmus-doc)

## Docker

🐋 Quick Docker image build:

1. update version in `env.js` and `ng build --configuration production`.
2. `docker build . -t vedph2020/cadmus-tes-app:0.0.1 -t vedph2020/cadmus-tes-app:latest` (replace with the current version).

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
