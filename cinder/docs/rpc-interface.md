# src/shared/interfaces/rpc.interface.ts

The one Electrobun RPC schema between the main process (`bun`) and the webview.

Webview → main requests:

| Request | Params | Response |
|---|---|---|
| `startTask` | `TaskRequest` | task id |
| `cancelTask` | `{ taskId }` | nothing |
| `listAccounts` | none | `AccountSummary[]` |
| `addEmulatorAccount` | `EmulatorAccountForm` | `AccountSummary` |
| `importServiceAccount` | none (opens a file dialog) | `AccountSummary`, or `null` when the dialog is canceled |
| `removeAccount` | `{ accountId }` | nothing (deletes the keychain secrets too) |
| `getOAuthClient` | none | `{ clientId }` or `null`; never the secret |
| `setOAuthClient` | `{ clientId, clientSecret }` | `{ clientId }` |
| `signInWithGoogle` | none | `AccountSummary` once the browser flow ends |
| `cancelGoogleSignIn` | none | nothing |
| `listProjects` | `{ accountId }` | `Project[]` |
| `listDatabases` | `{ accountId, projectId }` | `ProjectDatabases` |
| `listCollections` | `{ database, documentPath }`, `null` for root collections | collection ids, sorted |
| `listDocuments` | `{ database, collectionPath, pageSize, startAfterId }` | `DocumentPage` `{ documents, hasMore }` |
| `getDocument` | `{ database, documentPath }` | `FirestoreDocument` or `null` |
| `createDocument` | `{ database, collectionPath, documentId, fields }`, `documentId: null` for a generated id | the stored `FirestoreDocument`; fails when the id exists |
| `updateDocument` | `{ database, documentPath, changedFields, deletedFieldNames }` | the stored `FirestoreDocument`; fails when the document does not exist |
| `setDocument` | `{ database, documentPath, fields }` | the stored `FirestoreDocument` (every field replaced) |
| `deleteDocument` | `{ database, documentPath, isRecursive }` | nothing; subcollections go only with `isRecursive: true` |

The document requests run in the database's browse session (see `browse-sessions.md` and `browse-session.md`). Their params are checked by `src/bun/browse-request-parser.ts`: paths must be valid collection or document paths, the page size 1 to 500, ids and field names valid, and every value a well-formed tagged value at most 20 levels deep with no array directly inside an array.

Main → webview messages: `taskUpdated(update: TaskUpdate)`, one per batch.

## Hidden constraints

- `BunRequests` and `WebviewMessages` are `type` aliases, not interfaces: Electrobun's `RPCSchema` requires maps that fit an index signature, and TypeScript interfaces do not.
- A request without params declares `params: undefined`; Electrobun requires the `params` key.
- `RPCSchema` is imported as a type from `electrobun/rpc`, which only holds the shared RPC types, so the webview can import this file without pulling in main-process code.
