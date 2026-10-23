# src/bun/services/task-queue.ts

Runs tasks in worker processes, at most `concurrency` at a time, first in, first out.

## Lifecycle

| Status | Sent by | When |
|---|---|---|
| `queued` | queue | `start` adds the task |
| `running` | queue, then worker | the worker process is spawned; the worker repeats it with new log entries |
| `done` / `failed` | worker | the task ends normally |
| `failed` | queue | the account (or a copy's destination account) is unknown, or the worker exits without a final update |
| `canceled` | queue | `cancel` on a queued task, or the killed worker has exited |

Each `TaskUpdate` is forwarded to `onUpdate` (the webview's `taskUpdated` message) as it arrives. Updates the queue sends itself carry no log entries and the last progress the worker reported. A forwarded update always carries the task id the queue gave the worker: the worker runs user code, so it must not be able to report for another task.

## Copies across databases

For a `copy` whose `destination.database` differs from `database`, the queue also resolves the destination account into `destinationSettings`, so a copy between two accounts gets both credentials over IPC; otherwise it sends null and the worker uses one client.

## Clean-up

When a task ends without `done` (canceled, failed by the worker, or the worker died), the queue awaits `cleanUp(taskId, request)` before it reports the final status. The main process passes `removeExportLeftovers` (`export-file.md`), so a canceled export's partial file is gone by the time the webview hears "canceled".

## Cancel and crashes

- Canceling a queued task removes it. Canceling a running task kills its worker with `SIGKILL`; a `vm` timeout could not stop pending async work. Updates from a canceled worker are ignored, and a task that already sent `done` or `failed` is not canceled.
- A worker that exits without a final update fails the task: a signal reads "stopped by SIGKILL; it most likely ran out of memory", any other exit names the exit code.

## Limits

- Concurrency is 4 when the machine has more than 10 GB of memory, otherwise 2 (`TASK_CONCURRENCY`).
- Bun has no heap-size flag like Node's `--max-old-space-size`, so workers run without a memory limit. A worker that exhausts memory is killed by the OS and its task fails as above; the main process is unaffected.
- The worker is launched with `process.execPath`, the Bun binary that runs the main process (`Contents/MacOS/bun` in the app bundle).
