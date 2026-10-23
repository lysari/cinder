# src/worker/firestore-client.ts

Creates the `@google-cloud/firestore` client from resolved `DatabaseSettings`. The optional second argument passes `useBigInt` through; browse sessions and the export, import and CSV load tasks set it so integers and doubles keep their stored type (see `firestore-value-decoder.md`), task scripts leave it off.

## Transport

The SDK runs under Bun over gRPC: writes, reads, queries, `listCollections` and `onSnapshot` listeners all work against the emulator, both from source and from the `bun build` bundle. `preferRest: true` does not work against the emulator: the REST fallback asks google-auth-library for Application Default Credentials and fails with "Could not load the default credentials". Keep the default gRPC transport.

## Emulator

- `ssl: false` makes the SDK treat the host as the emulator and send `Authorization: Bearer owner`.
- `clientOptions.universeDomain` is set because, with no credentials, google-gax asks google-auth-library for the universe domain. That lookup falls back to Application Default Credentials and probes the GCE metadata server, which can stall the first request by about 3 seconds and prints a `MetadataLookupWarning`. Naming the universe domain skips the lookup.

## Credentials

- A service account passes `{ type: "service_account", client_email, private_key }` and google-auth-library builds a JWT client.
- A Google user passes `{ type: "authorized_user", client_id, client_secret, refresh_token }` and google-auth-library builds a `UserRefreshClient`. No SDK patch is needed.
- The SDK's `Settings["credentials"]` type only lists `client_email` and `private_key`, so the authorized-user shape is cast to it. At runtime the SDK hands the whole object to google-auth-library.
