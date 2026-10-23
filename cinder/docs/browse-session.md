# src/worker/browse-session.ts

The browse session side of the worker (`worker.js --browse-session`). The main process side is `browse-sessions.md`.

## Protocol

1. The first IPC message is `BrowseSessionStartMessage` `{ settings }`. The worker creates one Firestore client with `useBigInt: true` and keeps it for the life of the process.
2. Every later message is `BrowseRequestMessage` `{ requestId, operation }`, where `operation` is one `BrowseOperation` from `src/shared/interfaces/browse.interface.ts`.
3. The worker answers each request with `BrowseResponseMessage` `{ requestId, result, error }` as soon as it finishes; requests run concurrently and may answer out of order.

The worker trusts the operation: the main process checked the webview's params with `browse-request-parser.ts` first.

## Operations

| Operation | SDK call | Result |
|---|---|---|
| `listCollections` | `db.listCollections()` or `doc.listCollections()` | collection ids, sorted |
| `listDocuments` | `orderBy(FieldPath.documentId()).startAfter(id).limit(pageSize + 1)` | `{ documents, hasMore }` |
| `getDocument` | `doc.get()` | the document, or `null` when it does not exist |
| `createDocument` | `collection.doc()` or `collection.doc(id)`, then `create` | the stored document |
| `updateDocument` | `update(FieldPath, value, …)` with `FieldValue.delete()` for deleted names | the stored document |
| `setDocument` | `set` (replaces every field) | the stored document |
| `deleteDocument` | `delete()`, or `db.recursiveDelete(doc)` only when `isRecursive` | `null` |
| `runQuery` | `collection` or `collectionGroup`, then `where` per filter (values decoded like writes), `orderBy` per order, `limit`, and `startAfter(lastDocument)` for a cursor | `{ documents, hasMore }` |
| `countQuery` | `buildQuery(...).limit(limit).count().get()` (`countDocuments`) | the number of matching documents, at most the limit |

## Hidden constraints

- Paging is by document id: one extra document is read to know whether another page exists, and the next page starts after the last id the UI holds, so pages never overlap or skip even when documents are added meanwhile before the cursor.
- `runQuery` pages with a cursor of the last loaded document's path and the number of documents already loaded. It reads that document again and passes the snapshot to `startAfter`, so the SDK builds the cursor from every order, including the implicit ones for inequality filters and the document id. That costs one read per page; a cursor document that was deleted fails with "The last loaded document was deleted. Run the query again.", and one whose ordered fields changed continues from its new position.
- `runQuery` reads `min(pageSize + 1, limit − loaded)` documents: the extra one tells whether another page exists, and the query's own limit caps the total over all pages.
- `runQuery` builds the SDK query with `buildQuery` (`firestore-query.md`) from the structured model only; it never evaluates code. The export task builds query exports the same way. Field paths are dotted strings, as in the generated script, so both modes query the same fields.
- A collection query only returns documents that exist. A document that has only subcollections (a "missing" document) is not listed; it can still be opened by path.
- Field names in `updateDocument` are wrapped in `FieldPath`, so a name such as `a.b` is one field, not a nested path.
- Writes read the document back to return it, which costs one read per write.
- gRPC codes `ALREADY_EXISTS` (6) and `NOT_FOUND` (5) become "A document with this id already exists." and "The document does not exist."; other errors pass their message through.
- Firestore stores timestamps with microsecond precision, so nanoseconds below a microsecond are dropped on write.
- Numbers: see `firestore-value-decoder.md`.

## Live listeners

- `listen` (`LiveQueryParams` `{ listenerId, query, limit }`) attaches `buildQuery(db, query).limit(limit).onSnapshot(…)` and answers at once; it refuses an id that is already listening.
- Every snapshot is sent as its own IPC message (not a response): `LiveUpdate` `{ listenerId, kind: "changes", isFirst, changes }`, where each change is `{ type: "added" | "modified" | "removed", document, oldIndex, newIndex }` straight from `docChanges()`. Documents are encoded with `encodeBigIntDocument`, so integers and whole-number doubles keep their exact types. The first snapshot (all documents as `added`) is always sent, even when empty; later snapshots without changes are skipped.
- A listener error (a missing index, a refused permission, a query Firestore rejects at run time) sends `{ listenerId, kind: "stopped", reason }` with the same readable message as request errors, and forgets the listener.
- `unlisten` calls the unsubscribe function; an unknown id is ignored. Because the worker handles IPC messages in order and `listen` registers synchronously, an `unlisten` sent right after a `listen` always finds it.
- Limiting the query bounds the listener to the window the page shows: a document that enters before the end pushes the last one out as a `removed` change, so the window never grows past `limit`.
- On `SIGTERM` (how `BrowseSessions` closes a session: idle, account removed, app quit) the worker unsubscribes every listener and awaits `db.terminate()`, then exits with code 0, so each Listen stream is half-closed before its connection drops. The Firestore emulator fails any commit that has to notify a Listen stream whose connection dropped but which it has not removed yet ("1 CANCELLED: call already cancelled"), so killing a session with open listeners made unrelated writes fail now and then, most often on a freshly started emulator. When closing takes longer than `CLOSE_TIMEOUT_MS` (2 s), e.g. a request to an unreachable host is still pending, the worker exits with code 1. When the main process quits right after closing (app quit), the IPC disconnect exit (`worker-index.md`) can still cut the close short.
