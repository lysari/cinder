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
| `runQuery` | `RunQueryParams` `{ database, query, pageSize, startAfter }`, `startAfter` `{ documentPath, documentCount }` or `null` | `DocumentPage` |
| `countQuery` | `CountQueryParams` `{ database, query }` | the number of matching documents, at most the query's limit |
| `getDefaultExportFolder` | none | the Downloads folder |
| `chooseExportFolder` | none (opens the folder dialog) | the folder, or `null` when canceled; the folder becomes writable (`file-access.md`) |
| `checkExportFile` | `{ folderPath, fileName, format }` | `{ filePath, isExisting }` (`export-file.md`) |
| `chooseImportFile` | none (opens the file dialog) | `ImportFileSummary` (`import-file.md`), or `null` when canceled |

The document requests run in the database's browse session (see `browse-sessions.md` and `browse-session.md`). Their params are checked by `src/bun/browse-request-parser.ts` (tagged values with the shared `firestore-value-parser.ts`, queries with `structured-query-parser.ts`): paths must be valid collection or document paths, the page size 1 to 500, ids and field names valid, and every value a well-formed tagged value at most 20 levels deep with no array directly inside an array. `runQuery` and `countQuery` also check the query's shape (known target type, operators, directions; filter values only string, integer, double, boolean, null, timestamp or a list of those) and then runs the shared `validateQuery` (`query-validation.md`), rejecting the first issue as "The query cannot run: …".

`startTask` takes one of eight task requests, checked by `src/bun/task-request-parser.ts`: `run-script`; `export` (source, format, folder from `FileAccess`, file name by `exportFileNameError`, `isOverwriting`; an existing file without `isOverwriting` is refused); `import` (a picked file, Cinder JSON/NDJSON or plain JSON, target original paths or a collection — plain JSON only into a collection — and write mode); `analyze-csv` (a picked file); `load-csv` (a picked file, delimiter, collection, id column, column mappings with valid dotted names and no duplicate or value-and-map conflicts, a known time zone, write mode); `bulk-update` (a valid query, the operations checked by the shared `validateBulkUpdate` with every value parsed as a tagged value, `isDryRun`; `bulk-update-task.md`); `copy` (a collection or document source, a destination target and path checked by the shared `copyRequestError`, `isMove`, `isRecursive`, write mode, `isRewritingReferences`; `copy-task.md`); `delete-collection` (a collection path or a valid query; `delete-collection-task.md`). Export, bulk update and delete queries go through the same `parseStructuredQuery` and `validateQuery` as `runQuery`. The typed confirmation of the delete page is a safeguard in the page only.

More requests:

| Request | Params | Response |
|---|---|---|
| `startLive` | `LiveQueryParams` `{ listenerId, database, query, limit }` | nothing, once the listener is attached; updates follow as `liveUpdated` messages |
| `stopLive` | `{ listenerId }` | nothing; an unknown id is ignored |
| `getViewState` | none | the saved `ViewState`, or `null` |

`startLive` is checked like `runQuery` (the query with `parseValidQuery`), plus a listener id of 1 to 64 letters, digits or dashes (the webview makes it with `crypto.randomUUID()`, so updates can be matched before the request answers) and a `limit` of 1 to `MAX_LIVE_DOCUMENTS` (1000).

Main → webview messages: `taskUpdated(update: TaskUpdate)`, one per batch; `liveUpdated(update: LiveUpdate)` (`browse-sessions.md`); `menuActionInvoked(action: MenuAction)` for the Tab and View menu items; `tabOpenRequested(url)` with the router URL of a Cmd/Ctrl+clicked link.

Webview → main messages: `saveViewState(state: ViewState)` (`app-state-storage.md`). Messages that bun receives are declared in `bun.messages` of the schema, those the webview receives in `webview.messages`.

## Hidden constraints

- `BunRequests` and `WebviewMessages` are `type` aliases, not interfaces: Electrobun's `RPCSchema` requires maps that fit an index signature, and TypeScript interfaces do not.
- A request without params declares `params: undefined`; Electrobun requires the `params` key.
- `RPCSchema` is imported as a type from `electrobun/rpc`, which only holds the shared RPC types, so the webview can import this file without pulling in main-process code.
