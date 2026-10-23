# Export page

Routes (from `features/transfer/transfer.routes.ts`, built with `shared/utils/transfer-route.ts`):

| URL | Opened from | Source |
|---|---|---|
| `#/transfer/export/<accountId>/<projectId>/<databaseId>/c/<collectionPath>` | "Export" on the explorer collection toolbar | the collection |
| `#/transfer/export/…/d/<documentPath>` | the download button on a document page | the document |
| `#/transfer/export/…/q/<query JSON>` | "Export" on the query page (builder mode, no issues) | the builder query |

The query travels as the JSON of the `StructuredQuery` in one URL segment. The page reads it with `parseStructuredQuery` and `validateQuery`; a link that does not hold a valid source shows an error instead of the form. A builder query without filters, orders and limit becomes a plain collection source (so subcollections can be included) or a collection group source; any other query is exported as a query (the export task pages through it the same way the browse session does, `firestore-query.md`).

## Form

- **Source**: one line describing it, e.g. "collection users" or "query on users (2 filters, 1 orders, limit 100)".
- **Format** (radios): Cinder JSON, NDJSON, readable JSON, CSV. Changing the format changes the file name's extension when it does not fit the new format.
- **Include all subcollections** (collections and documents only): exports every subcollection below, at any depth.
- **Folder**: starts at the user's Downloads folder (`getDefaultExportFolder`); "Choose folder…" opens the native open dialog for folders, because Electrobun 2.0.4 has no save dialog.
- **File name**: starts as the last path segment plus the extension; checked as typed with `exportFileNameError` (the same rules as the main process: no `/ \ :` or control characters, no leading dot, no `..`, at most 200 bytes, an extension of the format).

"Start export" asks the main process to check the file (`checkExportFile`). When the file exists the page asks "Replace it?"; "Replace file" starts the task with `isOverwriting: true`. The new task opens on the tasks page (`#/tasks?task=<id>`).

`ExportStore` (provided by the page) holds the folder, the pending replace question, the starting state and the error; it starts the task through `TasksStore`.
