# src/bun/services/google-sign-in.ts

Signs a Google user in with the loopback flow for installed apps, using the OAuth client the user saved in settings.

## Flow

1. `start` creates an `OAuth2Client` for the saved client, a PKCE verifier and S256 challenge, and a random `state`.
2. It starts `Bun.serve` on `127.0.0.1` with port `0`; the redirect URI is `http://127.0.0.1:<port>/`. Google accepts any loopback port for a "Desktop app" client.
3. It opens the consent page with `openUrl` (`Utils.openExternal` in the app) asking for `openid email https://www.googleapis.com/auth/cloud-platform`, `access_type=offline` and `prompt=consent`, so Google returns a refresh token every time.
4. The first request to `/` settles the sign-in: the `state` is compared in constant time, an `error` parameter fails it, the `code` is exchanged with the verifier and the same redirect URI, and the ID token is verified (signature, issuer, audience = client id) before its `email` is used.
5. The browser gets a short "Signed in" or "Sign-in failed" page; the server stops right after.

## Ending a sign-in

- A wrong `state`, a Google error or a failed exchange rejects the sign-in; the main process never retries.
- It times out after `SIGN_IN_TIMEOUT_MS` (5 minutes), and `cancel` ends it. Starting a new sign-in cancels the pending one.
- If `openUrl` reports that no browser opened, it fails at once.

The `endpoints` option only exists so tests can point the token and certificate URLs at a fake server.
