import type { TaskProgress } from "../interfaces/task.interface";

export const EMPTY_TASK_PROGRESS: Readonly<TaskProgress> = {
	reads: 0,
	writes: 0,
	deletes: 0,
	skips: 0,
	failures: 0,
	bytes: 0,
	totalBytes: null,
	totalDocuments: null,
};
