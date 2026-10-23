# Explorer add document page

Route: `#/explorer/:accountId/:projectId/:databaseId/c/:collectionPath/new`, opened by "Add document" on a collection page.

- **Document id**: "Generated id" (default) shows a random 20-character id made when the page opens, in the style Firestore uses; "Use this id" shows an input checked with the same id rules as the main process. Because the id is fixed before the request, creating again after an unclear failure fails with "already exists" instead of making a second document.
- **Fields**: the field editor with an empty root map (see `value-editor.md`).
- **Create document** sends `createDocument`, which fails with "A document with this id already exists." for a taken id. It is disabled while the id or any field is invalid and while the request is pending. On success the page opens the new document.
- **Cancel** returns to the collection.

`AddDocumentStore` (provided by the page) holds the id choice, the field drafts and the error.
