import { types } from "node:util";
import { BROWSE_SESSION_ARGUMENT } from "../shared/constants/browse-session";
import { EMPTY_TASK_PROGRESS } from "../shared/constants/task";
import type { DatabaseSettings } from "../shared/interfaces/account.interface";
import type {
	TaskContext,
	TaskLogEntry,
	TaskLogLevel,
	TaskProgress,
	TaskRequest,
	TaskResult,
	TaskStatus,
	TaskUpdate,
	WorkerTaskMessage,
} from "../shared/interfaces/task.interface";
import { startBrowseSession } from "./browse-session";
import { createFirestore } from "./firestore-client";
import { analyzeCsv } from "./tasks/analyze-csv";
import { bulkUpdate } from "./tasks/bulk-update";
import { copyDocuments } from "./tasks/copy";
import { deleteCollection } from "./tasks/delete-collection";
import { exportDocuments } from "./tasks/export";
import { importDocuments } from "./tasks/import";
import { loadCsv } from "./tasks/load-csv";
import { runScript } from "./tasks/run-script";

const FLUSH_INTERVAL_MS = 250;

if (process.argv.includes(BROWSE_SESSION_ARGUMENT)) {
	startBrowseSession();
} else {
	process.once("message", (message) => {
		void runTask(message as WorkerTaskMessage);
	});
}
process.once("disconnect", () => process.exit(1));

async function runTask({ taskId, request, settings, destinationSettings }: WorkerTaskMessage): Promise<void> {
	const progress: TaskProgress = { ...EMPTY_TASK_PROGRESS };
	let logEntries: TaskLogEntry[] = [];
	let sentProgress = JSON.stringify(progress);
	let isFinished = false;

	const takeUpdate = (status: TaskStatus, result: TaskResult | null, error: string | null): TaskUpdate => {
		const update: TaskUpdate = { taskId, status, progress, logEntries, result, error };
		logEntries = [];
		sentProgress = JSON.stringify(progress);
		return update;
	};
	const flushTimer = setInterval(() => {
		if (logEntries.length > 0 || JSON.stringify(progress) !== sentProgress) {
			process.send?.(takeUpdate("running", null, null));
		}
	}, FLUSH_INTERVAL_MS);
	const finish = (status: TaskStatus, result: TaskResult | null, error: string | null) => {
		if (isFinished) {
			return;
		}
		isFinished = true;
		clearInterval(flushTimer);
		process.send?.(takeUpdate(status, result, error), undefined, undefined, () => process.exit(0));
	};
	const log = (level: TaskLogLevel, message: string) => {
		logEntries.push({ level, message, time: new Date().toISOString() });
	};

	process.on("unhandledRejection", (reason) => finish("failed", null, describeError(reason)));
	process.on("uncaughtException", (error) => finish("failed", null, describeError(error)));

	try {
		const isEmulator = settings.type === "emulator" && (destinationSettings ?? settings).type === "emulator";
		const context: TaskContext = { taskId, isEmulator, progress, log };
		finish("done", await runRequest(request, settings, destinationSettings, context), null);
	} catch (error) {
		finish("failed", null, describeError(error));
	}
}

function runRequest(
	request: TaskRequest,
	settings: DatabaseSettings,
	destinationSettings: DatabaseSettings | null,
	context: TaskContext,
): Promise<TaskResult> {
	switch (request.type) {
		case "run-script":
			return runScript(createFirestore(settings), request.script, context.log);
		case "export":
			return exportDocuments(createFirestore(settings, { useBigInt: true }), request, context);
		case "import":
			return importDocuments(createFirestore(settings, { useBigInt: true }), request, context);
		case "analyze-csv":
			return analyzeCsv(request, context);
		case "load-csv":
			return loadCsv(createFirestore(settings, { useBigInt: true }), request, context);
		case "bulk-update":
			return bulkUpdate(createFirestore(settings, { useBigInt: true }), request, context);
		case "copy": {
			const sourceDb = createFirestore(settings, { useBigInt: true });
			const destinationDb = destinationSettings === null ? sourceDb : createFirestore(destinationSettings, { useBigInt: true });
			return copyDocuments(sourceDb, destinationDb, request, context);
		}
		case "delete-collection":
			return deleteCollection(createFirestore(settings, { useBigInt: true }), request, context);
	}
}

function describeError(error: unknown): string {
	return types.isNativeError(error) ? error.message : String(error);
}
