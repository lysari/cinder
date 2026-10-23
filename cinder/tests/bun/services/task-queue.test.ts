import { afterAll, describe, expect, test } from "bun:test";
import { join } from "node:path";
import { TaskQueue } from "../../../src/bun/services/task-queue";
import type { EmulatorAccount } from "../../../src/shared/interfaces/account.interface";
import type { TaskRequest, TaskStatus, TaskUpdate } from "../../../src/shared/interfaces/task.interface";
import { createFirestore } from "../../../src/worker/firestore-client";

const WORKER_PATH = join(import.meta.dir, "../../../src/worker/index.ts");
const ACCOUNT: EmulatorAccount = { id: "emulator", type: "emulator", host: "127.0.0.1", port: 8080, projectIds: ["demo-cinder"] };
const OTHER_ACCOUNT: EmulatorAccount = { ...ACCOUNT, id: "other-emulator", projectIds: ["demo-cinder-copy"] };
const PROJECT_ID = "demo-cinder";
const COLLECTION = `task-queue-test-${crypto.randomUUID()}`;
const ENDED_STATUSES: TaskStatus[] = ["done", "failed", "canceled"];
const db = createFirestore({ type: "emulator", projectId: PROJECT_ID, databaseId: "(default)", host: ACCOUNT.host, port: ACCOUNT.port });
const otherDb = createFirestore({ type: "emulator", projectId: "demo-cinder-copy", databaseId: "(default)", host: ACCOUNT.host, port: ACCOUNT.port });

function scriptRequest(script: string, accountId = ACCOUNT.id): TaskRequest {
	return { type: "run-script", database: { accountId, projectId: PROJECT_ID, databaseId: "(default)" }, script };
}

function sleepScript(milliseconds: number): string {
	return `async function run() { await new Promise((resolve) => setTimeout(resolve, ${milliseconds})); return "slept"; }`;
}

function createQueue(concurrency: number, workerPath = WORKER_PATH) {
	const updates: TaskUpdate[] = [];
	const cleanedTaskIds: string[] = [];
	const queue = new TaskQueue({
		workerPath,
		concurrency,
		findAccount: (accountId) => [ACCOUNT, OTHER_ACCOUNT].find((account) => account.id === accountId),
		onUpdate: (update) => updates.push(update),
		cleanUp: async (taskId) => {
			cleanedTaskIds.push(taskId);
		},
	});
	const statusesOf = (taskId: string) => updates.filter((update) => update.taskId === taskId).map((update) => update.status);
	const waitForStatus = async (taskId: string, statuses: TaskStatus[]) => {
		while (!statusesOf(taskId).some((status) => statuses.includes(status))) {
			await Bun.sleep(20);
		}
	};
	const waitForEnd = (taskId: string) => waitForStatus(taskId, ENDED_STATUSES);
	return { queue, updates, cleanedTaskIds, statusesOf, waitForStatus, waitForEnd };
}

function copyRequest(destinationAccountId: string): TaskRequest {
	return {
		type: "copy",
		database: { accountId: ACCOUNT.id, projectId: PROJECT_ID, databaseId: "(default)" },
		source: { type: "collection", collectionPath: COLLECTION },
		destination: { database: { accountId: destinationAccountId, projectId: "demo-cinder-copy", databaseId: "(default)" }, path: COLLECTION },
		isMove: false,
		isRecursive: false,
		writeMode: "overwrite",
		isRewritingReferences: false,
	};
}

afterAll(async () => {
	await db.recursiveDelete(db.collection(COLLECTION));
	await otherDb.recursiveDelete(otherDb.collection(COLLECTION));
	await db.terminate();
	await otherDb.terminate();
});

