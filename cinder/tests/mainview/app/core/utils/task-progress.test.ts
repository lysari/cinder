import { describe, expect, test } from "bun:test";
import { EMPTY_TASK_PROGRESS } from "../../../../../src/shared/constants/task";
import type { Task } from "../../../../../src/mainview/app/core/interfaces/task.interface";
import { formatByteCount, taskProgressRatio } from "../../../../../src/mainview/app/core/utils/task-progress";

const DATABASE = { accountId: "a", projectId: "p", databaseId: "(default)" };

function task(changes: Partial<Task>): Task {
	return {
		id: "t",
		description: "",
		request: { type: "import", database: DATABASE, filePath: "/f.json", format: "json", target: { type: "collection", collectionPath: "c" }, writeMode: "merge" },
		status: "running",
		progress: { ...EMPTY_TASK_PROGRESS },
		logEntries: [],
		result: null,
		error: null,
		startedAt: 0,
		endedAt: null,
		...changes,
	};
}

describe("taskProgressRatio", () => {
	test("measures imports by bytes read and exports by documents read", () => {
		expect(taskProgressRatio(task({ progress: { ...EMPTY_TASK_PROGRESS, bytes: 25, totalBytes: 100 } }))).toBe(0.25);
		const exportRequest = {
			type: "export" as const,
			database: DATABASE,
			source: { type: "collection" as const, collectionPath: "c", isRecursive: false },
			format: "csv" as const,
			folderPath: "/tmp",
			fileName: "c.csv",
			isOverwriting: false,
		};
		expect(taskProgressRatio(task({ request: exportRequest, progress: { ...EMPTY_TASK_PROGRESS, reads: 30, totalDocuments: 60 } }))).toBe(0.5);
		expect(taskProgressRatio(task({ request: exportRequest, progress: { ...EMPTY_TASK_PROGRESS, reads: 30 } }))).toBeNull();
	});

	test("measures bulk updates and copies by documents read and collection deletes by documents deleted", () => {
		const progress = { ...EMPTY_TASK_PROGRESS, reads: 10, deletes: 30, totalDocuments: 40 };
		const query = { target: { type: "collection" as const, collectionPath: "c" }, filters: [], orders: [], limit: null };
		const bulkUpdate = { type: "bulk-update" as const, database: DATABASE, query, operations: [], isDryRun: false };
		const copy = {
			type: "copy" as const,
			database: DATABASE,
			source: { type: "collection" as const, collectionPath: "c" },
			destination: { database: DATABASE, path: "d" },
			isMove: true,
			isRecursive: false,
			writeMode: "skip" as const,
			isRewritingReferences: false,
		};
		const deletion = { type: "delete-collection" as const, database: DATABASE, source: { type: "query" as const, query } };
		expect(taskProgressRatio(task({ request: bulkUpdate, progress }))).toBe(0.25);
		expect(taskProgressRatio(task({ request: copy, progress }))).toBe(0.25);
		expect(taskProgressRatio(task({ request: deletion, progress }))).toBe(0.75);
		expect(taskProgressRatio(task({ request: copy, progress: { ...progress, totalDocuments: null } }))).toBeNull();
	});

	test("is full when done and unknown for scripts", () => {
		expect(taskProgressRatio(task({ status: "done" }))).toBe(1);
		expect(taskProgressRatio(task({ request: { type: "run-script", database: DATABASE, script: "" } }))).toBeNull();
	});
});

describe("formatByteCount", () => {
	test("uses the largest fitting unit", () => {
		expect(formatByteCount(512)).toBe("512 bytes");
		expect(formatByteCount(1536)).toBe("1.5 KB");
		expect(formatByteCount(5 * 1024 ** 3)).toBe("5.0 GB");
	});
});
