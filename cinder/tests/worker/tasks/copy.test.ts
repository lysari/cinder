import type { Firestore } from "@google-cloud/firestore";
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import type { WriteMode } from "../../../src/shared/constants/data-transfer";
import { EMPTY_TASK_PROGRESS } from "../../../src/shared/constants/task";
import type { EmulatorDatabaseSettings } from "../../../src/shared/interfaces/account.interface";
import type { CopySource, CopyTaskRequest } from "../../../src/shared/interfaces/copy.interface";
import type { FirestoreValue } from "../../../src/shared/interfaces/firestore-value.interface";
import type { TaskContext } from "../../../src/shared/interfaces/task.interface";
import { createFirestore } from "../../../src/worker/firestore-client";
import { copyDocuments } from "../../../src/worker/tasks/copy";
import { decodeFields } from "../../../src/worker/utils/firestore-value-decoder";
import { encodeBigIntDocument } from "../../../src/worker/utils/firestore-value-encoder";

const SETTINGS: EmulatorDatabaseSettings = { type: "emulator", projectId: "demo-cinder", databaseId: "(default)", host: "127.0.0.1", port: 8080 };
const OTHER_SETTINGS: EmulatorDatabaseSettings = { ...SETTINGS, projectId: "demo-cinder-copy" };
const DATABASE = { accountId: "emulator", projectId: SETTINGS.projectId, databaseId: SETTINGS.databaseId };
const OTHER_DATABASE = { ...DATABASE, projectId: OTHER_SETTINGS.projectId };
const RUN_ID = crypto.randomUUID();
const SOURCE = `copy-test-source-${RUN_ID}`;
const db = createFirestore(SETTINGS, { useBigInt: true });
const otherDb = createFirestore(OTHER_SETTINGS, { useBigInt: true });
const usedCollections: string[] = [SOURCE];

const EVERY_TYPE: Record<string, FirestoreValue> = {
	text: { type: "string", value: 'ភ្នំពេញ "quoted"\nline' },
	largeInteger: { type: "integer", value: "9007199254740993" },
	minInteger: { type: "integer", value: "-9223372036854775808" },
	wholeDouble: { type: "double", value: 2 },
	negativeZero: { type: "double", value: -0 },
	notANumber: { type: "double", value: "NaN" },
	infinity: { type: "double", value: "-Infinity" },
	flag: { type: "boolean", value: true },
	nothing: { type: "null" },
	time: { type: "timestamp", value: { seconds: 1700000000, nanos: 123456000 } },
	bytes: { type: "bytes", value: "AQL/" },
	place: { type: "geopoint", value: { latitude: 11.55, longitude: 104.92 } },
	outside: { type: "reference", value: "elsewhere/doc" },
	embedding: { type: "vector", value: [0.5, 1, 2] },
	list: { type: "array", value: [{ type: "integer", value: "1" }, { type: "double", value: 3 }, { type: "map", value: {} }] },
	nested: { type: "map", value: { deep: { type: "map", value: { "dotted.name": { type: "string", value: "x" } } } } },
};

function createContext(): TaskContext {
	return { taskId: crypto.randomUUID(), isEmulator: true, progress: { ...EMPTY_TASK_PROGRESS }, log: () => {} };
}

function newCollection(name: string): string {
	const collectionPath = `copy-test-${name}-${RUN_ID}`;
	usedCollections.push(collectionPath);
	return collectionPath;
}

function copyRequest(source: CopySource, destinationPath: string, changes: Partial<CopyTaskRequest> = {}): CopyTaskRequest {
	return {
		type: "copy",
		database: DATABASE,
		source,
		destination: { database: DATABASE, path: destinationPath },
		isMove: false,
		isRecursive: true,
		writeMode: "overwrite",
		isRewritingReferences: false,
		...changes,
	};
}

async function copy(request: CopyTaskRequest, destinationDb: Firestore = db) {
	const context = createContext();
	const result = await copyDocuments(db, destinationDb, request, context);
	return { result, context };
}

async function readTree(database: Firestore, collectionPath: string): Promise<Record<string, Record<string, FirestoreValue>>> {
	const tree: Record<string, Record<string, FirestoreValue>> = {};
	const visit = async (path: string, prefix: string): Promise<void> => {
		const { docs } = await database.collection(path).get();
		await Promise.all(
			docs.map(async (document) => {
				tree[`${prefix}/${document.id}`] = encodeBigIntDocument(document).fields;
				const subcollections = await document.ref.listCollections();
				await Promise.all(subcollections.map((subcollection) => visit(subcollection.path, `${prefix}/${document.id}/${subcollection.id}`)));
			}),
		);
	};
	await visit(collectionPath, "");
	return tree;
}

