# src/bun/services/export-file.ts

- `checkExportFile` takes a folder from `FileAccess` (only folders the user picked, plus Downloads), checks the file name with the shared `exportFileNameError`, resolves the path and checks that its parent is exactly the folder, checks that the folder is still a directory, and reports whether the file exists. The export page calls it before a start; `startTask` calls `requireWritableExportFile`, which refuses an existing file unless the request says `isOverwriting`.
- `removeExportLeftovers` is the task queue's `cleanUp`: for an export that did not finish (canceled or failed) it deletes the task's hidden `.partial` and `.spool` files, never the final file.
