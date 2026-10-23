# Add account page

Route: `#/accounts/new` under the main layout, lazily loaded from `features/connections/connections.routes.ts`. The "Add account" buttons in the sidebar header and on the explorer start page open it.

Three account type cards (toggle buttons) pick the form below them:

- **Emulator**: host (default `127.0.0.1`), port (default `8080`) and one or more project ids (the emulator cannot list its projects). The fields are validated with the patterns in `src/shared/constants/account-validation.ts`, the same ones the main process checks.
- **Service account**: "Choose key file…" asks the main process to show the native open dialog for a `.json` file. Canceling the dialog does nothing; a file that is not a service account key shows the reason.
- **Google account**: what it shows depends on `OAuthClientSettings` (`source`, `hasBuiltInClient`):
  - Build without a built-in client: instructions for creating a "Desktop app" OAuth client, then the saved client id with "Change", or the client form.
  - Build with a built-in client, no saved client: "Sign in with Google" straight away, and the "Use your own OAuth client" disclosure (`aria-expanded`), which reveals the instructions and the client form; "Cancel" folds it again.
  - Build with a built-in client and a saved client: the saved client id with "Change" and "Use built-in client" (deletes the saved client, `removeOAuthClient`), then "Sign in with Google" with the saved client.

  "Sign in with Google" starts the loopback flow in the browser; while it waits, the page and the status bar (`statusbar.component.ts` in the main layout) say so, and "Cancel sign-in" ends it. No client secret is ever sent to the page. The instruction steps are one `ng-template` (`oauthClientSteps`) rendered in both places it appears. `isEditingOAuthClient` is both the "Change" state and the disclosure's open state.

After an account is added the page returns to the explorer start page, and the new account appears in the sidebar. Errors from the main process show in an alert above the action.