async function seedTree(collectionPath: string, userCount: number): Promise<void> {
	const writer = db.bulkWriter({ throttling: false });
	for (let index = 0; index < userCount; index += 1) {
		const userPath = `${collectionPath}/user-${String(index).padStart(2, "0")}`;
		void writer.set(db.doc(userPath), decodeFields({ ...EVERY_TYPE, index: { type: "integer", value: String(index) } }, db));
		void writer.set(db.doc(`${userPath}/orders/order-1`), decodeFields({ total: { type: "double", value: 10 } }, db));
		void writer.set(db.doc(`${userPath}/orders/order-1/items/item-1`), decodeFields({ sku: { type: "string", value: "A-1" } }, db));
	}
	await writer.close();
}

beforeAll(async () => {
	await seedTree(SOURCE, 12);
});

afterAll(async () => {
	for (const collectionPath of usedCollections) {
		await db.recursiveDelete(db.collection(collectionPath));
		await otherDb.recursiveDelete(otherDb.collection(collectionPath));
	}
	await db.terminate();
	await otherDb.terminate();
});

describe("copy", () => {
	test("copies a collection with every subcollection and exact values", async () => {
		const target = newCollection("recursive");
		const { result, context } = await copy(copyRequest({ type: "collection", collectionPath: SOURCE }, target));
		expect(result).toMatchObject({ kind: "writes", writeCount: 36, skipCount: 0, deleteCount: 0, failureCount: 0 });
		expect(context.progress.reads).toBe(36);
		const copied = await readTree(db, target);
		expect(copied).toEqual(await readTree(db, SOURCE));
		const first = copied["/user-00"] as Record<string, FirestoreValue>;
		expect(first.wholeDouble).toEqual({ type: "double", value: 2 });
		expect(Object.is((first.negativeZero as { value: number }).value, -0)).toBe(true);
		expect(first.largeInteger).toEqual({ type: "integer", value: "9007199254740993" });
	});

	test("copies only the documents of a collection without subcollections, with a counted total", async () => {
		const target = newCollection("flat");
		const { result, context } = await copy(copyRequest({ type: "collection", collectionPath: SOURCE }, target, { isRecursive: false }));
		expect(result.writeCount).toBe(12);
		expect(context.progress.totalDocuments).toBe(12);
		expect(Object.keys(await readTree(db, target))).toHaveLength(12);
	});

	test("duplicates a document under a generated id with its subcollections", async () => {
		const generatedId = db.collection(SOURCE).doc().id;
		const target = `${SOURCE}/${generatedId}`;
		const { result } = await copy(copyRequest({ type: "document", documentPath: `${SOURCE}/user-01` }, target));
		expect(result.writeCount).toBe(3);
		expect(encodeBigIntDocument(await db.doc(target).get()).fields).toEqual(encodeBigIntDocument(await db.doc(`${SOURCE}/user-01`).get()).fields);
		expect((await db.doc(`${target}/orders/order-1/items/item-1`).get()).get("sku")).toBe("A-1");
		await db.recursiveDelete(db.doc(target));
	});

	test("copies a collection to another project id with equal values", async () => {
		const target = newCollection("cross-project");
		const request = copyRequest({ type: "collection", collectionPath: SOURCE }, target, {
			destination: { database: OTHER_DATABASE, path: target },
		});
		const { result } = await copy(request, otherDb);
		expect(result.writeCount).toBe(36);
		expect(await readTree(otherDb, target)).toEqual(await readTree(db, SOURCE));
		expect(await readTree(db, target)).toEqual({});
	});
});

describe("copy conflict modes", () => {
	async function copyOnto(writeMode: WriteMode) {
		const target = newCollection(`mode-${writeMode}`);
		await db.doc(`${target}/user-00`).set({ kept: "old", index: -1n });
		const { result } = await copy(copyRequest({ type: "document", documentPath: `${SOURCE}/user-00` }, `${target}/user-00`, { isRecursive: false, writeMode }));
		return { result, data: (await db.doc(`${target}/user-00`).get()).data() };
	}

	test("overwrite replaces the existing document", async () => {
		const { data } = await copyOnto("overwrite");
		expect(data?.kept).toBeUndefined();
		expect(data?.index).toBe(0n);
	});

	test("merge keeps fields the source does not have", async () => {
		const { data } = await copyOnto("merge");
		expect(data?.kept).toBe("old");
		expect(data?.index).toBe(0n);
	});

	test("skip leaves the existing document and counts it", async () => {
		const { result, data } = await copyOnto("skip");
		expect(result).toMatchObject({ writeCount: 0, skipCount: 1, failureCount: 0 });
		expect(data).toEqual({ kept: "old", index: -1n });
	});
});

