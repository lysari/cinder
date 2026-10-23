import { afterAll, describe, expect, test } from "bun:test";
import { join } from "node:path";
import { EMPTY_TASK_PROGRESS } from "../../../src/shared/constants/task";
import type { EmulatorDatabaseSettings } from "../../../src/shared/interfaces/account.interface";
import type { DeleteCollectionTaskRequest } from "../../../src/shared/interfaces/delete-collection.interface";
import type { TaskContext, TaskUpdate, WorkerTaskMessage } from "../../../src/shared/interfaces/task.interface";
import { createFirestore } from "../../../src/worker/firestore-client";
import { deleteCollection } from "../../../src/worker/tasks/delete-collection";

const WORKER_PATH = join(import.meta.dir, "../../../src/worker/index.ts");
const SETTINGS: EmulatorDatabaseSettings = { type: "emulator", projectId: "demo-cinder", databaseId: "(default)", host: "127.0.0.1", port: 8080 };
const DATABASE = { accountId: "emulator", projectId: SETTINGS.projectId, databaseId: SETTINGS.databaseId };
const RUN_ID = crypto.randomUUID();
const db = createFirestore(SETTINGS, { useBigInt: true });
const usedCollections: string[] = [];
const CANCEL_DOCUMENT_COUNT = 3000;

function createContext(): TaskContext {
	return { taskId: crypto.randomUUID(), isEmulator: true, progress: { ...EMPTY_TASK_PROGRESS }, log: () => {} };
}

function newCollection(name: string): string {
	const collectionPath = `delete-test-${name}-${RUN_ID}`;
	usedCollections.push(collectionPath);
	return collectionPath;
}

async function seed(collectionPath: string, count: number): Promise<void> {
	const writer = db.bulkWriter({ throttling: false });
	for (let index = 0; index < count; index += 1) {
		void writer.set(db.doc(`${collectionPath}/d${index}`), { index: BigInt(index), team: index % 2 === 0 ? "red" : "blue" });
		void writer.set(db.doc(`${collectionPath}/d${index}/notes/n1`), { text: "note" });
	}
	await writer.close();
}

afterAll(async () => {
	for (const collectionPath of usedCollections) {
		const writer = db.bulkWriter({ throttling: false });
		await db.recursiveDelete(db.collection(collectionPath), writer);
		await writer.close();
	}
	await db.terminate();
});

describe("delete-collection", () => {
	test("deletes a collection with every subcollection, also below documents that do not exist", async () => {
		const collectionPath = newCollection("recursive");
		await seed(collectionPath, 10);
		await db.doc(`${collectionPath}/ghost/children/c1`).set({ n: 1n });
		const context = createContext();
		const request: DeleteCollectionTaskRequest = { type: "delete-collection", database: DATABASE, source: { type: "collection", collectionPath } };
		const result = await deleteCollection(db, request, context);
		expect(result).toMatchObject({ kind: "writes", deleteCount: 21, failureCount: 0 });
		expect(await db.collection(collectionPath).listDocuments()).toEqual([]);
		expect((await db.doc(`${collectionPath}/ghost/children/c1`).get()).exists).toBe(false);
	});

	test("deletes only the documents a query matches and leaves their subcollections", async () => {
		const collectionPath = newCollection("query");
		await seed(collectionPath, 10);
		const context = createContext();
		const request: DeleteCollectionTaskRequest = {
			type: "delete-collection",
			database: DATABASE,
			source: {
				type: "query",
				query: {
					target: { type: "collection", collectionPath },
					filters: [{ fieldPath: "team", operator: "==", value: { type: "string", value: "red" } }],
					orders: [],
					limit: null,
				},
			},
		};
		const result = await deleteCollection(db, request, context);
		expect(result).toMatchObject({ deleteCount: 5, failureCount: 0 });
		expect(context.progress.totalDocuments).toBe(5);
		const remaining = (await db.collection(collectionPath).get()).docs.map((snapshot) => snapshot.get("team"));
		expect(remaining).toEqual(["blue", "blue", "blue", "blue", "blue"]);
		expect((await db.doc(`${collectionPath}/d0/notes/n1`).get()).exists).toBe(true);
	});

	test("stops where it is when its worker is killed", async () => {
		const collectionPath = newCollection("cancel");
		const writer = db.bulkWriter({ throttling: false });
		for (let index = 0; index < CANCEL_DOCUMENT_COUNT; index += 1) {
			void writer.set(db.doc(`${collectionPath}/d${index}`), { index: BigInt(index) });
		}
		await writer.close();
		const updates: TaskUpdate[] = [];
		const worker = Bun.spawn([process.execPath, WORKER_PATH], {
			ipc: (update: TaskUpdate) => updates.push(update),
			serialization: "json",
			stdio: ["ignore", "inherit", "inherit"],
		});
		const message: WorkerTaskMessage = {
			taskId: "delete-cancel",
			request: { type: "delete-collection", database: DATABASE, source: { type: "collection", collectionPath } },
			settings: SETTINGS,
			destinationSettings: null,
		};
		worker.send(message);
		const countRemaining = async () => Number((await db.collection(collectionPath).count().get()).data().count);
		while ((await countRemaining()) === CANCEL_DOCUMENT_COUNT) {
			await Bun.sleep(5);
		}
		worker.kill("SIGKILL");
		await worker.exited;
		expect(updates.some((update) => update.status === "done")).toBe(false);
		const remainingCount = await countRemaining();
		expect(remainingCount).toBeGreaterThan(0);
		expect(remainingCount).toBeLessThan(CANCEL_DOCUMENT_COUNT);
	});
});
