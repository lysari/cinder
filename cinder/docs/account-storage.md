# src/bun/services/account-storage.ts

Keeps accounts and the user's OAuth client across restarts, and decides which OAuth client a sign-in uses. The main process creates it with `accounts.json` in `Utils.paths.userData` (`~/Library/Application Support/app.cinder.desktop/<channel>/` on macOS) and loads it before the window opens.

## Where each value lives

| Value | Place |
|---|---|
| Account id, type, emulator host, port and project ids, service account project and client email, Google email, the source (`user` or `built-in`) and id of the OAuth client that issued a Google user's token | `accounts.json` (`oauthClientSource`, `oauthClientId`) |
| The OAuth client id from settings | `accounts.json` (`oauthClientId`) |
| A service account's private key | keychain item named after the account id, JSON `{ privateKey }` |
| A Google user's refresh token, and the secret of the user client that issued it | keychain item named after the account id, JSON `{ refreshToken, clientSecret }`; `{ refreshToken }` only for a built-in client account |
| The OAuth client secret from settings | keychain item `oauth-client-secret` |
| The built-in OAuth client | not stored; the `builtInOAuthClient` option, bundled into the main process at build time |

The keychain items use `Bun.secrets` (macOS Keychain, generic passwords) under the service name `app.cinder.desktop/<channel>`, the path of `userData` relative to `appData`, so the dev and stable builds never share items. `Bun.secrets` works in the Bun 1.4.0 runtime Electrobun bundles into the app, from the main process's worker thread; there is no file fallback.

## Hidden constraints

- `accounts.json` is written atomically: a temporary file next to it, created with mode `0600`, then renamed over it. The folder is created with mode `0700`. `node:fs/promises` `writeFile` is used instead of `Bun.write` because only it sets the mode at creation.
- Client precedence: `getOAuthClient` returns the user's saved client (as `ActiveOAuthClient`, the client with its source), otherwise the built-in client, otherwise `null`. `getOAuthClientSettings` (the only form the webview sees) names the active source and the user's client id, never a secret. `removeOAuthClient` rewrites the file without `oauthClientId` first and deletes `oauth-client-secret` afterwards; accounts signed in with that client keep their own copy of its secret.
- A built-in client account resolves its secret from `builtInOAuthClient` on `load`, only when the bundled client id equals its stored `oauthClientId`. Otherwise (a build without that client) it still loads with `oauthClientSecret: null` and stays listed; resolving it throws "… Sign in again with Google to use it." (`SIGN_IN_AGAIN_MESSAGE` in `database-settings.ts`, thrown there and in `project-listing.ts`).
- A Google user stored without `oauthClientSource` (accounts added before built-in clients existed) is read as a `user` client account.
- `addGoogleUser` adds a signed-in Google user, or, when that email is already added, replaces its token and client under the same id: it overwrites the keychain item first and restores the old one if the file write fails.
- `add` stores the secret first and the file second; if the file write fails it deletes the secret again. `remove` rewrites the file first and deletes the secret afterwards.
- `load` skips an account whose keychain item is missing (it logs the account id, never a secret) and throws on a file that is not valid, so a broken file is never overwritten by an empty list.
- An account is a duplicate when its type and label match an existing one (`host:port`, the client email, or the Google email); `add` rejects it.
- `list` returns `AccountSummary` values for the webview; only the main process sees the secrets, through `find`.
- A keychain item created by one Bun binary may prompt for access when another binary (a different build of Cinder) reads it.
