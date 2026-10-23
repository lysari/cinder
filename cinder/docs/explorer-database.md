# Explorer database page

Route: `#/explorer/:accountId/:projectId/:databaseId`, from `features/explorer/explorer.routes.ts`. The sidebar's database rows link here; the router passes the three params as inputs (`withComponentInputBinding`).

It shows the breadcrumb (account label, project id, database id), a refresh button, and the database's root collections as links to their collection pages, loaded through `CollectionsStore` (shared with the sidebar, so each list loads once). With no collections it shows an empty state; a failed load shows the error.

- The database id `(default)` appears in the URL as `%28default%29`; the router decodes it.
- An unknown account id shows the raw id in the breadcrumb (`AccountsStore.labelOf`).
- The parent route provides `ExplorerApiService` to every explorer page under it.
