# src/worker/index.ts

The entry of the worker process. It runs in one of two modes:

- Started with `--browse-session`, it is a long-lived browse session for one database (see `browse-session.md`).
- Otherwise it is a task process: the main process starts one per running task (see `task-queue.md`) and talks to it over Bun IPC with JSON serialization, as described below.

Both modes exit with code 1 when the IPC channel closes.

## Protocol

1. The main process sends one `WorkerTaskMessage`: `{ taskId, request, settings }`. `settings` is the account already resolved into `DatabaseSettings`, so the worker never sees account storage.
2. The worker creates the Firestore client from `settings` and runs the task.
3. While the task runs, the worker sends a `TaskUpdate` with status `running` every 250 ms, but only when new log entries are waiting. Each update carries the log entries since the previous update and the current progress counters.
4. When the task ends, the worker sends one last `TaskUpdate` with status `done` (with `result`) or `failed` (with `error`), then exits.

The main process trusts this message: it builds it itself from a request that `parseTaskRequest` already checked.

## Exit rules

- The worker calls `process.exit` from the callback of its last `process.send`. Bun drops IPC messages that are still queued when the process exits, so exiting right after `send` loses the final update.
- An unhandled rejection or uncaught exception, e.g. a promise the script forgot to await, ends the task as `failed` with that error.
- When the IPC channel closes because the main process quit or crashed, the worker exits with code 1. Without this a running script keeps the worker alive as an orphan.

## Adding a task type

1. Add a `<Type>TaskRequest` with its own `type` literal to `TaskRequest` in `src/shared/interfaces/task.interface.ts`, and its result shape to `TaskResult`.
2. Accept it in `src/bun/task-request-parser.ts`.
3. Write `src/worker/tasks/<type>.ts` and call it here, switching on `request.type`. Update `progress` in place and log through the `log` function; both are flushed with the next update.
