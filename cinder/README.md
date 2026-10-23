# Cinder

Cinder is a desktop client for Cloud Firestore. It browses collections and documents, runs queries, and imports or exports data for Google accounts, service accounts, and the local Firestore emulator.

The current build has the app shell (window, menu, layout), the task pipeline that runs JavaScript scripts against Firestore, accounts (the sidebar lists each account's projects, databases and root collections), the data explorer (collections as a table, tree or JSON with paging, and documents with a typed field editor, create and delete), queries built in a form or written in JavaScript, export and import (Cinder JSON, NDJSON, readable JSON and CSV), bulk field updates, copy/move/rename/duplicate of documents and collections (also across databases, projects and accounts), recursive collection delete, a tasks page that follows every long-running task, realtime (Live) results, tabs, a command palette, and window, tabs and editors that come back after a restart.

The app is built with [Electrobun](https://electrobun.dev) 2.0.4: a Bun main process owns windows and credentials, and an Angular 19 webview renders the UI. The main process never loads the Firestore SDK. Browsing runs in one long-lived Bun worker process per database (a browse session, stopped after 5 idle minutes and restarted after a crash); scripts and bulk work run as tasks, each in its own Bun worker process, so canceling a task kills its process and a crash never takes down the app.

## Prerequisites

- [Devbox](https://www.jetify.com/devbox). The repository root's `devbox.json` provides Bun 1.4.2, Node 22, and Java 21 (for the Firestore emulator), and points `HUTCH_HOME` at `cinder/.hutch-home` so the Electrobun toolchain stays inside the project.
- macOS. The application menu is implemented on macOS and Windows only.

Run every command below from the repository root through Devbox:

```sh
devbox run -- 'cd cinder && <command>'
```

## Install

```sh
bun install
bun run prepare:devkit
```

`prepare:devkit` downloads the pinned Electrobun release and generates the SDK in `.hutch/devkit/`, which TypeScript and Vite resolve `electrobun/main` and `electrobun/view` from.

## Run the Firestore emulator

```sh
bun run emulator
```

It serves Firestore on `127.0.0.1:8080` for the project `demo-cinder`.

## Run the app

```sh
bun run dev
```

This builds the webview with Vite into `dist/`, bundles the task worker into `dist/worker.js` (`bun run build:worker`), bundles the main process, and opens the Cinder window.

## Add an account

Click **+** in the sidebar (or **Add account** on the start page) and pick a method:

- **Emulator**: enter the host and port (default `127.0.0.1:8080`) and each project id you use, e.g. `demo-cinder`. The emulator cannot list its projects.
- **Service account**: choose the service account's JSON key file. Cinder opens the key's `project_id` with the roles the service account has.
- **Google account**: Cinder signs in through an OAuth client of your own Google Cloud project, saved once:
  1. In the [Google Cloud console](https://console.cloud.google.com/apis/credentials), open **APIs & Services → Credentials → Create credentials → OAuth client ID** and choose the application type **Desktop app**. Configure the OAuth consent screen first if the console asks; while it is in testing, add your Google account as a test user.
  2. In the same project, enable the **Cloud Firestore API** and the **Firebase Management API**.
  3. Paste the client ID and client secret into Cinder and click **Sign in with Google**. Cinder opens the browser, listens on a random `127.0.0.1` port for Google's answer, and stops waiting after 5 minutes.

  The sidebar then lists the Firebase projects the Google account can see.

Accounts are stored in `~/Library/Application Support/app.cinder.desktop/<channel>/accounts.json` (mode `0600`, no secrets). Private keys, refresh tokens, and the OAuth client secret are stored in the macOS keychain under the service `app.cinder.desktop/<channel>`. Removing an account deletes its keychain item.

## Browse data

Expand a database in the sidebar to list its root collections, and choose one. The collection page shows 50 documents at a time ("Load more" continues by document id) as a table, a tree or read-only JSON. Choose a document to edit its fields: each value has a type (string, integer, double, boolean, null, timestamp, geopoint, reference, bytes, vector, map, array), and Save writes only the changed top-level fields. Timestamps are typed as ISO 8601 with an offset, e.g. `2026-10-23T07:05:00Z`, and shown in local time.

Integers and doubles are shown with their stored type, and writing from Cinder keeps both: 64-bit integers keep every digit and a whole-number double such as `2.0` stays a double.

## Live results

"Live" on a collection's toolbar, or in the results of a builder query, follows the loaded documents in realtime: Cinder attaches a Firestore listener in the database's browse session, limited to the documents on screen (plus one page when everything is loaded, at most 1,000), and applies every added, modified and removed document as it happens, with exact number types. Changed rows flash briefly (a plain highlight when the system asks for reduced motion). Live turns off when you toggle it, leave the page or switch tabs, after 5 minutes without any other request to that database (so a forgotten Live view does not keep reading a production database), and on errors such as a missing index, whose message is shown. Against Firestore every change counts as a read.

## Tabs and the command palette

Every page opens in a tab above the content. A plain click navigates the current tab; Cmd/Ctrl+click on a link (sidebar collections, document ids, breadcrumbs) or a table row opens it in a new background tab. Middle-click or the × closes a tab. Each tab keeps its own page; query editors keep their contents per tab.

The command palette (Cmd+K) searches accounts, projects, databases and loaded root collections, the open tabs and actions (new query, add account, export or import the current collection, show tasks, new or close tab). Choosing an account or project loads its children into the palette, so you can reach any database from the keyboard.

| Shortcut | Action |
|---|---|
| Cmd+T | New tab (start page) |
| Cmd+W | Close tab |
| Cmd+Shift+[ / Cmd+Shift+] | Previous / next tab |
| Cmd+K | Command palette (↑ ↓ move, ↵ choose, esc close) |
| Cmd/Ctrl+click | Open a link or row in a new tab |
| Cmd+Enter | Run the query (builder or JavaScript) |

The shortcuts are items of the Tab and View menus, so they also work while you type in an editor.

## What is remembered

`~/Library/Application Support/app.cinder.desktop/<channel>/app-state.json` (mode `0600`) keeps the window size and position, the open tabs and the active one, which sidebar rows are expanded, the Table / Tree / JSON choice, and each tab's query page (mode, builder form, script). It holds no credentials, documents or results. Writes are debounced and atomic; a damaged file is ignored with a warning and replaced. Delete it to start fresh.

## Query data

Click "Query" on a collection page, or the search button on a database row in the sidebar.

- **Builder**: pick a collection path or a collection group id, add filters (field path, operator, typed value; `in`, `not-in` and `array-contains-any` take a list), orders and a limit. Problems show under each row as you type, using the same rules the main process checks. Run (or Cmd/Ctrl+Enter) queries the database's browse session directly, 50 documents a page with "Load more".
- **JavaScript**: "JavaScript" shows the builder's query as a script (`async function run() { … }` with `db` and `admin.firestore`), which runs as a task in its own process with its `console` output in the console panel; Cancel stops it. Switching back to the builder works while the script still has exactly the generated shape; otherwise the page says why and stays in JavaScript.
- Results show as a table, tree or JSON; a row opens the document. Scripts may return any value, which shows as a tree or JSON. Each tab keeps its query page's mode, builder and script while you browse elsewhere and across restarts.

## Export data

Click "Export" on a collection's toolbar, the download button on a document page, or "Export" on the query page (exports every document the builder query matches). Choose a format, whether to include all subcollections (collections and documents), a folder (Downloads by default; Electrobun has no save dialog, so you pick a folder and type the file name) and a file name. An existing file is only replaced after you confirm.

- **Cinder JSON** (`.json`): lossless, every value type with its exact type, the document paths and a header; format in `docs/cinder-json.md`.
- **NDJSON** (`.ndjson`/`.jsonl`): the same, one document per line, for very large exports.
- **Readable JSON** (`.json`): plain JSON for people and other tools; timestamps, references and bytes become text (`docs/firestore-value-json.md`).
- **CSV** (`.csv`): one row per document with `__path` and `__id`; nested maps become dotted columns, arrays JSON text, timestamps UTC ISO 8601 (`docs/csv-values.md`).

Exports stream to disk page by page; the file appears under its name only when complete, and a canceled or failed export leaves no partial file.

## Import data

Click "Import" on a collection's toolbar or on the database page and choose a file.

- **Cinder JSON / NDJSON**: import to the original paths or into a collection (subcollections keep their place), choosing what happens to existing documents: overwrite, merge, or skip.
- **Plain JSON**: an array (ids from `__id`, otherwise generated) or an object keyed by id, into a collection; numbers become integers or doubles, strings stay strings.
- **CSV**: Cinder analyzes the file first (delimiter, quoting, row count, a type for every column, a preview), then you map each column (include, field name with dots for nesting, type), choose the id column or generated ids and the time zone for dates without an offset.

Imports write in bulk with retries, continue past documents or rows that fail and list them with the reason (and the row number for CSV). Canceling stops the import; documents already written stay.

## Bulk update

Click "Bulk update" on a collection's toolbar, in a sidebar collection's actions menu (the "…" button), or on the query page (every document the builder query matches). Add operations, applied in order to each document: set a field (typed value, dotted path such as `address.city`), delete a field, rename a field (documents without it are skipped; a document whose new field already exists is refused unless you allow overwriting), increment (an integer stays an integer, with a double the result is a double), add to or remove from an array, or set the server time. "Preview" shows the before and after values of the first 20 matching documents without writing; "Run…" counts the matches and asks for confirmation, saying the change is not atomic. Each document is updated only if it did not change since it was read. Details in `docs/bulk-update-task.md`.

## Copy, move, rename and duplicate

The copy button on a collection's toolbar or a document page opens the copy page; "Rename" (collections) and "Duplicate" (documents) open it on that operation. Pick the destination account, project, database and path (a collection path for a collection, a document path for a document), what happens to existing documents (overwrite, merge, skip), whether to include all subcollections, and whether references that point inside the copied tree are rewritten to the copies (off by default: references keep their path). A summary sentence says what will happen before you start. Values stay exact (64-bit integers, whole-number doubles, timestamps with nanoseconds). A move deletes each source document only after its copy is written, so a document that fails stays at the source; rename is a move inside the same database. Documents that hold only subcollections and no fields are not visited. Details in `docs/copy-task.md`.

## Delete a collection

The delete button on a collection's toolbar (or "Delete" in the sidebar menu) deletes the collection with every subcollection at any depth; the delete button on the query page deletes the documents the builder query matches and leaves their subcollections. The page shows the document count and asks you to type the collection path to confirm.

## Tasks

Exports, imports, CSV analysis, bulk updates, copies, deletes and scripts run as tasks in their own processes, at most 2 to 4 at a time. The tasks page (the status bar links to it) lists this session's tasks with live counts, progress bars, the log, results and failures, and a Cancel button.

## Typecheck and test

```sh
bun run typecheck
bun run test
```

`typecheck` checks the main process, the scripts and the tests with `tsc` and the Angular app, templates included, with `ngc`. Tests use `bun:test` and live in `tests/`, mirroring `src/`. The worker, task queue, browse session, and account storage tests run against the Firestore emulator, so start it first with `bun run emulator`; each test writes under its own collection in `demo-cinder` (the copy tests also in `demo-cinder-copy`) and deletes it afterwards. The emulator never forgets a collection path, even after its documents are deleted, and `listCollections` slows down with their number, so restart it after very large test runs. Export and import tests write files in a folder they create in the system temp directory (`TMPDIR`) and delete it. The account storage tests also write keychain items under a random `app.cinder.desktop.test-…` service and delete them afterwards. The Google sign-in and project listing tests use local fake servers and never reach Google.

## Build and package

```sh
bun run build
```

The stable build goes to `build/stable-macos-arm64/Cinder.app` (about 22 MB; the app unpacks its compressed payload on first launch) and the distributable `.dmg` (about 22 MB) and update bundle to `artifacts/`. The packaged app needs nothing installed: it carries its own Bun runtime, and the Firestore worker is a self-contained bundle (`docs/electrobun-config.md`).

### App icon

`icon.iconset/` holds the app icon in every macOS size; `electrobun.config.ts` points `build.mac.icons` at it. The icon is drawn from code by `scripts/generate-icon.ts`; run `bun run icon` to regenerate it after changing the design.

### Not configured: signing, notarization, updates

The build is unsigned, so macOS Gatekeeper warns on other Macs (right-click → Open, or remove the quarantine attribute). To distribute it you would need:

- **Code signing**: an Apple Developer ID Application certificate in your keychain (`security find-identity -v -p codesigning` shows it), `codesign: true` under `build.mac` in `electrobun.config.ts`, and `ELECTROBUN_DEVELOPER_ID="Developer ID Application: Your Name (TEAMID)"` in the build environment.
- **Notarization**: `notarize: true` under `build.mac`, plus either an App Store Connect API key (`ELECTROBUN_APPLEAPIKEYPATH`, `ELECTROBUN_APPLEAPIKEY`, `ELECTROBUN_APPLEAPIISSUER`) or an Apple ID with an app-specific password (`ELECTROBUN_APPLEID`, `ELECTROBUN_APPLEIDPASS`, `ELECTROBUN_TEAMID`).
- **Auto-update**: a host for the files in `artifacts/` (any static HTTPS server or bucket) set as `release.baseUrl` in `electrobun.config.ts`, plus a call to Electrobun's `Updater` in the main process. Without `release.baseUrl` the build skips the update patch (the "no release.baseUrl configured" line in the build output).

## Project layout

- `src/bun/`: Electrobun main process: window, application menu, RPC handlers and their request parsers; `services/` holds the task queue, browse sessions, account storage, Google sign-in, project listing, and the export/import file checks (only folders and files the user picked are used).
- `src/worker/`: the worker process: one per running task (`tasks/`: run-script, export, import, analyze-csv, load-csv, bulk-update, copy, delete-collection), or a browse session per database with `--browse-session`; `utils/` holds the value encoder and decoder, query building, paging and counting, the recursive collection reader, the bulk document writer, file and CSV reading.
- `src/shared/interfaces/`: contracts shared by the main process, worker, and webview: RPC schema, tasks, export, import, CSV, bulk update, copy and delete contracts, browse operations, accounts, projects, and encoded Firestore values. `src/shared/constants/` holds the account input rules, page sizes, Firestore value limits and export/import options both sides check; `src/shared/utils/` the path, value and query parsing and validation both sides use, the query script generator and parser, the Cinder JSON format, CSV value rules, the readable/plain JSON mapping, export file name rules, and the bulk update and copy validation.
- `src/mainview/`: Angular webview: `features/connections`, `features/explorer`, `features/query`, `features/transfer` (export, import and copy pages), `features/bulk-edit` (bulk update and delete pages) and `features/tasks`; `core/stores/tasks.store.ts` keeps every task of the session; components several features render (document views, value cells, the code editor) live in `app/shared/components/`. Global design tokens live in `src/mainview/styles/`.
- `scripts/generate-icon.ts`: draws the app icon into `icon.iconset/`.
- `electrobun.config.ts`: app identity, icon and build inputs. `hutch.config.ts`: Electrobun version pin and package manager.
