# scripts/built-in-oauth-client.ts

Reads the Google OAuth client that `electrobun.config.ts` bundles into the main process.

- `readBuiltInOAuthClient(filePath)` returns `null` when the file is absent, so a build without `google-oauth-client.local.json` behaves as before (users enter their own client).
- A present file must be JSON `{ "clientId", "clientSecret" }` that passes the same `parseOAuthClient` as the Settings form: the id ends with `.apps.googleusercontent.com`, the secret is 1 to 200 characters. Anything else throws, which fails the build.
- A JSON syntax error is reported with a fixed message instead of the parser's, because the parser quotes the text near the error, which may be the secret.
- The committed `google-oauth-client.example.json` holds placeholders that fail validation (`<` is not allowed in a client id), so a copied but unedited example never ships.
