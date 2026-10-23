import { GeoPoint, Timestamp } from "@google-cloud/firestore";
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { join } from "node:path";
import { BrowseSessions } from "../../../src/bun/services/browse-sessions";
import type { DatabaseTarget, EmulatorAccount } from "../../../src/shared/interfaces/account.interface";
import type { DocumentPage } from "../../../src/shared/interfaces/browse.interface";
import type { LiveChanges, LiveUpdate } from "../../../src/shared/interfaces/live.interface";
import type { QueryCursor, QueryFilter, StructuredQuery } from "../../../src/shared/interfaces/query.interface";
import { createFirestore } from "../../../src/worker/firestore-client";

const WORKER_PATH = join(import.meta.dir, "../../../src/worker/index.ts");
const PROJECT_ID = "demo-cinder";
const ACCOUNT: EmulatorAccount = { id: "emulator", type: "emulator", host: "127.0.0.1", port: 8080, projectIds: [PROJECT_ID] };
const UNREACHABLE_ACCOUNT: EmulatorAccount = { ...ACCOUNT, id: "unreachable", port: 1 };
const DATABASE: DatabaseTarget = { accountId: ACCOUNT.id, projectId: PROJECT_ID, databaseId: "(default)" };
const COLLECTION = `browse-sessions-test-${crypto.randomUUID()}`;
const PAGED_COLLECTION = `${COLLECTION}/paged/items`;
const PAGED_IDS = ["a1", "a2", "b1", "b2", "c1", "c2", "d1"];
const QUERY_COLLECTION = `${COLLECTION}/query/items`;
const QUERY_GROUP_ID = `query-group-${crypto.randomUUID()}`;
const LIVE_COLLECTION = `${COLLECTION}/live/items`;
const QUERY_ITEMS = {
	i1: { age: 15, score: 1.5, tags: ["red"], active: true, team: "a", joined: new Timestamp(1000, 0), note: null },
	i2: { age: 25, score: 2.5, tags: ["red", "blue"], active: false, team: "b", joined: new Timestamp(2000, 0), note: "x" },
	i3: { age: 35, score: 3.5, tags: ["blue"], active: true, team: "a", joined: new Timestamp(3000, 0), note: "y" },
	i4: { age: 45, score: 4.5, tags: [], active: true, team: "c", joined: new Timestamp(4000, 0), note: null },
	i5: { age: 55, score: 5.5, tags: ["green"], active: false, team: "b", joined: new Timestamp(5000, 0), note: "z" },
};
const db = createFirestore({ type: "emulator", projectId: PROJECT_ID, databaseId: "(default)", host: ACCOUNT.host, port: ACCOUNT.port });

function createSessions(options: { requestTimeoutMs?: number; idleTimeoutMs?: number } = {}) {
	const endedSessions: { target: DatabaseTarget; reason: string }[] = [];
	const liveUpdates: LiveUpdate[] = [];
	const sessions = new BrowseSessions({
		workerPath: WORKER_PATH,
		requestTimeoutMs: options.requestTimeoutMs ?? 10_000,
		idleTimeoutMs: options.idleTimeoutMs ?? 60_000,
		findAccount: (accountId) => [ACCOUNT, UNREACHABLE_ACCOUNT].find((account) => account.id === accountId),
		onSessionEnd: (target, reason) => endedSessions.push({ target, reason }),
		onLiveUpdate: (update) => liveUpdates.push(update),
	});
	return { sessions, endedSessions, liveUpdates };
}

function getDocument(sessions: BrowseSessions, documentPath: string) {
	return sessions.request({ type: "getDocument", params: { database: DATABASE, documentPath } });
}

function queryOf(partial: Partial<StructuredQuery>): StructuredQuery {
	return { target: { type: "collection", collectionPath: QUERY_COLLECTION }, filters: [], orders: [], limit: null, ...partial };
}

function runQuery(query: StructuredQuery, pageSize = 50, startAfter: QueryCursor | null = null) {
	return sessions.request({ type: "runQuery", params: { database: DATABASE, query, pageSize, startAfter } });
}

