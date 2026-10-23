# src/bun/index.ts

- Loads account storage (see `account-storage.md`) with top-level `await` before the menu and window are created, so every handler and the task queue see the stored accounts. A broken `accounts.json` stops the start and is left untouched.
- Answers the webview's requests (see `rpc-interface.md`). Every request whose params come from the webview is checked first with `parseTaskRequest` or the parsers in `account-request-parser.ts`, so a malformed request rejects the webview's call.
- `findAccount` gives the task queue and the browse sessions the stored account, secrets included; the webview only ever receives `AccountSummary` values.
- The document requests (`listCollections` … `deleteDocument`) are checked with `browse-request-parser.ts` and run in the database's browse session (`browse-sessions.md`). Removing an account also closes its browse sessions, and the `before-quit` event closes them all.
- `importServiceAccount` shows the native open dialog for one `.json` file and reads it with `readServiceAccountKey` (16 KB limit, checked before reading).
- `signInWithGoogle` needs the saved OAuth client and stores the signed-in user with that client, because Google refreshes a token only with the client that issued it.
- The worker path comes from `PATHS.RESOURCES_FOLDER`; see `electrobun-config.md`.
