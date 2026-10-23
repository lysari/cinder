# Cinder

Cinder is a desktop client for Cloud Firestore. It browses collections and documents, runs queries, and imports or exports data for Google accounts, service accounts, and the local Firestore emulator.

The current build has the app shell (window, menu, layout), the task pipeline that runs JavaScript scripts against Firestore, accounts (the sidebar lists each account's projects, databases and root collections), and the data explorer: collections as a table, tree or JSON with paging, and documents with a typed field editor, create and delete. Queries and import/export arrive in later changes.

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

Integers and doubles are shown with their stored type. Writing from Cinder keeps 64-bit integers exactly, but the Firestore SDK stores any whole number as an integer, so a double such as `2.0` cannot be written as a double; the editor says so under the input.

## Typecheck and test

```sh
bun run typecheck
bun run test
```

`typecheck` checks the main process with `tsc` and the Angular app, templates included, with `ngc`. Tests use `bun:test` and live in `tests/`, mirroring `src/`. The worker, task queue, browse session, and account storage tests run against the Firestore emulator, so start it first with `bun run emulator`; each test writes under its own collection in `demo-cinder` and deletes it afterwards. The account storage tests also write keychain items under a random `app.cinder.desktop.test-…` service and delete them afterwards. The Google sign-in and project listing tests use local fake servers and never reach Google.

## Build

```sh
bun run build
```

The stable build goes to `build/stable-macos-arm64/` and the distributable `.dmg` and update bundle to `artifacts/`.

## Project layout

- `src/bun/`: Electrobun main process: window, application menu, RPC handlers and their request parsers; `services/` holds the task queue, browse sessions, account storage, Google sign-in, and project listing.
- `src/worker/`: the worker process: one per running task (`tasks/` holds one file per task type), or a browse session per database with `--browse-session`; `utils/` holds the value encoder and decoder.
- `src/shared/interfaces/`: contracts shared by the main process, worker, and webview: RPC schema, tasks, browse operations, accounts, projects, and encoded Firestore values. `src/shared/constants/` holds the account input rules, page sizes and Firestore value limits both sides check; `src/shared/utils/` the path and value validation both sides use.
- `src/mainview/`: Angular webview. Global design tokens live in `src/mainview/styles/`.
- `electrobun.config.ts`: app identity and build inputs. `hutch.config.ts`: Electrobun version pin and package manager.
