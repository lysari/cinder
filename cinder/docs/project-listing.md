# src/bun/services/project-listing.ts

Lists the projects of an account and the Firestore databases of a project.

- An emulator account lists the project ids the user typed and only `(default)`: the emulator has no API to list either.
- A service account lists only the `project_id` of its key.
- A Google user lists the Firebase projects it can see with `GET https://firebase.googleapis.com/v1beta1/projects`, 100 per page, following `nextPageToken`. Projects without Firebase do not appear.
- Databases come from `GET https://firestore.googleapis.com/v1/projects/{id}/databases` (not paged). A `403` falls back to `(default)` with a warning that names Google's message; other errors throw `Google answered <status>: <message>`.

## Hidden constraints

- Each call gets a fresh access token from google-auth-library (`JWT` for a service account, `OAuth2Client` with the refresh token for a Google user). A Google user whose client secret is unavailable (`oauthClientSecret: null`, see `account-storage.md`) fails with the "Sign in again" message (`SIGN_IN_AGAIN_MESSAGE` from `database-settings.ts`) before any request.
- A Google user's API calls bill the quota of the project that owns the OAuth client, so the Firebase Management API and Cloud Firestore API must be enabled there.
- The API base URL parameters only exist for tests.
