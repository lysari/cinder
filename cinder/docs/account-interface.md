# src/shared/interfaces/account.interface.ts

- `Account` is what account storage keeps, secrets included; it never leaves the main process. `AccountSummary` (id, type, label) is what the webview gets; the label is `host:port` for an emulator, the client email for a service account and the email for a Google user.
- `EmulatorAccountForm` is what the add-account form sends; the main process adds the id.
- `DatabaseTarget` is what a task names (account id, project id, database id, `(default)` for the default database); `DatabaseSettings` is what the main process resolves from the two and sends to the worker.
- An `EmulatorAccount` keeps the project ids the user typed, because the emulator cannot list its projects.
- A `GoogleUserAccount` keeps the OAuth client (id and secret) that issued its refresh token, because Google only refreshes a token with the client that issued it. `OAuthClientSettings` is the saved client without its secret.
- `ServiceAccountCredentials` and `AuthorizedUserCredentials` use the snake_case field names of Google's credential JSON, because the worker passes them to google-auth-library unchanged.
