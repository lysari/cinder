import type { DatabaseSettings, DatabaseTarget } from "./account.interface";
import type { BulkUpdatePreviewResult, BulkUpdateTaskRequest } from "./bulk-update.interface";
import type { CopyTaskRequest } from "./copy.interface";
import type { AnalyzeCsvTaskRequest, CsvAnalysisResult, LoadCsvTaskRequest } from "./csv.interface";
import type { DeleteCollectionTaskRequest } from "./delete-collection.interface";
import type { ExportTaskRequest, ExportTaskResult } from "./export.interface";
import type { FirestoreResult } from "./firestore-value.interface";
import type { ImportTaskRequest } from "./import.interface";

export interface RunScriptTaskRequest {
	type: "run-script";
	database: DatabaseTarget;
	script: string;
}

export type TaskRequest =
	| RunScriptTaskRequest
	| ExportTaskRequest
	| ImportTaskRequest
	| AnalyzeCsvTaskRequest
	| LoadCsvTaskRequest
	| BulkUpdateTaskRequest
	| CopyTaskRequest
	| DeleteCollectionTaskRequest;

export type TaskStatus = "queued" | "running" | "done" | "failed" | "canceled";

export interface TaskProgress {
	reads: number;
	writes: number;
	deletes: number;
	skips: number;
	failures: number;
	bytes: number;
	totalBytes: number | null;
	totalDocuments: number | null;
}

export type TaskLogLevel = "log" | "info" | "warn" | "error";

export interface TaskLogEntry {
	level: TaskLogLevel;
	message: string;
	time: string;
}

export interface TaskFailure {
	documentPath: string | null;
	rowNumber: number | null;
	message: string;
}

export interface WriteTaskResult {
	kind: "writes";
	writeCount: number;
	skipCount: number;
	deleteCount: number;
	failureCount: number;
	failures: TaskFailure[];
}

export type TaskResult = FirestoreResult | ExportTaskResult | WriteTaskResult | CsvAnalysisResult | BulkUpdatePreviewResult;

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
	destinationSettings: DatabaseSettings | null;
}

export interface TaskContext {
	taskId: string;
	isEmulator: boolean;
	progress: TaskProgress;
	log: (level: TaskLogLevel, message: string) => void;
}
