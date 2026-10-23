# src/worker/tasks/bulk-update.ts

The `bulk-update` task applies an ordered list of operations to every document a `StructuredQuery` matches (a collection, a collection group, or a builder query with filters, orders and limit). The main process checks the request with `validateBulkUpdate` (`src/shared/utils/bulk-update-validation.ts`), which the page uses too.

## How a document is updated

1. The document is read (query pages of 500, `readQueryPages`) with `useBigInt` and encoded as tagged values (`encodeBigIntDocument`), so integers, whole-number doubles and every other type are exact.
2. The operations run in order on a copy of its fields:

| Operation | Effect |
|---|---|
| set | writes the typed value at the dotted path; a non-map on the way becomes a map |
| delete | removes the field; nothing happens when it is missing |
| rename | moves the value to the new path; a document without the field is left alone by this operation; when the new path already holds a value and overwriting is off, the whole document is refused |
| increment | integer + integer stays an integer (a sum beyond the signed 64-bit range refuses the document); with a double on either side the result is a double; a missing or non-number field becomes the increment value |
| array union | appends each value the array does not hold yet (once); a missing or non-array field becomes the list of values |
| array remove | removes every item equal to one of the values; a missing or non-array field becomes an empty array |
| server time | the field is written as `FieldValue.serverTimestamp()` |

Values are equal when their tagged JSON is equal with map keys sorted: `1` (integer) and `1.0` (double) are different values, unlike Firestore's own `arrayUnion`.

3. The changed field paths (a path whose value is unchanged is dropped; a path inside another changed path is written with its parent) are sent in one `update` through `DocumentWriter.update` with the precondition `lastUpdateTime` of the read snapshot. A document that changed after it was read fails with "The document changed after it was read…" instead of losing that change. Values are decoded with `decodeValue`; server-time fields inside a written map are placed into the decoded object.
4. A document whose operations change nothing counts as skipped and is not written; a refused document counts as failed with the reason.

## Hidden constraints

- Each operation is computed in Cinder rather than with `FieldValue.increment`/`arrayUnion`/`arrayRemove`, so the preview shows exactly what is written; the precondition makes that safe against concurrent writers.
- An update can move a document further along the query order (e.g. incrementing the ordered field), so the task keeps the paths it updated and skips them when the cursor meets them again. Memory grows with the number of updated documents.
- A server-time operation must be the last operation touching its field (`validateBulkUpdate`), because the time is only known in Firestore.
- Field paths are dotted strings, as in queries: a field name that contains a dot cannot be addressed.
- The update is not atomic across documents: canceling kills the worker and documents already updated keep the change.

## Dry run

With `isDryRun` it reads the first 20 matches (`BULK_UPDATE_PREVIEW_DOCUMENTS`, fewer when the query's limit is lower), returns a `BulkUpdatePreviewResult` (before/after per changed field, or the refusal reason) and writes nothing.

## Progress

`reads` against `totalDocuments` (a count aggregation of the query with its limit, run beside the task), `writes` (updated), `skips` (unchanged), `failures`.
