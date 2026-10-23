# Query page

Routes (from `features/query/query.routes.ts`, built with `shared/utils/query-route.ts`):

| URL | Opened from |
|---|---|
| `#/query/<accountId>/<projectId>/<databaseId>` | the search button on a database row in the sidebar |
| `#/query/<accountId>/<projectId>/<databaseId>/c/<collectionPath>` | "Query" on the explorer collection toolbar; the builder starts on that collection |

The parent route provides `QueryApiService` and `QueryStore`; route injectors live for the whole session, so the store keeps each page's state while the user browses elsewhere (see `query-store.md`). State is kept per tab, and the mode, builder form and script are saved across restarts (`view-state-store.md`).

## Layout

- Header: "Query" and the account label, project id and database id.
- Toolbar: the Builder / JavaScript switch; the status of the last run (Queued, Running, Done, Failed, Canceled), its elapsed time (ticking while it runs) and the result count; "Export" (builder mode without issues; opens the export page for every document of the builder query, `export.md`), "Bulk update" and delete matches (the same condition; `bulk-update.md`, `delete-collection.md`); Run, or Cancel while a run is active.
- Editor pane: the query builder (scrolls on its own, at most 45 % of the page) or the JavaScript editor (40 %).
- Results pane: fills the rest (see "Results").
- Console: a fixed-height panel under the results while in JavaScript mode or after a JavaScript run.

## Builder

`QueryBuilderComponent` edits the target (collection path or collection group id), filter rows (field path, operator, value type and value; in, not-in and array-contains-any take a list of values, each with its own type), order rows (field path, ascending or descending) and the limit (empty means no limit; a new page starts with 100). Rows and list values are added and removed by the user. Every change is checked at once: values typed wrong (`query-form.ts`, using the field editor's rules in `value-draft.md`) and the Firestore rules in `query-validation.md`; each message shows under its row. Run is disabled while there is any issue. Cmd/Ctrl+Enter in the builder runs it.

A builder run calls `runQuery` on the database's browse session (no process start, no script): 50 documents a page, "Load more" continues after the last loaded document until the limit (see `browse-session.md`).

## Switching modes

- **JavaScript** ("View as JavaScript"): when the builder has no issue, the script is replaced by the generated code (`query-script.md`). With issues the previous script stays.
- **Builder**: the script is read back with `parseQueryScript` (`query-script-parser.md`). A script the builder cannot show (a comment, another statement, `console.log`, an unknown method …) keeps JavaScript mode and shows the reason, e.g. `Line 8: the query builder cannot show "console" here. The script stays in JavaScript.`

## JavaScript

`CodeEditorComponent` (`code-editor.md`) with completions for the run-script context (`script-completion.md`). Run, or Cmd/Ctrl+Enter, starts a `run-script` task on the task queue; Cancel kills its process. The status follows the task's updates; Cancel is disabled until the task id arrives.

## Results

- Documents (a builder run, or a script returning a `QuerySnapshot` or an existing `DocumentSnapshot`) use the shared Table / Tree / JSON views (`DocumentViewsComponent`); a row opens the explorer document page.
- A missing document says so with its path.
- Any other returned value shows as Tree (maps and arrays; a single value with its type) or JSON.
- A failed run shows its error; a script error starts with "Error on line N, column M" taken from the `script.js:N:M` frame (`script-error.ts`).

## Live

A builder run that returned documents shows "Live" in the results toolbar. It listens to the run's query in the browse session, limited to the loaded results (plus one page when all are loaded, never past the query's own limit; `liveWindowSize`), and applies each change batch like the collection page (`explorer-collection.md` → "Live"), highlighting changed rows. A new run, switching to another tab or route, and leaving the page turn it off; an error shows "Live stopped: <reason>" above the results. Scripts have no Live mode.

## Editor loading

The JavaScript editor is inside `@defer (on immediate)`, so CodeMirror is a separate chunk that loads the first time the JavaScript mode shows ("Loading the editor…" until then). This keeps the query page chunk under Vite's 500 kB warning.
