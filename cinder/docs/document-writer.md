# src/worker/utils/document-writer.ts

`DocumentWriter` is the write path of every task that writes many documents: import, CSV load, bulk update, copy/move and delete-collection.

- One `BulkWriter` per Firestore client, created on first use, so a cross-database copy writes to the destination and deletes in the source through one writer. Against the emulator (every database of the task) it runs unthrottled; against Firestore it keeps the SDK's 500/50/5 ramp-up so a new collection is not overloaded.
- Retries: deadline exceeded, resource exhausted, aborted, internal and unavailable errors are retried up to 5 attempts (the SDK backs off between them); any other error fails the document at once.
- `write` takes the reference, the data, the write mode and the CSV row number: overwrite is `set`, merge is `set` with `{ merge: true }`, skip is `create`, whose already-exists error counts as a skip, not a failure. `onWritten` runs once the write succeeded; a move uses it to collect the sources it may delete.
- `update` sends an update of dotted field paths with the precondition `lastUpdateTime` of the snapshot it was computed from; a failed precondition is reported as "The document changed after it was read…".
- `delete` deletes one document (subcollections stay). `deleteRecursively` runs the SDK's `recursiveDelete` on its own BulkWriter with the same retry policy, counts each delete through `onWriteResult` and records each failed one; the SDK's summary error is swallowed only when per-document failures were recorded.
- Every queued operation waits while 1,000 are pending, so a fast reader cannot fill memory with queued writes. `flush` waits until every queued operation has finished and its callbacks ran.
- `fail` records a failure (`TaskFailure`: document path, CSV row number, message), counts it in `progress.failures`, and keeps and logs only the first 100 (`MAX_STORED_FAILURES`). `close` waits for every operation, logs how many failures were not listed, and returns the `WriteTaskResult` (written, skipped, deleted and failed counts with the listed failures).
- A value the SDK rejects synchronously (e.g. an invalid field name) is recorded as a failure of that document.
