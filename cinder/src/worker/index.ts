import { types } from "node:util";
import { BROWSE_SESSION_ARGUMENT } from "../shared/constants/browse-session";
import type {
	TaskLogEntry,
	TaskLogLevel,
	TaskProgress,
	TaskResult,
	TaskStatus,
	TaskUpdate,
	WorkerTaskMessage,
} from "../shared/interfaces/task.interface";
import { startBrowseSession } from "./browse-session";
import { createFirestore } from "./firestore-client";
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

async function runTask({ taskId, request, settings }: WorkerTaskMessage): Promise<void> {
	const progress: TaskProgress = { reads: 0, writes: 0, deletes: 0 };
	let logEntries: TaskLogEntry[] = [];
	let isFinished = false;

	const takeUpdate = (status: TaskStatus, result: TaskResult | null, error: string | null): TaskUpdate => {
		const update: TaskUpdate = { taskId, status, progress, logEntries, result, error };
		logEntries = [];
		return update;
	};
	const flushTimer = setInterval(() => {
		if (logEntries.length > 0) {
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
		const result = await runScript(createFirestore(settings), request.script, log);
		finish("done", result, null);
	} catch (error) {
		finish("failed", null, describeError(error));
	}
}

function describeError(error: unknown): string {
	return types.isNativeError(error) ? error.message : String(error);
}