async function idsMatching(filter: QueryFilter): Promise<string[]> {
	const page = await runQuery(queryOf({ filters: [filter] }));
	return page.documents.map((document) => document.id).sort();
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
	await Promise.all(Object.entries(QUERY_ITEMS).map(([id, fields]) => db.doc(`${QUERY_COLLECTION}/${id}`).set(fields)));
	await db.doc(`${COLLECTION}/g1/${QUERY_GROUP_ID}/first`).set({ kind: "match" });
	await db.doc(`${COLLECTION}/g2/${QUERY_GROUP_ID}/second`).set({ kind: "match" });
	await db.doc(`${COLLECTION}/g2/${QUERY_GROUP_ID}/third`).set({ kind: "other" });
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

describe("BrowseSessions runQuery", () => {
	test("filters with every operator and value type", async () => {
		const integer = (value: string) => ({ type: "integer" as const, value });
		const text = (value: string) => ({ type: "string" as const, value });
		const list = (...values: string[]) => ({ type: "array" as const, value: values.map(text) });
		expect(await idsMatching({ fieldPath: "team", operator: "==", value: text("a") })).toEqual(["i1", "i3"]);
		expect(await idsMatching({ fieldPath: "team", operator: "!=", value: text("a") })).toEqual(["i2", "i4", "i5"]);
		expect(await idsMatching({ fieldPath: "age", operator: "<", value: integer("25") })).toEqual(["i1"]);
		expect(await idsMatching({ fieldPath: "age", operator: "<=", value: integer("25") })).toEqual(["i1", "i2"]);
		expect(await idsMatching({ fieldPath: "age", operator: ">", value: integer("45") })).toEqual(["i5"]);
		expect(await idsMatching({ fieldPath: "age", operator: ">=", value: integer("45") })).toEqual(["i4", "i5"]);
		expect(await idsMatching({ fieldPath: "tags", operator: "array-contains", value: text("red") })).toEqual(["i1", "i2"]);
		expect(await idsMatching({ fieldPath: "tags", operator: "array-contains-any", value: list("blue", "green") })).toEqual([
			"i2",
			"i3",
			"i5",
		]);
		expect(await idsMatching({ fieldPath: "team", operator: "in", value: list("a", "c") })).toEqual(["i1", "i3", "i4"]);
		expect(await idsMatching({ fieldPath: "team", operator: "not-in", value: list("a", "c") })).toEqual(["i2", "i5"]);
		expect(await idsMatching({ fieldPath: "note", operator: "==", value: { type: "null" } })).toEqual(["i1", "i4"]);
		expect(await idsMatching({ fieldPath: "active", operator: "==", value: { type: "boolean", value: false } })).toEqual(["i2", "i5"]);
		expect(await idsMatching({ fieldPath: "score", operator: ">", value: { type: "double", value: 3 } })).toEqual(["i3", "i4", "i5"]);
		expect(
			await idsMatching({ fieldPath: "joined", operator: ">", value: { type: "timestamp", value: { seconds: 2500, nanos: 0 } } }),
		).toEqual(["i3", "i4", "i5"]);
	});

	test("orders and limits, and returns exact number types", async () => {
		const page = await runQuery(
			queryOf({
				filters: [{ fieldPath: "active", operator: "==", value: { type: "boolean", value: true } }],
				orders: [{ fieldPath: "age", direction: "desc" }],
				limit: 2,
			}),
		);
		expect(page.documents.map((document) => document.id)).toEqual(["i4", "i3"]);
		expect(page.hasMore).toBe(false);
		expect(page.documents[0]?.fields.age).toEqual({ type: "integer", value: "45" });
		expect(page.documents[0]?.fields.score).toEqual({ type: "double", value: 4.5 });
		expect(page.documents[0]?.path).toBe(`${QUERY_COLLECTION}/i4`);
	});

	test("queries a collection group across parents", async () => {
		const page = await runQuery({
			target: { type: "collection-group", collectionId: QUERY_GROUP_ID },
			filters: [{ fieldPath: "kind", operator: "==", value: { type: "string", value: "match" } }],
			orders: [],
			limit: null,
		});
		expect(page.documents.map((document) => document.path).sort()).toEqual([
			`${COLLECTION}/g1/${QUERY_GROUP_ID}/first`,
			`${COLLECTION}/g2/${QUERY_GROUP_ID}/second`,
		]);
	});

	test("pages after the last loaded document without gaps or duplicates, and stops at the limit", async () => {
		const pageIds = async (query: StructuredQuery) => {
			const pages: string[][] = [];
			const hasMore: boolean[] = [];
			let cursor: QueryCursor | null = null;
			let loadedCount = 0;
			do {
				const page: DocumentPage = await runQuery(query, 2, cursor);
				pages.push(page.documents.map((document) => document.id));
				hasMore.push(page.hasMore);
				loadedCount += page.documents.length;
				const last = page.documents.at(-1);
				cursor = page.hasMore && last ? { documentPath: last.path, documentCount: loadedCount } : null;
			} while (cursor !== null);
			return { pages, hasMore };
		};
		const byScore = queryOf({ orders: [{ fieldPath: "score", direction: "desc" }] });
		expect(await pageIds(byScore)).toEqual({ pages: [["i5", "i4"], ["i3", "i2"], ["i1"]], hasMore: [true, true, false] });
		expect(await pageIds({ ...byScore, limit: 3 })).toEqual({ pages: [["i5", "i4"], ["i3"]], hasMore: [true, false] });
		const adults = queryOf({ filters: [{ fieldPath: "age", operator: ">", value: { type: "integer", value: "20" } }] });
		expect(await pageIds(adults)).toEqual({ pages: [["i2", "i3"], ["i4", "i5"]], hasMore: [true, false] });
	});

	test("counts the documents a query matches, at most its limit", async () => {
		const count = (query: StructuredQuery) => sessions.request({ type: "countQuery", params: { database: DATABASE, query } });
		const active = queryOf({ filters: [{ fieldPath: "active", operator: "==", value: { type: "boolean", value: true } }] });
		expect(await count(active)).toBe(3);
		expect(await count({ ...active, limit: 2 })).toBe(2);
	});

	test("fails readably when the cursor document was deleted", async () => {
		await expect(
			runQuery(queryOf({}), 2, { documentPath: `${QUERY_COLLECTION}/missing`, documentCount: 2 }),
		).rejects.toThrow("The last loaded document was deleted. Run the query again.");
	});
});

describe("BrowseSessions live updates", () => {
	const liveQuery: StructuredQuery = { target: { type: "collection", collectionPath: LIVE_COLLECTION }, filters: [], orders: [], limit: null };

	function changesOf(updates: LiveUpdate[], listenerId: string): LiveChanges[] {
		return updates.filter((update): update is LiveChanges => update.listenerId === listenerId && update.kind === "changes");
	}

	test("sends the window first, then added, modified and removed documents with exact types, until stopped", async () => {
		await db.doc(`${LIVE_COLLECTION}/b`).set({ count: 1 });
		const { sessions: liveSessions, liveUpdates } = createSessions();
		const listenerId = crypto.randomUUID();
		await liveSessions.startLive({ listenerId, database: DATABASE, query: liveQuery, limit: 10 });
		await waitFor(() => changesOf(liveUpdates, listenerId).length === 1);
		const [first] = changesOf(liveUpdates, listenerId);
		expect(first.isFirst).toBe(true);
		expect(first.changes.map((change) => [change.type, change.document.id, change.newIndex])).toEqual([["added", "b", 0]]);

		const startedAt = performance.now();
		await db.doc(`${LIVE_COLLECTION}/a`).set({ count: 9007199254740993n });
		await waitFor(() => changesOf(liveUpdates, listenerId).length === 2);
		expect(performance.now() - startedAt).toBeLessThan(1000);
		await writeDoubleThroughRest(`${LIVE_COLLECTION}/b`, "count", 2);
		await waitFor(() => changesOf(liveUpdates, listenerId).length === 3);
		await db.doc(`${LIVE_COLLECTION}/a`).delete();
		await waitFor(() => changesOf(liveUpdates, listenerId).length === 4);

		const [, added, modified, removed] = changesOf(liveUpdates, listenerId).map((update) => update.changes[0]);
		expect(added).toMatchObject({ type: "added", oldIndex: -1, newIndex: 0, document: { id: "a", fields: { count: { type: "integer", value: "9007199254740993" } } } });
		expect(modified).toMatchObject({ type: "modified", oldIndex: 1, newIndex: 1, document: { id: "b", fields: { count: { type: "double", value: 2 } } } });
		expect(removed).toMatchObject({ type: "removed", oldIndex: 0, newIndex: -1, document: { id: "a" } });

		await liveSessions.stopLive(listenerId);
		const countAfterStop = liveUpdates.length;
		await db.doc(`${LIVE_COLLECTION}/c`).set({ count: 3 });
		await Bun.sleep(500);
		expect(liveUpdates.length).toBe(countAfterStop);
		liveSessions.closeAll();
		await db.doc(`${LIVE_COLLECTION}/b`).delete();
		await db.doc(`${LIVE_COLLECTION}/c`).delete();
	});

	test("keeps the window at its limit as documents enter before its end", async () => {
		await Promise.all(["b", "c"].map((id) => db.doc(`${LIVE_COLLECTION}/${id}`).set({ id })));
		const { sessions: liveSessions, liveUpdates } = createSessions();
		const listenerId = crypto.randomUUID();
		await liveSessions.startLive({ listenerId, database: DATABASE, query: liveQuery, limit: 2 });
		await waitFor(() => changesOf(liveUpdates, listenerId).length === 1);
		await db.doc(`${LIVE_COLLECTION}/a`).set({ id: "a" });
		await waitFor(() => changesOf(liveUpdates, listenerId).length === 2);
		const changes = changesOf(liveUpdates, listenerId)[1].changes.map((change) => [change.type, change.document.id]);
		expect(changes).toContainEqual(["added", "a"]);
		expect(changes).toContainEqual(["removed", "c"]);
		liveSessions.closeAll();
		await Promise.all(["a", "b", "c"].map((id) => db.doc(`${LIVE_COLLECTION}/${id}`).delete()));
	});

	test("reports that live updates stopped when the session shuts down for being idle", async () => {
		const { sessions: idleSessions, liveUpdates, endedSessions } = createSessions({ idleTimeoutMs: 300 });
		const listenerId = crypto.randomUUID();
		await idleSessions.startLive({ listenerId, database: DATABASE, query: liveQuery, limit: 5 });
		await waitFor(() => endedSessions.length === 1);
		await waitFor(() => liveUpdates.some((update) => update.kind === "stopped"));
		expect(liveUpdates.at(-1)).toEqual({ listenerId, kind: "stopped", reason: "The browse session stopped because it was idle." });
		const countAfterStop = liveUpdates.length;
		await db.doc(`${LIVE_COLLECTION}/late`).set({ late: true });
		await Bun.sleep(300);
		expect(liveUpdates.length).toBe(countAfterStop);
		await expect(idleSessions.stopLive(listenerId)).resolves.toBeUndefined();
		await db.doc(`${LIVE_COLLECTION}/late`).delete();
	});

	test("stops with Firestore's message when the listener fails, and refuses a running listener id", async () => {
		const { sessions: liveSessions, liveUpdates } = createSessions();
		const listenerId = crypto.randomUUID();
		const tooManyValues = Array.from({ length: 31 }, (_, index) => ({ type: "integer" as const, value: String(index) }));
		const failingQuery: StructuredQuery = { ...liveQuery, filters: [{ fieldPath: "n", operator: "in", value: { type: "array", value: tooManyValues } }] };
		await liveSessions.startLive({ listenerId, database: DATABASE, query: failingQuery, limit: 5 });
		await waitFor(() => liveUpdates.some((update) => update.kind === "stopped"));
		expect(liveUpdates.at(-1)).toMatchObject({ listenerId, kind: "stopped", reason: expect.stringContaining("30") });

		const runningId = crypto.randomUUID();
		await liveSessions.startLive({ listenerId: runningId, database: DATABASE, query: liveQuery, limit: 5 });
		await expect(liveSessions.startLive({ listenerId: runningId, database: DATABASE, query: liveQuery, limit: 5 })).rejects.toThrow(
			"This live view is already running.",
		);
		liveSessions.closeAll();
	});
});
