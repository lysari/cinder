import { GeoPoint, Timestamp } from "@google-cloud/firestore";
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { join } from "node:path";
import { BrowseSessions } from "../../../src/bun/services/browse-sessions";
import type { DatabaseTarget, EmulatorAccount } from "../../../src/shared/interfaces/account.interface";
import type { DocumentPage } from "../../../src/shared/interfaces/browse.interface";
import { createFirestore } from "../../../src/worker/firestore-client";

const WORKER_PATH = join(import.meta.dir, "../../../src/worker/index.ts");
const PROJECT_ID = "demo-cinder";
const ACCOUNT: EmulatorAccount = { id: "emulator", type: "emulator", host: "127.0.0.1", port: 8080, projectIds: [PROJECT_ID] };
const UNREACHABLE_ACCOUNT: EmulatorAccount = { ...ACCOUNT, id: "unreachable", port: 1 };
const DATABASE: DatabaseTarget = { accountId: ACCOUNT.id, projectId: PROJECT_ID, databaseId: "(default)" };
const COLLECTION = `browse-sessions-test-${crypto.randomUUID()}`;
const PAGED_COLLECTION = `${COLLECTION}/paged/items`;
const PAGED_IDS = ["a1", "a2", "b1", "b2", "c1", "c2", "d1"];
const db = createFirestore({ type: "emulator", projectId: PROJECT_ID, databaseId: "(default)", host: ACCOUNT.host, port: ACCOUNT.port });

function createSessions(options: { requestTimeoutMs?: number; idleTimeoutMs?: number } = {}) {
	const endedSessions: { target: DatabaseTarget; reason: string }[] = [];
	const sessions = new BrowseSessions({
		workerPath: WORKER_PATH,
		requestTimeoutMs: options.requestTimeoutMs ?? 10_000,
		idleTimeoutMs: options.idleTimeoutMs ?? 60_000,
		findAccount: (accountId) => [ACCOUNT, UNREACHABLE_ACCOUNT].find((account) => account.id === accountId),
		onSessionEnd: (target, reason) => endedSessions.push({ target, reason }),
	});
	return { sessions, endedSessions };
}

function getDocument(sessions: BrowseSessions, documentPath: string) {
	return sessions.request({ type: "getDocument", params: { database: DATABASE, documentPath } });
}

function browseSessionPids(): number[] {
	const { stdout } = Bun.spawnSync(["pgrep", "-P", String(process.pid), "-f", "--", "--browse-session"]);
	return stdout.toString().split("\n").filter(Boolean).map(Number);
}

async function waitFor(isDone: () => boolean): Promise<void> {
	while (!isDone()) {
		await Bun.sleep(20);
	}
}

async function writeDoubleThroughRest(documentPath: string, fieldName: string, value: number): Promise<void> {
	const url = `http://${ACCOUNT.host}:${ACCOUNT.port}/v1/projects/${PROJECT_ID}/databases/(default)/documents/${documentPath}`;
	const response = await fetch(url, {
		method: "PATCH",
		headers: { Authorization: "Bearer owner", "Content-Type": "application/json" },
		body: JSON.stringify({ fields: { [fieldName]: { doubleValue: value } } }),
	});
	expect(response.ok).toBe(true);
}

const { sessions } = createSessions();

beforeAll(async () => {
	await Promise.all(PAGED_IDS.map((id) => db.doc(`${PAGED_COLLECTION}/${id}`).set({ id })));
	await db.doc(`${COLLECTION}/typed`).set({
		count: 3,
		ratio: 2.5,
		big: 9007199254740993n,
		when: new Timestamp(1700000000, 123456789),
		where: new GeoPoint(11.55, 104.92),
		owner: db.doc(`${COLLECTION}/owner`),
		nested: { tags: ["a", 1], level: { deep: true } },
	});
	await db.doc(`${COLLECTION}/typed/history/first`).set({ step: 1 });
	await writeDoubleThroughRest(`${COLLECTION}/whole-double`, "amount", 2);
});

afterAll(async () => {
	sessions.closeAll();
	await db.recursiveDelete(db.collection(COLLECTION));
	await db.terminate();
});

