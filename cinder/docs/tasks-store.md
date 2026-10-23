# src/mainview/app/core/stores/tasks.store.ts

App-wide store of every task started in this session (`Task` in `core/interfaces/task.interface.ts`: description, request, status, progress, log, result, error, start and end time). It is the only subscriber of `RpcService.taskUpdates`; the query page (`query-store.md`), the export and import pages and the tasks page read tasks from it.

- `start(request, description)` calls `startTask` and adds the task, newest first. A rejected start adds nothing and rethrows the main process's message.
- The task queue reports `queued` (and often `running`) before `startTask` returns the id, so updates for unknown task ids are buffered while any start is pending and applied once the id arrives; the buffer is cleared when no start is pending. Updates for ids that never belong to a start of this session are dropped.
- An update replaces the progress, appends log entries and keeps the latest result and error. Updates after a task ended are ignored.
- Tasks are kept until the app quits; nothing is saved.
