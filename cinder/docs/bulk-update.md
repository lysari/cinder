# Bulk update page

Routes (from `features/bulk-edit/bulk-edit.routes.ts`, built with `shared/utils/bulk-edit-route.ts`):

| URL | Opened from | Documents |
|---|---|---|
| `#/bulk-edit/update/<accountId>/<projectId>/<databaseId>/c/<collectionPath>` | "Bulk update" on the explorer collection toolbar, the sidebar collection menu | every document of the collection (not its subcollections) |
| `#/bulk-edit/update/…/q/<query JSON>` | "Bulk update" on the query page (builder mode, no issues) | every document the builder query matches; a collection group query reaches every collection with that id |

The query travels as JSON in one URL segment and is read with `parseRouteQuery` (`parseStructuredQuery` + `validateQuery`); a link without a valid source shows an error instead of the form.

## Form

- **Operations**: a `FormArray` the user adds rows to and removes rows from (at least one stays). Each row has the operation (set field, delete field, rename field, increment, add to array, remove from array, set to server time), a dotted field path, and, depending on the operation, the new field path with "Overwrite the new field when it exists", or a typed value in the shared field editor (`value-editor.md`). Choosing an operation resets the value: 1 for an increment, a one-item list for array operations, an empty string otherwise.
- Issues show under each row as the user types: `readBulkUpdateForm` (`shared/utils/bulk-update-form.ts`) checks the typed values, then `validateBulkUpdate` (`bulk-update-task.md`) the same rules the main process applies.

## Preview

"Preview" starts a dry-run `bulk-update` task (`isDryRun: true`) through `TasksStore` and shows its result when it ends: one table row per changed field of the first 20 matching documents (document path, field path, before, after; "missing", "removed", "server time"), "No change" for a document the operations leave as it is, and "Not updated: …" for a document the task would refuse (a rename onto an existing field, an increment beyond 64 bits). Nothing is written. When the operations change after a preview, the page says the preview is out of date. The preview task also appears on the tasks page.

## Run

"Run…" counts the matching documents with the `countQuery` request (a count aggregation in the browse session) and asks "Update N matching documents?", saying that each document is updated on its own, so the change is not atomic, that canceling or a failure leaves the documents already updated changed, and that a document changed meanwhile is listed as failed. With no match it says there is nothing to update. Confirming starts the real task and opens it on the tasks page.

`BulkUpdateStore` (provided by the page) holds the preview task id and the previewed operations, the confirmation count, the busy state and the error.
