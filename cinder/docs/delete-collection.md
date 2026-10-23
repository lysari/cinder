# Delete collection page

Routes (from `features/bulk-edit/bulk-edit.routes.ts`, built with `shared/utils/bulk-edit-route.ts`):

| URL | Opened from | Deletes |
|---|---|---|
| `#/bulk-edit/delete/<accountId>/<projectId>/<databaseId>/c/<collectionPath>` | the delete button on the explorer collection toolbar, "Delete" in the sidebar collection menu | the collection with every subcollection, at any depth |
| `#/bulk-edit/delete/…/q/<query JSON>` | the delete button on the query page (builder mode, no issues) | the documents the builder query matches; their subcollections stay |

The page states what will be deleted, counts the documents with the `countQuery` request (for a collection the documents of the collection itself, plus a note about its subcollections), says that canceling stops the task and deleted documents stay deleted, and asks the user to type the collection path (for a collection group query, the collection id) to confirm. The delete button stays disabled until the text matches exactly. After a start the tasks page opens on the task.

`DeleteCollectionStore` (provided by the page) holds the count, the starting state and the error.
