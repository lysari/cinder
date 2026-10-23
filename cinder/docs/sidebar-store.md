# src/mainview/app/shared/layout/main-layout/sidebar.store.ts

Which account, project and database rows of the sidebar are expanded. Provided by `MainLayoutComponent`, so the sidebar and the command palette share it.

- Keys: the account id, `<accountId>/<projectId>`, and the JSON array `[accountId, projectId, databaseId]` for a database.
- It starts from `ViewStateStore.sidebarExpandedIds` (restored at start) and writes every change back, so expansion survives restarts.
- `loadExpanded()` (called once by the sidebar) loads the accounts, then the projects of each expanded account, the databases of each expanded project and the root collections of each expanded database, so a restored tree shows its contents without clicks.
- `expandProject` and `expandDatabase` also expand their parents, so a database chosen in the command palette is visible in the sidebar.
