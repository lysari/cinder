# src/worker/tasks/copy.ts

The `copy` task copies or moves a document or a collection, optionally with every subcollection, to another path in the same database or in a database of another project or account.

## Two clients

The request names the source database (`database`) and `destination.database`. When they differ, the task queue resolves the destination account as well and sends `destinationSettings`; the worker opens a second Firestore client. When they are the same, `destinationSettings` is null and one client serves both sides. Both clients use `useBigInt`.

## Paths

Every document keeps its place relative to the source root: with the source `users` and the destination `people`, `users/dara/orders/1` becomes `people/dara/orders/1`; with the source document `users/dara` and the destination `archive/dara-2`, `users/dara/notes/n1` becomes `archive/dara-2/notes/n1`. Reading uses `readCollection` / `readSubcollections` (`collection-reader.md`), so documents that do not exist but hold subcollections are not visited and their subcollections are not copied.

## Values

Documents are encoded with `encodeBigIntDocument` and written with `decodeFields` on the destination client, so integers (all 64 bits), whole-number doubles, `-0`, NaN, timestamps with nanoseconds, bytes, vectors and nested values arrive exactly. Copying the SDK values directly would not be exact: a whole-number double reads as a JavaScript number and the SDK would write it as an integer.

## References

By default a reference keeps its document path; in another database it then points at that path in the destination database. With `isRewritingReferences`, a reference to a document inside the copied tree is changed to the copied document's path: the source document itself, the documents of a source collection, and with subcollections every document below the root. References outside the tree, and with subcollections off the documents of subcollections, stay unchanged.

## Conflict modes

Overwrite (`set`), merge (`set` with merge), skip (`create`; an existing destination document counts as skipped). All writes go through `DocumentWriter` (`document-writer.md`).

## Move

A move copies each page of documents, waits until those writes have finished (`DocumentWriter.flush`), then deletes the source of every document whose copy succeeded. So for each document:

| Outcome | Source | Destination |
|---|---|---|
| copied, source deleted | gone | written |
| copy failed (listed with the destination path) | stays | unchanged |
| skipped because the destination exists | stays | unchanged |
| copied, delete failed (listed with the source path) | stays | written |

The source collection is empty only when every document moved. Rename is a move inside the same database. Canceling kills the worker; a document whose copy was written right before the cancel can exist in both places.

## Refusals (main process)

`copyRequestError`: the destination path must be a collection path for a collection and a document path for a document; in the same database the destination cannot be the source, a move cannot go inside its source, and a copy with subcollections cannot either (it would read what it writes).

## Progress

`reads` against `totalDocuments` (a count of the collection, or 1 for a document; unknown with subcollections), `writes`, `skips`, `deletes` (moved sources), `failures`. The result is a `WriteTaskResult`; the tasks page words it for copies and moves.
