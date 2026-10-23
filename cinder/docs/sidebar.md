# src/mainview/app/shared/layout/main-layout/sidebar/sidebar.component.ts

The account tree in the main layout. It loads the accounts once when it is created, then whatever was expanded before the last quit. Expansion lives in `SidebarStore` (`sidebar-store.md`), shared with the command palette.

- Expanding an account loads its projects, expanding a project loads its databases, both through `AccountsStore` and cached there; a failed load is retried on the next expand.
- A database row has a chevron and a link to `#/explorer/<accountId>/<projectId>/<databaseId>`, highlighted only while that exact page is open. Clicking the link also expands the row.
- Expanding a database row lists its root collections through `CollectionsStore` (see `collections-store.md`): "Loading collections…", the error, "No collections", or one link per collection to its collection page, highlighted while open. The refresh button on an expanded row (shown on hover or focus) reloads the list.
- Each collection row has an actions button (shown on hover or focus, and while its menu is open) that opens a small in-app menu below the row: Bulk update (`bulk-update.md`), Copy or move and Rename (`copy.md`), Delete (`delete-collection.md`). Choosing an item, Escape (focus returns to the button) or moving focus out of the row closes it; only one menu is open at a time. It is an in-app menu rather than a native Electrobun context menu: the native one needs a request to the main process and an event back for every click, cannot be driven or tested from the webview, and does not exist on Linux.
- The search button on a database row (shown on hover or focus) opens that database's query page, `#/query/<accountId>/<projectId>/<databaseId>` (`query.md`).
- The trash button (shown on hover or focus) opens an inline confirmation; after a removal the window returns to the start page, so no page keeps showing a removed account.
