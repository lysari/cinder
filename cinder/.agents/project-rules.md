> Provisional: generated for a new project. Re-run /vibecode-init once the first features exist.

# Project Rules

## Tech Stack
- Language & Framework: TypeScript 5.8 (Electrobun 2.0.4 desktop shell, Angular 19.2 standalone + signals in the webview, built with Vite 6 and `@analogjs/vite-plugin-angular`)
- Runtime: Bun (Electrobun main process and the Firestore worker process)
- Firestore access: `@google-cloud/firestore` in the worker process only; the webview never talks to Firestore
- Package Manager: Bun (`bun.lock`); Hutch delegates package operations to Bun via `hutch.config.ts`
- Toolchain: Devbox at the repository root (`../devbox.json`); Hutch is cached in `.hutch-home/` through `HUTCH_HOME`

## Architecture & Directory Map

```text
cinder/
├── src/
│   ├── bun/                            # Electrobun main process: window, menu, RPC handlers, task queue
│   │   └── services/                   # Main-process services: account storage, Google OAuth, project listing
│   ├── worker/                         # Firestore process: one per running task, plus one long-lived browse session per database
│   │   ├── tasks/                      # One file per task type (run-script, export, import, ...)
│   │   └── utils/                      # Helpers that need the Firestore SDK (value encoder/decoder)
│   ├── shared/                         # Code imported by bun/, worker/ and mainview/
│   │   ├── constants/                  # Validation patterns and limits shared by main process and UI
│   │   ├── interfaces/                 # RPC schema, task, account and Firestore value contracts
│   │   └── utils/                      # Pure helpers: query codegen and parser
│   └── mainview/                       # Angular webview
│       ├── styles/                     # _palette, _fonts, _variables, _global partials + styles.scss entry
│       └── app/
│           ├── core/                   # RPC client service, app-wide signal stores
│           ├── features/
│           │   └── <feature>/          # connections, explorer, query, transfer, tasks
│           │       ├── components/
│           │       │   └── <name>/     # <name>.component.{ts,html,scss}
│           │       ├── pages/
│           │       │   └── <name>/     # <name>.page.{ts,html,scss}
│           │       ├── services/
│           │       ├── stores/
│           │       └── <feature>.routes.ts
│           ├── shared/                 # layout/, components/<name>/, pipes/, utils/ (no domain state)
│           ├── app.component.ts        # Mounts the router only
│           ├── app.config.ts
│           └── app.routes.ts
├── scripts/                            # Build-time scripts (generate-icon.ts draws icon.iconset/, built-in-oauth-client.ts reads the bundled OAuth client)
├── icon.iconset/                       # Generated macOS app icon, all sizes
├── tests/                              # bun:test suites mirroring src/ and scripts/
└── docs/                               # Per-page and per-file docs, git-ignored
```

- `src/bun`: privileged side; owns credentials, spawns workers, answers webview RPC requests.
- `src/worker`: the only code that imports the Firestore SDK. Started as a task worker (one task, streams progress, exits) or with `--browse-session` (fast request/response reads and writes for one database, idle shutdown).
- `src/shared`: types and pure functions only; no Bun, Node, or DOM APIs.
- New UI feature code belongs in: `src/mainview/app/features/<feature>/`
- Shared UI primitives belong in: `src/mainview/app/shared/<kind>/`
- The Angular framework rules apply inside `src/mainview/` (this project has no `angular.json`; Vite builds the app).

## Import Aliases & Paths
- None yet. Use relative imports.

## Naming Conventions
- Files: kebab-case, with Angular suffixes `.component.ts`, `.page.ts`, `.store.ts`, `.service.ts`, `.routes.ts`, `.pipe.ts`, and `.interface.ts` for shared types
- Components / classes: PascalCase
- Functions and variables: camelCase
- Types / Interfaces: PascalCase, no `I` prefix
- Domain terms: `account` (a Google user, service account, or emulator), `project`, `collection`, `document`, `query`, `script`, `task`. Never `connection`, `credential set`, `job`, or `record` for the same things.

## Core Shared Helpers (Do Not Duplicate)
- Webview → main calls: the RPC client service in `src/mainview/app/core/services/`, never `Electroview` directly in a feature.
- RPC contract: `src/shared/interfaces/rpc.interface.ts` is the single schema for both sides.
- Firestore value encoding: the tagged `FirestoreValue` contract in `src/shared/interfaces/firestore-value.interface.ts`; SDK ⇄ tagged conversion in `src/worker/utils/firestore-value-encoder.ts`. The UI renders tagged values and never imports the SDK.
- Utility directories: `src/shared/utils/` (cross-process) and `src/mainview/app/shared/utils/` (UI-only).

## UI & Styling Conventions
- Framework: SCSS with design tokens, no UI kit
- Tokens & Theme: `src/mainview/styles/_palette.scss` (colours, light and dark), `_fonts.scss`, `_variables.scss`; global element rules in `_global.scss`
- Icons: Lucide via `lucide-angular`
- Code editor: CodeMirror 6

## Verification Commands
- Typecheck: `bun run typecheck`
- Test: `bun test`
- Build webview: `bun run build:view`
- Run app: `bun run dev`
- Lint: none yet

## Decisions
- Project state: empty, new project scaffolded from the Electrobun Angular template, answered 2026-10-23
- Location: `cinder/` inside the reverse-engineering workspace, answered 2026-10-23
- Package manager: Bun, answered 2026-10-23
- Styling: SCSS + design tokens (`frameworks/css/rules.md`), answered 2026-10-23
- Tests: `bun:test` in `tests/` mirroring `src/` (`references/file-organization.md` → "Put tests in the project's dedicated test folder"), answered 2026-10-23
- Structure: Electrobun process folders at the top of `src/`, Angular `core/features/shared` inside `src/mainview/app/` (`frameworks/angular/rules.md` → "Directory structure"), answered 2026-10-23
- Code editor: CodeMirror 6, answered 2026-10-23
- Value encoder location: `src/worker/utils/` because it needs SDK classes (deviation from `src/shared/utils/` approved by the orchestrator), answered 2026-10-23
- Icons: Lucide, answered 2026-10-23
- Component and page folders: each component and page lives in its own folder named after it (`components/<name>/<name>.component.{ts,html,scss}`, `pages/<name>/<name>.page.{ts,html,scss}`), following `frameworks/angular/rules.md` → "Directory structure", answered 2026-10-24
- Clean-room: no code, names, assets, or OAuth client copied from the reverse-engineered app; only `../analysis/REPORT.md` informs the architecture, answered 2026-10-23
