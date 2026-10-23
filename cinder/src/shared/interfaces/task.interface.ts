import type { DatabaseSettings, DatabaseTarget } from "./account.interface";
import type { FirestoreResult } from "./firestore-value.interface";

export interface RunScriptTaskRequest {
	type: "run-script";
	database: DatabaseTarget;
	script: string;
}

export type TaskRequest = RunScriptTaskRequest;

export type TaskStatus = "queued" | "running" | "done" | "failed" | "canceled";

export interface TaskProgress {
	reads: number;
	writes: number;
	deletes: number;
}

export type TaskLogLevel = "log" | "info" | "warn" | "error";

export interface TaskLogEntry {
	level: TaskLogLevel;
	message: string;
	time: string;
}

export type TaskResult = FirestoreResult;

export interface TaskUpdate {
	taskId: string;
	status: TaskStatus;
	progress: TaskProgress;
	logEntries: TaskLogEntry[];
	result: TaskResult | null;
	error: string | null;
}

export interface WorkerTaskMessage {
	taskId: string;
	request: TaskRequest;
	settings: DatabaseSettings;
}
