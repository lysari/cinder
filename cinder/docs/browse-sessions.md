# src/bun/services/browse-sessions.ts

Keeps one long-lived browse session process per database target (account id, project id, database id) for the explorer's short reads and writes, so a click never waits for a worker to start. Long and bulk work stays on the task queue.

## Lifecycle

| Event | What happens |
|---|---|
| First request for a target | Spawns `process.execPath <worker.js> --browse-session` with JSON IPC, sends `{ settings }` (the account resolved into `DatabaseSettings`), then the request |
| Each request | Gets the next numeric request id and its own timer (`BROWSE_REQUEST_TIMEOUT_MS`, 30 s); the idle timer stops |
| Response | Settles the pending request with the result or an `Error` carrying the worker's message; a response for an id that already timed out is dropped |
| Timeout | Rejects with "Firestore did not answer within N seconds."; the process keeps running and later answers are dropped |
| No pending request | Starts the idle timer (`BROWSE_IDLE_TIMEOUT_MS`, 5 min); when it fires the process is killed |
| Process exits on its own (crash, OOM, killed) | Every pending request rejects with "The browse session stopped because …. Try again."; the next request spawns a new process |
| Account removed | `closeAccount` kills that account's sessions, because they hold its credentials |
| App quit | `closeAll` runs on Electrobun's `before-quit` event; a worker whose IPC channel closes exits by itself as well |

`onSessionEnd(target, reason)` reports every end: "it was idle", "its account was removed", "the app quit", or the exit ("its process was stopped by SIGKILL", "its process exited with code 1"). The main process logs it.

## Hidden constraints

- A closed session is removed from the map before its process has exited, so a request that arrives meanwhile starts a fresh process instead of reusing the dying one.
- The session key is the JSON array of the three ids, so ids containing `/` cannot collide.
- The worker process is the same `worker.js` bundle as tasks; the `--browse-session` argument selects the mode (see `worker-index.md`). Credentials travel only over IPC, never in argv or the environment.
