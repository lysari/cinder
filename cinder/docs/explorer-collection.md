# Explorer collection page

Route: `#/explorer/:accountId/:projectId/:databaseId/c/:collectionPath` (see `explorer-route.md`). Root collections are opened from the sidebar or the database page, subcollections from a document page or the breadcrumb.

## Layout

- Header: breadcrumb with a link for every collection and document on the path.
- Toolbar: the Table / Tree / JSON switch (`ViewSwitcherComponent`; the choice is app-wide and saved, `view-state-store.md`), "Live", refresh (disabled while Live is on), "Query" (opens the query page with the builder on this collection, `query.md`), "Export" (`export.md`), "Import" into this collection (`import.md`), "Bulk update" (`bulk-update.md`), copy or move and rename (`copy.md`), delete (`delete-collection.md`), and "Add document" (opens `explorer-add-document.md`).
- Body: the documents of the loaded pages; it scrolls on its own, in both directions.
- Footer: "N documents loaded", ", more available" while another page exists, and "Load more".

## Data

`CollectionStore` (provided by the page) loads 50 documents per page (`DEFAULT_PAGE_SIZE`) through the browse session, ordered by document id; "Load more" continues after the last loaded id. Refresh and every route change start again from the first page. Answers to an older request (another collection, or before a refresh) are dropped.

## Views

The views are `DocumentViewsComponent` in `shared/components/`, which the query page uses too; the table, value cell and value tree components live there as well.

- **Table**: one row per document, the ID column first and sticky, then one column per top-level field name found in the loaded documents, sorted. A missing field shows "—". Clicking a row or its id opens the document. Cells use `app-value-cell` (see below).
- **Tree**: one collapsible row per document, then its fields, then nested maps and arrays, each with its type label. Field names are sorted.
- **JSON**: read-only, pretty-printed `documentsToReadableJson` of the loaded documents: an object keyed by document id holding each document's fields (mapping in `firestore-value-json.md`).

## Value cells

| Type | Shown as |
|---|---|
| string | the text |
| integer | the digits with an `int` hint |
| double | the number with a `dbl` hint; a whole number reads `2.0` |
| boolean, null | `true` / `false`, `null` |
| timestamp | local date and time; the tooltip shows the UTC ISO time with full precision |
| geopoint | `latitude, longitude` |
| reference | the path, as a link to that document |
| bytes, vector | `N bytes`, `vector(N)` |
| map, array | `{N fields}`, `[N items]` |

## Live

"Live" (a toggle with a dot; `aria-pressed`) attaches a realtime listener in the browse session (`browse-session.md` → "Live listeners") on the collection ordered by document id, limited to the loaded documents, plus room for one more page when every document is loaded (`liveWindowSize`), at most 1000 (the toggle is disabled beyond that). The first update replaces the loaded documents; each later batch is applied by its indexes (`applyLiveChanges` in `shared/utils/live-changes.ts`). Added and modified rows flash for 1.5 s (`.live-changed` in `_global.scss`; with reduced motion they keep a plain highlight for that time instead), and the footer shows a pulsing "Live" status. "Load more" is hidden while Live is on.

Live turns off when toggled, when the route changes to another collection, when the page is destroyed (navigation, tab switch) and when the browse session stops (idle for 5 minutes, account removed, app quit). A listener error or a stopped session shows "Live stopped: <reason>" above the documents.
