# Explorer document page

Route: `#/explorer/:accountId/:projectId/:databaseId/d/:documentPath` (see `explorer-route.md`).

## Layout

- Header: breadcrumb of the document path.
- Toolbar: copy path (`navigator.clipboard`, which works in the Electrobun webview), refresh (discards unsaved edits), then Revert, Save and delete.
- Body: path, created and updated time (local, UTC in the tooltip), subcollections as links, and the field editor.

## Loading

`DocumentStore` (provided by the page) loads the document and its subcollections in parallel. A document that does not exist but has subcollections shows a note and still lists them.

## Editing

The field editor is `ValueEditorComponent` with the document's fields as the root map (see `value-editor.md`). Every value has a type select (string, integer, double, boolean, null, timestamp, geopoint, reference, bytes, vector, map, array) and an input for that type, validated as the user types (rules in `value-draft.md`). Fields can be added, deleted and renamed; map entries and array items can be added and removed.

- **Save** compares the edited fields with the loaded document and sends `updateDocument` with only the changed top-level fields and the deleted names. A rename is the old name deleted and the new name set in that same update. Save is disabled while nothing changed, while any input is invalid, and while the write is pending.
- After a save the page shows the document as stored, from the update's answer.
- A failed save shows its error above the editor and keeps the edits.
- **Revert** restores the loaded document's fields.

## Deleting

Delete opens an inline confirmation. A checkbox, off by default, also deletes all subcollections (`recursiveDelete`); without it the subcollections stay. After a delete the page opens the parent collection; a failed delete shows its error in the confirmation.
