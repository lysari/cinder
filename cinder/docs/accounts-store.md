# src/mainview/app/core/stores/accounts.store.ts

App-wide signal store for accounts, their projects and databases, the saved OAuth client and the sign-in state.

- Projects are cached per account and databases per account and project; a value is loaded once and reloaded only after a failure. Removing an account drops both caches for it.
- Adding an account appends its summary to the loaded list instead of reloading it.
- `isSigningIn` stays true while the main process waits for the browser; the status bar reads it.
- `labelOf` returns an account's label, or the raw id while the accounts load or when the id is unknown; the explorer breadcrumbs use it.
