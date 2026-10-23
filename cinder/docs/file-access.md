# src/bun/services/file-access.ts

The main process only reads and writes files the user chose: `FileAccess` keeps the resolved paths of the folders picked in the export folder dialog (plus the Downloads folder, the default) and of the files picked in the import dialog, for the life of the app. `parseTaskRequest` and `checkExportFile` reject any other path with "Choose the folder again" / "Choose the file again", so a request from the webview cannot name an arbitrary path.