describe("TaskQueue", () => {
	test("runs at most the configured number of tasks at once", async () => {
		const { queue, updates, cleanedTaskIds, statusesOf, waitForEnd } = createQueue(2);
		const taskIds = [queue.start(scriptRequest(sleepScript(400))), queue.start(scriptRequest(sleepScript(400))), queue.start(scriptRequest(sleepScript(400)))];
		await Promise.all(taskIds.map(waitForEnd));

		let runningCount = 0;
		let maxRunningCount = 0;
		for (const update of updates) {
			if (update.status === "running") {
				runningCount += 1;
			} else if (ENDED_STATUSES.includes(update.status)) {
				runningCount -= 1;
			}
			maxRunningCount = Math.max(maxRunningCount, runningCount);
		}
		expect(maxRunningCount).toBe(2);
		const thirdStart = updates.findIndex((update) => update.taskId === taskIds[2] && update.status === "running");
		const firstEnd = updates.findIndex((update) => update.status === "done");
		expect(thirdStart).toBeGreaterThan(firstEnd);
		for (const taskId of taskIds) {
			expect(statusesOf(taskId)).toEqual(["queued", "running", "done"]);
		}
		expect(cleanedTaskIds).toEqual([]);
	});

	test("removes a canceled task from the queue before it starts", async () => {
		const { queue, statusesOf, waitForEnd } = createQueue(1);
		const runningId = queue.start(scriptRequest(sleepScript(300)));
		const queuedId = queue.start(scriptRequest(sleepScript(300)));
		queue.cancel(queuedId);
		await waitForEnd(runningId);
		await Bun.sleep(100);
		expect(statusesOf(queuedId)).toEqual(["queued", "canceled"]);
		expect(statusesOf(runningId)).toEqual(["queued", "running", "done"]);
	});

	test("kills the worker of a canceled running task", async () => {
		const { queue, cleanedTaskIds, statusesOf, waitForStatus, waitForEnd } = createQueue(1);
		const path = `${COLLECTION}/written-after-cancel`;
		const taskId = queue.start(
			scriptRequest(`async function run() {
	await new Promise((resolve) => setTimeout(resolve, 1500));
	await db.doc("${path}").set({ written: true });
}`),
		);
		await waitForStatus(taskId, ["running"]);
		queue.cancel(taskId);
		await waitForEnd(taskId);
		await Bun.sleep(2000);
		expect(statusesOf(taskId)).toEqual(["queued", "running", "canceled"]);
		expect(cleanedTaskIds).toEqual([taskId]);
		expect((await db.doc(path).get()).exists).toBe(false);
	});

	test("fails a task whose worker exits with a non-zero code", async () => {
		const { queue, updates, waitForEnd } = createQueue(1, join(import.meta.dir, "missing-worker.ts"));
		const taskId = queue.start(scriptRequest(sleepScript(0)));
		await waitForEnd(taskId);
		const update = updates.at(-1);
		expect(update?.status).toBe("failed");
		expect(update?.error).toBe("The task process exited with code 1 before finishing.");
	});

	test("fails a task whose account is unknown", async () => {
		const { queue, updates, waitForEnd } = createQueue(1);
		const taskId = queue.start(scriptRequest(sleepScript(0), "unknown"));
		await waitForEnd(taskId);
		expect(updates.at(-1)).toMatchObject({ status: "failed", error: "Account unknown was not found." });
	});

	test("copies between the databases of two accounts", async () => {
		await db.doc(`${COLLECTION}/copied`).set({ n: 1.5 });
		const { queue, updates, waitForEnd } = createQueue(1);
		const taskId = queue.start(copyRequest(OTHER_ACCOUNT.id));
		await waitForEnd(taskId);
		expect(updates.at(-1)).toMatchObject({ status: "done", result: { kind: "writes", writeCount: 1 } });
		expect((await otherDb.doc(`${COLLECTION}/copied`).get()).get("n")).toBe(1.5);
	});

	test("fails a copy whose destination account is unknown", async () => {
		const { queue, updates, waitForEnd } = createQueue(1);
		const taskId = queue.start(copyRequest("unknown"));
		await waitForEnd(taskId);
		expect(updates.at(-1)).toMatchObject({ status: "failed", error: "Account unknown was not found." });
	});
});