describe("move", () => {
	test("moves a document with its subcollections", async () => {
		const source = newCollection("move-document-source");
		await seedTree(source, 1);
		const target = newCollection("move-document-target");
		const { result } = await copy(copyRequest({ type: "document", documentPath: `${source}/user-00` }, `${target}/moved`, { isMove: true }));
		expect(result).toMatchObject({ writeCount: 3, deleteCount: 3, failureCount: 0 });
		expect(await readTree(db, source)).toEqual({});
		expect((await db.doc(`${target}/moved/orders/order-1/items/item-1`).get()).get("sku")).toBe("A-1");
	});

	test("renames a collection: the source is gone and the destination holds the same tree", async () => {
		const source = newCollection("rename-source");
		await seedTree(source, 12);
		const expected = await readTree(db, source);
		const target = newCollection("rename-target");
		const { result } = await copy(copyRequest({ type: "collection", collectionPath: source }, target, { isMove: true }));
		expect(result).toMatchObject({ writeCount: 36, deleteCount: 36, failureCount: 0 });
		expect(await readTree(db, target)).toEqual(expected);
		expect(await db.collection(source).listDocuments()).toEqual([]);
	});

	test("deletes a source document only after its copy was written", async () => {
		const source = newCollection("move-failure-source");
		await db.doc(`${source}/small`).set({ n: 1n });
		await db.doc(`${source}/large`).set({ text: "x".repeat(1_048_000) });
		const target = newCollection(`move-failure-target-${"y".repeat(1400)}`);
		const { result } = await copy(copyRequest({ type: "collection", collectionPath: source }, target, { isMove: true }));
		expect(result).toMatchObject({ writeCount: 1, deleteCount: 1, failureCount: 1 });
		expect(result.failures[0]?.documentPath).toBe(`${target}/large`);
		expect(result.failures[0]?.message).toContain("maximum entity size");
		expect((await db.doc(`${source}/large`).get()).exists).toBe(true);
		expect((await db.doc(`${source}/small`).get()).exists).toBe(false);
		expect((await db.doc(`${target}/small`).get()).get("n")).toBe(1n);
		expect((await db.doc(`${target}/large`).get()).exists).toBe(false);
	});

	test("keeps the source of a document skipped because the destination exists", async () => {
		const source = newCollection("move-skip-source");
		await db.doc(`${source}/a`).set({ n: 1n });
		const target = newCollection("move-skip-target");
		await db.doc(`${target}/a`).set({ n: 2n });
		const { result } = await copy(copyRequest({ type: "collection", collectionPath: source }, target, { isMove: true, writeMode: "skip" }));
		expect(result).toMatchObject({ writeCount: 0, skipCount: 1, deleteCount: 0 });
		expect((await db.doc(`${source}/a`).get()).get("n")).toBe(1n);
	});
});

describe("references", () => {
	async function copyWithReferences(isRewritingReferences: boolean, isRecursive: boolean) {
		const source = newCollection(`references-${isRewritingReferences}-${isRecursive}-source`);
		const outside = `${source}-other/b`;
		const fields: Record<string, FirestoreValue> = {
			sibling: { type: "reference", value: `${source}/b` },
			child: { type: "reference", value: `${source}/b/orders/1` },
			outside: { type: "reference", value: outside },
			inList: { type: "array", value: [{ type: "map", value: { ref: { type: "reference", value: `${source}/b` } } }] },
		};
		await db.doc(`${source}/a`).set(decodeFields(fields, db));
		const target = newCollection(`references-${isRewritingReferences}-${isRecursive}-target`);
		await copy(copyRequest({ type: "collection", collectionPath: source }, target, { isRewritingReferences, isRecursive }));
		const copied = encodeBigIntDocument(await db.doc(`${target}/a`).get()).fields;
		return { copied, fields, source, target, outside };
	}

	test("are copied unchanged by default", async () => {
		const { copied, fields } = await copyWithReferences(false, true);
		expect(copied).toEqual(fields);
	});

	test("are rewritten when they point inside the copied tree", async () => {
		const { copied, target, outside } = await copyWithReferences(true, true);
		expect(copied).toEqual({
			sibling: { type: "reference", value: `${target}/b` },
			child: { type: "reference", value: `${target}/b/orders/1` },
			outside: { type: "reference", value: outside },
			inList: { type: "array", value: [{ type: "map", value: { ref: { type: "reference", value: `${target}/b` } } }] },
		});
	});

	test("keep pointing at subcollection documents a copy without subcollections leaves behind", async () => {
		const { copied, source, target } = await copyWithReferences(true, false);
		expect(copied.sibling).toEqual({ type: "reference", value: `${target}/b` });
		expect(copied.child).toEqual({ type: "reference", value: `${source}/b/orders/1` });
	});
});
