# Tasks page

Route: `#/tasks`, lazily loaded from `features/tasks/tasks.routes.ts`. `?task=<id>` highlights that task and opens its log; the export, import, copy, bulk update and delete pages navigate there after a start.

It lists every task of this session from `TasksStore` (`tasks-store.md`), newest first. Each `TaskItemComponent` shows:

- status (Queued, Running, Done, Failed, Canceled), description, start and end time;
- a progress bar: exports, bulk updates and copies by documents read against the counted total, query deletes by documents deleted against the counted total, imports, CSV analysis and CSV loads by bytes read against the file size (`taskProgressRatio` in `core/utils/task-progress.ts`); an indeterminate bar while the total is unknown (work with subcollections, collection deletes, previews, scripts);
- counts: documents read and bytes written for exports; written, skipped and failed documents and bytes read for imports and loads; read, updated, unchanged and failed documents for bulk updates (read documents for a preview); read, written, skipped, failed documents and, for a move, deleted sources for copies; deleted and failed documents for deletes;
- Cancel while the task is active (the task's process is killed). For every task that writes, the button's tooltip and, after canceling, a note say what stays: written documents (imports, loads, copies), the change (bulk updates), moved documents and the sources not reached yet, with a document copied right before the cancel possibly in both places (moves), deleted documents (deletes);
- the error of a failed task, the result (export file path, document count and size; a sentence of counts for every writing task, which for a move also says how many documents were copied but could not be deleted at the source and so exist in both places, and that a document that could not be copied stays at the source; "N documents previewed" for a bulk update preview) and the first 100 failures as a table of row number, document path and reason, with the number not listed;
- the log, collapsed behind "Log (N)".

The status bar (`statusbar.component.ts` in the main layout) links here: "N tasks running: <first task>" with a small progress bar, or "No tasks running".
