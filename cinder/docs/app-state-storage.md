# src/bun/services/app-state-storage.ts

Keeps the window frame and the webview's view state across restarts in `app-state.json` in `Utils.paths.userData` (`~/Library/Application Support/app.cinder.desktop/<channel>/`). The main process loads it before the window opens.

## File

```json
{
	"version": 1,
	"window": { "x": 150, "y": 120, "width": 1111, "height": 777 },
	"view": {
		"tabs": [{ "id": "<uuid>", "url": "/explorer/<account>/<project>/%28default%29/c/users" }],
		"activeTabId": "<uuid>",
		"sidebarExpandedIds": ["<accountId>", "<accountId>/<projectId>", "[\"<accountId>\",\"<projectId>\",\"(default)\"]"],
		"documentView": "table",
		"queryPages": [
			{ "tabId": "<uuid>", "database": { … }, "collectionPath": "users", "mode": "javascript", "form": { … }, "script": "…" }
		]
	}
}
```

`window` and `view` are `null` until first saved. Tab URLs are router URLs (what `Router.url` returns), never `views://` URLs. Nothing secret is saved: no credentials, no query results, no documents.

## Hidden constraints

- Writes are debounced (`APP_STATE_SAVE_DELAY_MS`, 500 ms): every save restarts the timer, so typing in the query editor writes once after the pause. `flush()` writes a pending save at once; the `before-quit` handler calls it, because Electrobun does not await asynchronous work in `before-quit`, so the write is synchronous (`node:fs` `writeFileSync` + `renameSync`).
- Each write goes to a temporary file created with mode `0600` and is renamed over `app-state.json`, so a crash never leaves half a file. The folder is created with mode `0700`.
- `load` validates the whole file with `view-state-parser.ts` (`parseViewState`, `parseWindowFrame`). A file that is not JSON, has another version or fails a check is ignored with a `console.warn` naming the reason; the app starts with defaults and the next save replaces it. Unlike `accounts.json`, losing this file loses nothing important.
- The webview sends its view state with the `saveViewState` message; the main process checks it with the same `parseViewState` before saving, so the file never holds what the loader would refuse.

## view-state-parser.ts

`parseViewState` checks: 1 to `MAX_TABS` tabs with unique ids (letters, digits, dashes) and URLs starting with `/`; the active tab among them; the document view one of `DOCUMENT_VIEWS`; sidebar ids as bounded text; query pages that belong to an open tab, with a valid database target, `null` or a collection path, a known mode, a query form with known target type, operators, value types and directions (field and value texts may hold anything the user is still typing, bounded in length) and a bounded script. `parseWindowFrame` takes whole numbers, at least 480 × 320. Limits live in `src/shared/constants/view-state.ts`.

`tabUrlOfLink` reads the router URL out of Electrobun's `new-window-open` event detail (see `tabs-store.md`).
