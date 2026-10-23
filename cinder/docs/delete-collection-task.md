# src/worker/tasks/delete-collection.ts

The `delete-collection` task deletes a collection or the documents of a query.

- **Collection**: `DocumentWriter.deleteRecursively` runs the SDK's `recursiveDelete` with its own BulkWriter (the same retry policy), counting each delete with `onWriteResult` and recording each failed delete. It reaches every descendant, including subcollections of documents that do not exist. The total is unknown, so the tasks page shows an indeterminate bar.
- **Query**: pages of 500 matches are read (`readQueryPages`) and each document is deleted with `DocumentWriter.delete`; subcollections stay. A count aggregation gives the total. Paging continues after the last read snapshot, which still works once that document is deleted.

Canceling kills the worker; documents deleted before stay deleted. A read error ends the task with the number of documents deleted before it.
