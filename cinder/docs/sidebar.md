# src/mainview/app/shared/layout/main-layout/sidebar/sidebar.component.ts

The account tree in the main layout. It loads the accounts once when it is created.

- Expanding an account loads its projects, expanding a project loads its databases, both through `AccountsStore` and cached there; a failed load is retried on the next expand.
- A database row has a chevron and a link to `#/explorer/<accountId>/<projectId>/<databaseId>`, highlighted only while that exact page is open. Clicking the link also expands the row.
- Expanding a database row lists its root collections through `CollectionsStore` (see `collections-store.md`): "Loading collections…", the error, "No collections", or one link per collection to its collection page, highlighted while open. The refresh button on an expanded row (shown on hover or focus) reloads the list.
- The trash button (shown on hover or focus) opens an inline confirmation; after a removal the window returns to the start page, so no page keeps showing a removed account.
