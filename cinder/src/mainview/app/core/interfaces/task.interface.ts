import type {
	TaskLogEntry,
	TaskProgress,
	TaskRequest,
	TaskResult,
	TaskStatus,
} from "../../../../shared/interfaces/task.interface";

export interface Task {
	id: string;
	description: string;
	request: TaskRequest;
	status: TaskStatus;
	progress: TaskProgress;
	logEntries: TaskLogEntry[];
	result: TaskResult | null;
	error: string | null;
	startedAt: number;
	endedAt: number | null;
}
