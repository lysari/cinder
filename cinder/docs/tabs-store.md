# src/mainview/app/core/stores/tabs.store.ts

Every page opens in a tab. A tab is `{ id, url }` (`Tab` in `src/shared/interfaces/app-state.interface.ts`); its title is derived from the URL by `routeContextOf` (`shared/utils/route-context.ts`), never stored.

## Model

- There is always at least one tab. The first one opens the start page.
- The active tab follows the router: every `NavigationEnd` writes its URL into the active tab, so a plain click navigates the current tab.
- `activate(id)` sets the active tab first, then navigates to its URL. Pages that keep state per tab (the query page) read `activeTabId` together with their route inputs.
- `openInNewTab(url, isActivating)` inserts the tab right after the active one. Cmd/Ctrl+click opens in the background, like a browser; Cmd+T (`newTab`) opens the start page and activates it.
- `close(id)` activates the right neighbour of a closed active tab, else the left one; closing the last tab leaves a fresh start tab. Closing a background tab does not navigate.
- `activateNext` / `activatePrevious` wrap around.
- At most `MAX_TABS` (100) tabs; beyond that "New tab" is disabled and new tabs are not opened.
- `restore(tabs, activeTabId)` (from `ViewStateStore.restore`, which runs as an app initializer) replaces the tabs and writes the active URL into the address with `Location.replaceState`, so the router's first navigation opens the restored tab instead of `/`.

## Page state per tab

Page components are not kept alive between tabs: switching tabs navigates, and the page reloads its data (a collection page reads its first page again). State that a store already keeps survives: the query page keys its editor state by tab id plus database and collection (`query-store.md`), so two tabs on the same query keep separate editors.

## Shortcuts and links

- Cmd+T, Cmd+W, Cmd+Shift+[ and Cmd+Shift+] are native menu items (`Tab` menu, `bun-index.md`); the main process forwards them as `menuActionInvoked` messages and `MainLayoutComponent` calls the store. They are not webview key handlers, so they work while focus is in an input or the code editor, and fire once.
- Cmd/Ctrl+click on a link: Electrobun's webview preload catches modifier clicks on every `<a>` in the capture phase on `window` (before any page listener), cancels them and emits a `new-window-open` webview event to the main process. The main process turns an in-app link (`views://mainview/index.html#/…`) into a `tabOpenRequested` message with the router URL (`tabUrlOfLink`). The preload also emits `new-window-open` with `isSPANavigation: true` when the router pushes history while Cmd is held (e.g. right after Cmd+Shift+]); those are ignored, otherwise every shortcut would open a duplicate tab. While Cmd is held the preload also drops the `pushState` itself, so the address bar hash can lag behind the router; nothing in Cinder reads it.
- Cmd/Ctrl+click on a table row (not a link) is handled by `DocumentViewsComponent`, which opens the document in a background tab itself.
