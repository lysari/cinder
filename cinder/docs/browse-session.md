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

## Hidden constraints

- Paging is by document id: one extra document is read to know whether another page exists, and the next page starts after the last id the UI holds, so pages never overlap or skip even when documents are added meanwhile before the cursor.
- A collection query only returns documents that exist. A document that has only subcollections (a "missing" document) is not listed; it can still be opened by path.
- Field names in `updateDocument` are wrapped in `FieldPath`, so a name such as `a.b` is one field, not a nested path.
- Writes read the document back to return it, which costs one read per write.
- gRPC codes `ALREADY_EXISTS` (6) and `NOT_FOUND` (5) become "A document with this id already exists." and "The document does not exist."; other errors pass their message through.
- Firestore stores timestamps with microsecond precision, so nanoseconds below a microsecond are dropped on write.
- Numbers: see `firestore-value-decoder.md`.
