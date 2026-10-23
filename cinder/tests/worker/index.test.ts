import { Timestamp } from "@google-cloud/firestore";
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { join } from "node:path";
import type { EmulatorDatabaseSettings } from "../../src/shared/interfaces/account.interface";
import type { TaskUpdate, WorkerTaskMessage } from "../../src/shared/interfaces/task.interface";
import { createFirestore } from "../../src/worker/firestore-client";

const WORKER_PATH = join(import.meta.dir, "../../src/worker/index.ts");
const SETTINGS: EmulatorDatabaseSettings = {
	type: "emulator",
	projectId: "demo-cinder",
	databaseId: "(default)",
	host: "127.0.0.1",
	port: 8080,
};
const COLLECTION = `worker-test-${crypto.randomUUID()}`;
const db = createFirestore(SETTINGS);

function startWorker(script: string) {
	const updates: TaskUpdate[] = [];
	const worker = Bun.spawn([process.execPath, WORKER_PATH], {
		ipc: (update: TaskUpdate) => updates.push(update),
		serialization: "json",
		stdio: ["ignore", "inherit", "inherit"],
	});
	const message: WorkerTaskMessage = {
		taskId: "task-1",
		request: {
			type: "run-script",
			database: { accountId: "emulator", projectId: SETTINGS.projectId, databaseId: SETTINGS.databaseId },
			script,
		},
		settings: SETTINGS,
	};
	worker.send(message);
	return { worker, updates };
}

async function runWorker(script: string): Promise<TaskUpdate[]> {
	const { worker, updates } = startWorker(script);
	await worker.exited;
	return updates;
}

function lastUpdate(updates: TaskUpdate[]): TaskUpdate {
	const update = updates.at(-1);
	if (!update) {
		throw new Error("The worker sent no update.");
	}
	return update;
}

beforeAll(async () => {
	await db.doc(`${COLLECTION}/alpha`).set({ name: "Alpha", count: 3, ratio: 0.5, createdAt: new Timestamp(1700000000, 0) });
	await db.doc(`${COLLECTION}/beta`).set({ name: "Beta", count: 1, ratio: 1.25, createdAt: new Timestamp(1700000100, 0) });
});

afterAll(async () => {
	await db.recursiveDelete(db.collection(COLLECTION));
	await db.terminate();
});

describe("worker run-script", () => {
	test("returns a document", async () => {
		const update = lastUpdate(await runWorker(`async function run() { return db.doc("${COLLECTION}/alpha").get(); }`));
		expect(update.status).toBe("done");
		expect(update.taskId).toBe("task-1");
		expect(update.result).toMatchObject({
			kind: "document",
			path: `${COLLECTION}/alpha`,
			document: {
				id: "alpha",
				fields: {
					name: { type: "string", value: "Alpha" },
					count: { type: "integer", value: "3" },
					ratio: { type: "double", value: 0.5 },
					createdAt: { type: "timestamp", value: { seconds: 1700000000, nanos: 0 } },
				},
			},
		});
	});

	test("returns a missing document as null", async () => {
		const update = lastUpdate(await runWorker(`async function run() { return db.doc("${COLLECTION}/missing").get(); }`));
		expect(update.result).toEqual({ kind: "document", path: `${COLLECTION}/missing`, document: null });
	});

	test("returns query results", async () => {
		const script = `async function run() {
	const query = await db.collection("${COLLECTION}")
		.where("createdAt", ">", admin.firestore.Timestamp.fromMillis(1700000050000))
		.get();
	return query;
}`;
		const update = lastUpdate(await runWorker(script));
		expect(update.status).toBe("done");
		expect(update.result?.kind).toBe("documents");
		expect(update.result).toMatchObject({ documents: [{ id: "beta", fields: { name: { type: "string", value: "Beta" } } }] });
	});

	test("returns a plain object", async () => {
		const update = lastUpdate(await runWorker(`async function run() { return { total: 2, tags: ["a"] }; }`));
		expect(update.result).toEqual({
			kind: "value",
			value: {
				type: "map",
				value: {
					total: { type: "integer", value: "2" },
					tags: { type: "array", value: [{ type: "string", value: "a" }] },
				},
			},
		});
	});

	test("captures console output in the log", async () => {
		const script = `async function run() {
	console.log("found %d documents", 2);
	console.warn({ empty: true });
	await new Promise((resolve) => setTimeout(resolve, 300));
	console.error("late");
}`;
		const updates = await runWorker(script);
		const logEntries = updates.flatMap((update) => update.logEntries);
		expect(logEntries.map(({ level, message }) => ({ level, message }))).toEqual([
			{ level: "log", message: "found 2 documents" },
			{ level: "warn", message: "{ empty: true }" },
			{ level: "error", message: "late" },
		]);
		expect(updates.length).toBeGreaterThan(1);
		expect(lastUpdate(updates).status).toBe("done");
	});

	test("fails with the error and its script line when the script throws", async () => {
		const update = lastUpdate(await runWorker(`async function run() {\n\tconst a = 1;\n\tthrow new Error("boom");\n}`));
		expect(update.status).toBe("failed");
		expect(update.result).toBeNull();
		expect(update.error).toStartWith("Error: boom");
		expect(update.error).toContain("script.js:3");
	});

	test("exits when the main process disconnects", async () => {
		const { worker } = startWorker("async function run() { await new Promise((resolve) => setTimeout(resolve, 60000)); }");
		await Bun.sleep(200);
		worker.disconnect();
		expect(await worker.exited).toBe(1);
	});

	test("fails when the script has no run function", async () => {
		const update = lastUpdate(await runWorker("const answer = 42;"));
		expect(update.status).toBe("failed");
		expect(update.error).toBe("Error: The script must define async function run().");
	});
});
