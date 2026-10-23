# Copy page

Routes (from `features/transfer/transfer.routes.ts`, built with `copyRoute` in `shared/utils/transfer-route.ts`):

| URL | Opened from |
|---|---|
| `#/transfer/copy/<accountId>/<projectId>/<databaseId>/c/<collectionPath>/<operation>` | the copy and rename buttons on the explorer collection toolbar, "Copy or move" and "Rename" in the sidebar collection menu |
| `#/transfer/copy/…/d/<documentPath>/<operation>` | the duplicate and copy buttons on the explorer document page |

`<operation>` (copy, move, duplicate, rename) only preselects the radio; an unknown value falls back to copy.

## Form

- **Operation**: Copy, Move, Duplicate (documents only: a new id in the same collection, generated when the page opens or typed), Rename (collections only: a new collection path in the same database, a move).
- **Destination** (copy and move): account, project and database selects filled from `AccountsStore` (projects and databases load when an account or project is chosen; changing the account clears the project and database), and the collection or document path. The path starts as the source path plus `-copy` for a copy and as the source path for a move or rename.
- **Existing documents at the destination**: overwrite, merge, skip.
- **Include all subcollections** (on by default) and **Rewrite references to copied documents** (off by default).

The request is checked as the user types with `copyRequestError` (`src/shared/utils/copy-validation.ts`, the same rules the main process applies): the destination path type must match the source (collection or document), the destination cannot be the source, nothing can be moved into itself, and a recursive copy cannot go inside its own source. A valid form shows one summary sentence of what will happen (operation, source, subcollections, destination with account label, project and database, the conflict mode, reference handling, and for a move that each source is deleted only after its copy is written); Start is enabled only then, and the summary becomes the task description. After a start the tasks page opens on the task.

`CopyStore` (provided by the page) holds the starting state and the error. The semantics are in `copy-task.md`.
