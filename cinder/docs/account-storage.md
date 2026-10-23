# src/bun/services/account-storage.ts

Keeps accounts and the user's OAuth client across restarts. The main process creates it with `accounts.json` in `Utils.paths.userData` (`~/Library/Application Support/app.cinder.desktop/<channel>/` on macOS) and loads it before the window opens.

## Where each value lives

| Value | Place |
|---|---|
| Account id, type, emulator host, port and project ids, service account project and client email, Google email, the OAuth client id that issued a Google user's token | `accounts.json` |
| The OAuth client id from settings | `accounts.json` (`oauthClientId`) |
| A service account's private key | keychain item named after the account id, JSON `{ privateKey }` |
| A Google user's refresh token and the secret of the client that issued it | keychain item named after the account id, JSON `{ refreshToken, clientSecret }` |
| The OAuth client secret from settings | keychain item `oauth-client-secret` |

The keychain items use `Bun.secrets` (macOS Keychain, generic passwords) under the service name `app.cinder.desktop/<channel>`, the path of `userData` relative to `appData`, so the dev and stable builds never share items. `Bun.secrets` works in the Bun 1.4.0 runtime Electrobun bundles into the app, from the main process's worker thread; there is no file fallback.

## Hidden constraints

- `accounts.json` is written atomically: a temporary file next to it, created with mode `0600`, then renamed over it. The folder is created with mode `0700`. `node:fs/promises` `writeFile` is used instead of `Bun.write` because only it sets the mode at creation.
- `add` stores the secret first and the file second; if the file write fails it deletes the secret again. `remove` rewrites the file first and deletes the secret afterwards.
- `load` skips an account whose keychain item is missing (it logs the account id, never a secret) and throws on a file that is not valid, so a broken file is never overwritten by an empty list.
- An account is a duplicate when its type and label match an existing one (`host:port`, the client email, or the Google email); `add` rejects it.
- `list` returns `AccountSummary` values for the webview; only the main process sees the secrets, through `find`.
- A keychain item created by one Bun binary may prompt for access when another binary (a different build of Cinder) reads it.
