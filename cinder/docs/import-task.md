# src/worker/tasks/import.ts

The `import` task for Cinder JSON, Cinder NDJSON and plain JSON. Files are streamed in chunks (`readFileChunks`); `progress.bytes` against `progress.totalBytes` drives the progress bar. Writes go through `DocumentWriter` (`document-writer.md`).

## Cinder JSON

Parsed with `@streamparser/json` on the paths `$.format`, `$.version`, `$.rootPath`, `$.exportedAt` and `$.documents.*`, with `keepStack: false`, so one document at a time is held. Values emitted during one chunk are collected and written after the chunk, because the parser's callback cannot wait for the writer. The header is checked (`parseCinderHeader`) when the first document arrives, so a file whose header comes after its documents is refused; a file without documents is still checked at the end.

## Cinder NDJSON

Read line by line (`readTextLines`, LF or CRLF); the first non-blank line is the header. A line that is not JSON ends the task with its line number.

## Targets

- Original paths: each document goes to its `path`.
- A collection: a path below the file's `rootPath` keeps its place below the target (`users/a/orders/1` → `people/a/orders/1`); any other path (collection group exports) becomes `<target>/<last id>`.

## Plain JSON

Parsed on `$.*`. A top-level array gives one document per item: the id is the item's `__id` string, otherwise a generated id; `__id` and `__path` are not written as fields. A top-level object gives one document per key, the key being the id. Values follow `valueFromPlainJson` (`firestore-value-json.md`). An item that is not an object, an invalid id, or a nested array fails that document only.

## Failures

A document that does not parse or that Firestore rejects is recorded with its path and reason and the import continues. A file that cannot be read (invalid JSON, wrong header) ends the task with the reason and how many documents were written before; those stay.
