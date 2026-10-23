# src/mainview/app/features/query/stores/query.store.ts

Holds the state of every query page opened in this session, keyed by the JSON array of the tab id, account id, project id, database id and the route's collection path (or null), so two tabs on the same query keep their own editors. A new key starts in builder mode on that collection with limit 100 and the generated script of that form.

Each `QueryPageState` keeps the builder form values, the script, the mode, the last switch error and the last run (`QueryRun`). The store is provided on the query route, whose injector lives until the app quits, so state survives navigating away. It starts from the query pages restored by `ViewStateStore` and writes `tabId`, database, collection, mode, form and script of every page back (never runs or results), so they survive restarts.

`formResultOf(key)` reads the page's builder form (`readQueryForm`) so the page shows the issues without converting the form itself.

## Runs

- A builder run reads the form with `readQueryForm` and calls `runQuery`; "Load more" sends the last loaded document as the cursor with the loaded count. Cancel marks the run canceled and drops its answer.
- A script run starts a `run-script` task through `TasksStore` (`tasks-store.md`) and keeps its task id; `stateOf` reads the run's status, log, result and error from that task, so the script also shows on the tasks page.
- Every run has a `runId`; answers for a run that was replaced are dropped.

## Hidden constraints

- Updates that arrive before the task id are buffered by `TasksStore`, not here.
- Switching to the builder only succeeds when the parsed query reads back unchanged through the builder form (`queryFormFromQuery` then `readQueryForm`); a list on `==`, for example, could not be shown, so the script stays in JavaScript.

## Live

One live listener at a time (`liveKey`, `liveStatus`, `liveError`, `changedPaths`): `startLive(key)` needs a finished builder run with documents; changes update that run's documents (`applyLiveChanges`). `run`, the page's key change and its destruction call `stopLive`.