describe("BrowseSessions", () => {
	test("pages through a collection by document id without gaps or duplicates", async () => {
		const pages: DocumentPage[] = [];
		let startAfterId: string | null = null;
		do {
			const page: DocumentPage = await sessions.request({
				type: "listDocuments",
				params: { database: DATABASE, collectionPath: PAGED_COLLECTION, pageSize: 2, startAfterId },
			});
			pages.push(page);
			startAfterId = page.hasMore ? (page.documents.at(-1)?.id ?? null) : null;
		} while (startAfterId !== null);

		expect(pages.map((page) => page.documents.map((document) => document.id))).toEqual([
			["a1", "a2"],
			["b1", "b2"],
			["c1", "c2"],
			["d1"],
		]);
		expect(pages.map((page) => page.hasMore)).toEqual([true, true, true, false]);
	});

	test("lists root collections and the subcollections of a document", async () => {
		const rootCollections = await sessions.request({ type: "listCollections", params: { database: DATABASE, documentPath: null } });
		expect(rootCollections).toContain(COLLECTION);
		const subcollections = await sessions.request({
			type: "listCollections",
			params: { database: DATABASE, documentPath: `${COLLECTION}/typed` },
		});
		expect(subcollections).toEqual(["history"]);
	});

	test("reads a document with every value type and keeps integers apart from doubles", async () => {
		const document = await getDocument(sessions, `${COLLECTION}/typed`);
		expect(document?.fields).toEqual({
			count: { type: "integer", value: "3" },
			ratio: { type: "double", value: 2.5 },
			big: { type: "integer", value: "9007199254740993" },
			when: { type: "timestamp", value: { seconds: 1700000000, nanos: 123456000 } },
			where: { type: "geopoint", value: { latitude: 11.55, longitude: 104.92 } },
			owner: { type: "reference", value: `${COLLECTION}/owner` },
			nested: {
				type: "map",
				value: {
					tags: { type: "array", value: [{ type: "string", value: "a" }, { type: "integer", value: "1" }] },
					level: { type: "map", value: { deep: { type: "boolean", value: true } } },
				},
			},
		});
		const wholeDouble = await getDocument(sessions, `${COLLECTION}/whole-double`);
		expect(wholeDouble?.fields.amount).toEqual({ type: "double", value: 2 });
	});

	test("returns null for a missing document", async () => {
		expect(await getDocument(sessions, `${COLLECTION}/missing`)).toBeNull();
	});

	test("creates documents with a given or generated id and refuses an existing id", async () => {
		const fields = { name: { type: "string" as const, value: "Dara" } };
		const created = await sessions.request({
			type: "createDocument",
			params: { database: DATABASE, collectionPath: COLLECTION, documentId: "created", fields },
		});
		expect(created).toMatchObject({ path: `${COLLECTION}/created`, fields });
		const generated = await sessions.request({
			type: "createDocument",
			params: { database: DATABASE, collectionPath: COLLECTION, documentId: null, fields },
		});
		expect(generated.id).toHaveLength(20);
		expect((await db.doc(generated.path).get()).data()).toEqual({ name: "Dara" });
		await expect(
			sessions.request({
				type: "createDocument",
				params: { database: DATABASE, collectionPath: COLLECTION, documentId: "created", fields: {} },
			}),
		).rejects.toThrow("A document with this id already exists.");
	});

	test("updates only the named fields, deletes fields and treats dots as part of a name", async () => {
		await db.doc(`${COLLECTION}/updated`).set({ keep: 1, change: "old", remove: true });
		const updated = await sessions.request({
			type: "updateDocument",
			params: {
				database: DATABASE,
				documentPath: `${COLLECTION}/updated`,
				changedFields: { change: { type: "string", value: "new" }, "a.b": { type: "double", value: 0.5 } },
				deletedFieldNames: ["remove"],
			},
		});
		expect(updated.fields).toEqual({
			keep: { type: "integer", value: "1" },
			change: { type: "string", value: "new" },
			"a.b": { type: "double", value: 0.5 },
		});
		await expect(
			sessions.request({
				type: "updateDocument",
				params: {
					database: DATABASE,
					documentPath: `${COLLECTION}/missing`,
					changedFields: { a: { type: "null" } },
					deletedFieldNames: [],
				},
			}),
		).rejects.toThrow("The document does not exist.");
	});

	test("sets a whole document, replacing its fields", async () => {
		await db.doc(`${COLLECTION}/replaced`).set({ old: true });
		const replaced = await sessions.request({
			type: "setDocument",
			params: { database: DATABASE, documentPath: `${COLLECTION}/replaced`, fields: { fresh: { type: "integer", value: "7" } } },
		});
		expect(replaced.fields).toEqual({ fresh: { type: "integer", value: "7" } });
	});

	test("deletes subcollections only when asked", async () => {
		await db.doc(`${COLLECTION}/parent-a`).set({ a: 1 });
		await db.doc(`${COLLECTION}/parent-a/children/one`).set({ c: 1 });
		await db.doc(`${COLLECTION}/parent-b`).set({ b: 1 });
		await db.doc(`${COLLECTION}/parent-b/children/one`).set({ c: 1 });

		await sessions.request({
			type: "deleteDocument",
			params: { database: DATABASE, documentPath: `${COLLECTION}/parent-a`, isRecursive: false },
		});
		expect((await db.doc(`${COLLECTION}/parent-a`).get()).exists).toBe(false);
		expect((await db.doc(`${COLLECTION}/parent-a/children/one`).get()).exists).toBe(true);

		await sessions.request({
			type: "deleteDocument",
			params: { database: DATABASE, documentPath: `${COLLECTION}/parent-b`, isRecursive: true },
		});
		expect((await db.doc(`${COLLECTION}/parent-b`).get()).exists).toBe(false);
		expect((await db.doc(`${COLLECTION}/parent-b/children/one`).get()).exists).toBe(false);
	});

	test("rejects a request that Firestore does not answer in time", async () => {
		const { sessions: slowSessions } = createSessions({ requestTimeoutMs: 500 });
		const startedAt = performance.now();
		await expect(
			slowSessions.request({
				type: "getDocument",
				params: { database: { ...DATABASE, accountId: UNREACHABLE_ACCOUNT.id }, documentPath: `${COLLECTION}/typed` },
			}),
		).rejects.toThrow("Firestore did not answer within 0.5 seconds.");
		expect(performance.now() - startedAt).toBeLessThan(2000);
		slowSessions.closeAll();
	});

	test("rejects a request for an unknown account", async () => {
		await expect(
			sessions.request({ type: "getDocument", params: { database: { ...DATABASE, accountId: "unknown" }, documentPath: "a/b" } }),
		).rejects.toThrow("Account unknown was not found.");
	});

	test("starts a new process after the session process crashes", async () => {
		const { sessions: crashingSessions, endedSessions } = createSessions();
		const pidsBefore = browseSessionPids();
		await getDocument(crashingSessions, `${COLLECTION}/typed`);
		const [pid] = browseSessionPids().filter((candidate) => !pidsBefore.includes(candidate));
		expect(pid).toBeNumber();

		process.kill(pid as number, "SIGKILL");
		await waitFor(() => endedSessions.length === 1);
		expect(endedSessions[0]?.reason).toBe("its process was stopped by SIGKILL");

		const document = await getDocument(crashingSessions, `${COLLECTION}/typed`);
		expect(document?.id).toBe("typed");
		expect(browseSessionPids()).not.toContain(pid as number);
		crashingSessions.closeAll();
	});

	test("stops an idle session and starts it again on the next request", async () => {
		const { sessions: idleSessions, endedSessions } = createSessions({ idleTimeoutMs: 300 });
		await getDocument(idleSessions, `${COLLECTION}/typed`);
		await Bun.sleep(150);
		expect(endedSessions).toEqual([]);
		await waitFor(() => endedSessions.length === 1);
		expect(endedSessions[0]).toEqual({ target: DATABASE, reason: "it was idle" });

		expect((await getDocument(idleSessions, `${COLLECTION}/typed`))?.id).toBe("typed");
		idleSessions.closeAll();
	});
});
