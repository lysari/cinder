# Explorer start page

Route: `""` under the main layout, lazily loaded from `features/explorer/explorer.routes.ts`.

The first screen the window shows, built from the explorer's `EmptyStateComponent`.

- With no accounts it shows "No accounts yet", one sentence on what Cinder does, and an "Add account" button that opens `#/accounts/new`.
- With accounts it asks the user to choose a database in the sidebar.
- While the accounts load, or when loading failed, it stays empty; the sidebar shows the status.
- The page fills the content pane of the main layout and centres the empty state in it; the pane scrolls on its own, separate from the sidebar.
