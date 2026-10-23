# src/worker/tasks/export.ts

The `export` task: streams documents from a collection (optionally with every subcollection), a collection group, a structured query or one document into a file. Formats: Cinder JSON and NDJSON (`cinder-json.md`), readable JSON, CSV (`csv-values.md`).

## Flow

1. The client is created with `useBigInt: true`, so integers and doubles keep their stored type, and documents are encoded with `encodeBigIntDocument`.
2. A count aggregation runs beside the export for the progress bar (`totalDocuments`): the collection, the group, or the query with its limit; a single document counts 1. A recursive export has no total. A failed count is only logged.
3. Pages of 500 documents (`READ_PAGE_SIZE`) are read with `readQueryPages` (`firestore-query.md`) ordered by document id, written, and flushed to disk after each page. Collections and subcollections are read with `collection-reader.md`, which reads the first pages of upcoming subcollections ahead, so memory holds a few pages per nesting level.
4. With subcollections, after each page the subcollections of its documents are listed in parallel and exported depth first, sorted by id (`collection-reader.md`). Documents that do not exist but have subcollections are not visited by the collection query, so their subcollections are skipped; a document export with subcollections does visit them.
5. The file is written as `.<name>.<taskId>.partial` in the chosen folder and renamed over the final name when complete, so an existing file stays intact until the export succeeds.

## Readable JSON

An array of objects, one line each: `__path`, `__id`, then the fields in the readable mapping (`firestore-value-json.md`). A field named `__path` or `__id` is replaced by the metadata.

## CSV header

The header is the union of every flattened field of every document, which is only known at the end. Instead of reading Firestore twice, the first pass writes each row as a JSON object of cells to a hidden spool file `.<name>.<taskId>.spool` next to the export while collecting the column names (memory holds the column set, not the documents); the second pass writes the header (`__path`, `__id`, then the other columns sorted) and turns each spooled row into a CSV line. Cells are quoted when empty, when they hold `"`, `,`, CR or LF, or when they start or end with whitespace; `null` is an unquoted empty cell, so an empty string and null stay apart. Lines end with CRLF; there is no byte order mark.

## Cancel and failure

A failure deletes the partial and spool files before the error is reported. Cancel kills the process, so the main process deletes them (`removeExportLeftovers` in `export-file.md`) before it reports the task as canceled.

## Progress

`reads` counts documents read, `bytes` counts UTF-8 bytes written to the export file (not the spool).
