# src/mainview/app/core/stores/view-state.store.ts

The webview side of the state that survives restarts (`app-state-storage.md`).

- `restore()` runs as an app initializer (`app.config.ts`) before the router's first navigation. It asks the main process for the saved `ViewState` (`getViewState`) and hands each part to its owner: tabs to `TabsStore.restore`, and keeps `sidebarExpandedIds`, `documentView` and `queryPages` in its own signals. A missing or failed answer starts with defaults.
- `documentView` is the one Table / Tree / JSON choice shared by the collection page and the query results.
- `sidebarExpandedIds` and `queryPages` are snapshots their owners keep current: `SidebarStore` (main layout) and `QueryStore` (query route) read them when they are created and write them back from an effect. Until the query page is first opened the restored query pages stay as they were, so they are saved unchanged.
- `snapshot` combines everything and drops query pages whose tab was closed. An effect sends it with the `saveViewState` message whenever its JSON changes, and only after `restore()` finished, so the saved state is never overwritten by the defaults of a starting app. The main process debounces the file write.
