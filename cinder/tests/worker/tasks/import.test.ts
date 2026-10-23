import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { WriteMode } from "../../../src/shared/constants/data-transfer";
import { EMPTY_TASK_PROGRESS } from "../../../src/shared/constants/task";
import type { EmulatorDatabaseSettings } from "../../../src/shared/interfaces/account.interface";
import type { ExportSource } from "../../../src/shared/interfaces/export.interface";
import type { FirestoreValue } from "../../../src/shared/interfaces/firestore-value.interface";
import type { ImportTarget } from "../../../src/shared/interfaces/import.interface";
import type { TaskContext, TaskLogEntry } from "../../../src/shared/interfaces/task.interface";
import { createFirestore } from "../../../src/worker/firestore-client";
import { exportDocuments } from "../../../src/worker/tasks/export";
import { importDocuments } from "../../../src/worker/tasks/import";
import { decodeFields } from "../../../src/worker/utils/firestore-value-decoder";
import { encodeBigIntDocument } from "../../../src/worker/utils/firestore-value-encoder";

const SETTINGS: EmulatorDatabaseSettings = { type: "emulator", projectId: "demo-cinder", databaseId: "(default)", host: "127.0.0.1", port: 8080 };
const DATABASE = { accountId: "emulator", projectId: SETTINGS.projectId, databaseId: SETTINGS.databaseId };
const RUN_ID = crypto.randomUUID();
const SOURCE = `import-test-source-${RUN_ID}`;
const USER_COUNT = 2;
const SOURCE_DOCUMENT_COUNT = USER_COUNT * 3;
const db = createFirestore(SETTINGS, { useBigInt: true });
const usedCollections: string[] = [SOURCE];
let folderPath = "";

const EVERY_TYPE: Record<string, FirestoreValue> = {
	text: { type: "string", value: 'ភ្នំពេញ "quoted"\nline' },
	integer: { type: "integer", value: "42" },
	largeInteger: { type: "integer", value: "9007199254740993" },
	minInteger: { type: "integer", value: "-9223372036854775808" },
	wholeDouble: { type: "double", value: 2 },
	double: { type: "double", value: 1.5 },
	negativeZero: { type: "double", value: -0 },
	notANumber: { type: "double", value: "NaN" },
	infinity: { type: "double", value: "-Infinity" },
	flag: { type: "boolean", value: true },
	nothing: { type: "null" },
	time: { type: "timestamp", value: { seconds: 1700000000, nanos: 123456000 } },
	bytes: { type: "bytes", value: "AQL/" },
	place: { type: "geopoint", value: { latitude: 11.55, longitude: 104.92 } },
	link: { type: "reference", value: "users/dara/orders/1" },
	embedding: { type: "vector", value: [0.5, 1, 2] },
	list: {
		type: "array",
		value: [
			{ type: "integer", value: "1" },
			{ type: "double", value: 3 },
			{ type: "map", value: { inner: { type: "timestamp", value: { seconds: 0, nanos: 1000 } } } },
		],
	},
	nested: {
		type: "map",
		value: {
			deep: { type: "map", value: { "dotted.name": { type: "string", value: "x" }, empty: { type: "map", value: {} } } },
			emptyList: { type: "array", value: [] },
		},
	},
};

function createContext(): TaskContext & { logEntries: TaskLogEntry[] } {
	const logEntries: TaskLogEntry[] = [];
	return {
		taskId: crypto.randomUUID(),
		isEmulator: true,
		progress: { ...EMPTY_TASK_PROGRESS },
		log: (level, message) => logEntries.push({ level, message, time: new Date().toISOString() }),
		logEntries,
	};
}

function newCollection(name: string): string {
	const collectionPath = `import-test-${name}-${RUN_ID}`;
	usedCollections.push(collectionPath);
	return collectionPath;
}

async function readTree(collectionPath: string): Promise<Record<string, Record<string, FirestoreValue>>> {
	const tree: Record<string, Record<string, FirestoreValue>> = {};
	const visit = async (path: string, prefix: string) => {
		const snapshot = await db.collection(path).get();
		for (const document of snapshot.docs) {
			tree[`${prefix}/${document.id}`] = encodeBigIntDocument(document).fields;
			for (const subcollection of await document.ref.listCollections()) {
				await visit(subcollection.path, `${prefix}/${document.id}/${subcollection.id}`);
			}
		}
	};
	await visit(collectionPath, "");
	return tree;
}

async function exportTo(fileName: string, format: "cinder-json" | "ndjson", source: ExportSource): Promise<string> {
	const result = await exportDocuments(
		db,
		{ type: "export", database: DATABASE, source, format, folderPath, fileName, isOverwriting: false },
		createContext(),
	);
	return result.filePath;
}

async function importFile(filePath: string, format: "cinder-json" | "ndjson" | "json", target: ImportTarget, writeMode: WriteMode = "overwrite") {
	const context = createContext();
	const result = await importDocuments(db, { type: "import", database: DATABASE, filePath, format, target, writeMode }, context);
	return { result, context };
}

beforeAll(async () => {
	folderPath = await mkdtemp(join(tmpdir(), "cinder-import-test-"));
	const writer = db.bulkWriter({ throttling: false });
	for (let index = 0; index < USER_COUNT; index += 1) {
		const userPath = `${SOURCE}/user-${String(index).padStart(2, "0")}`;
		void writer.set(db.doc(userPath), decodeFields({ ...EVERY_TYPE, index: { type: "integer", value: String(index) } }, db));
		void writer.set(db.doc(`${userPath}/orders/order-1`), decodeFields({ total: { type: "double", value: 10 } }, db));
		void writer.set(db.doc(`${userPath}/orders/order-1/items/item-1`), decodeFields({ sku: { type: "string", value: "A-1" } }, db));
	}
	await writer.close();
});

afterAll(async () => {
	for (const collectionPath of usedCollections) {
		await db.recursiveDelete(db.collection(collectionPath));
	}
	await db.recursiveDelete(db.collection("import-test-original"));
	await db.terminate();
	await rm(folderPath, { recursive: true, force: true });
});

describe("export and import round trip", () => {
	test("Cinder JSON keeps every value type and every subcollection", async () => {
		const filePath = await exportTo("round-trip.json", "cinder-json", { type: "collection", collectionPath: SOURCE, isRecursive: true });
		const target = newCollection("json-copy");
		const { result } = await importFile(filePath, "cinder-json", { type: "collection", collectionPath: target });
		expect(result).toMatchObject({ kind: "writes", writeCount: SOURCE_DOCUMENT_COUNT, skipCount: 0, deleteCount: 0, failureCount: 0, failures: [] });
		const source = await readTree(SOURCE);
		const copy = await readTree(target);
		expect(Object.keys(copy)).toHaveLength(SOURCE_DOCUMENT_COUNT);
		expect(copy).toEqual(source);
		const first = copy["/user-00"] as Record<string, FirestoreValue>;
		expect(first.wholeDouble).toEqual({ type: "double", value: 2 });
		expect(Object.is((first.negativeZero as { value: number }).value, -0)).toBe(true);
		expect(first.largeInteger).toEqual({ type: "integer", value: "9007199254740993" });
		expect(first.time).toEqual({ type: "timestamp", value: { seconds: 1700000000, nanos: 123456000 } });
	});

	test("NDJSON keeps every value type and every subcollection", async () => {
		const filePath = await exportTo("round-trip.ndjson", "ndjson", { type: "collection", collectionPath: SOURCE, isRecursive: true });
		const lines = (await Bun.file(filePath).text()).trimEnd().split("\n");
		expect(lines).toHaveLength(SOURCE_DOCUMENT_COUNT + 1);
		expect(JSON.parse(lines[0] as string)).toMatchObject({ format: "cinder-ndjson", version: 1, rootPath: SOURCE });
		const target = newCollection("ndjson-copy");
		const { result } = await importFile(filePath, "ndjson", { type: "collection", collectionPath: target });
		expect(result.writeCount).toBe(SOURCE_DOCUMENT_COUNT);
		expect(await readTree(target)).toEqual(await readTree(SOURCE));
	});

	test("imports to the original paths when asked", async () => {
		const original = "import-test-original";
		await db.doc(`${original}/${RUN_ID}`).set({ value: 1n });
		const filePath = await exportTo("original.json", "cinder-json", { type: "document", documentPath: `${original}/${RUN_ID}`, isRecursive: false });
		await db.doc(`${original}/${RUN_ID}`).delete();
		const { result } = await importFile(filePath, "cinder-json", { type: "original-paths" });
		expect(result.writeCount).toBe(1);
		expect((await db.doc(`${original}/${RUN_ID}`).get()).get("value")).toBe(1n);
	});
});

describe("import write modes", () => {
	async function prepare(name: string): Promise<{ target: string; filePath: string }> {
		const target = newCollection(name);
		await db.doc(`${target}/user-00`).set({ kept: "old", index: -1n });
		const filePath = await exportTo(`${name}.json`, "cinder-json", { type: "document", documentPath: `${SOURCE}/user-00`, isRecursive: false });
		return { target, filePath };
	}

	test("overwrite replaces the existing document", async () => {
		const { target, filePath } = await prepare("overwrite");
		await importFile(filePath, "cinder-json", { type: "collection", collectionPath: target }, "overwrite");
		const data = (await db.doc(`${target}/user-00`).get()).data();
		expect(data?.kept).toBeUndefined();
		expect(data?.index).toBe(0n);
	});

	test("merge keeps fields the import does not name", async () => {
		const { target, filePath } = await prepare("merge");
		await importFile(filePath, "cinder-json", { type: "collection", collectionPath: target }, "merge");
		const data = (await db.doc(`${target}/user-00`).get()).data();
		expect(data?.kept).toBe("old");
		expect(data?.index).toBe(0n);
	});

	test("skip leaves existing documents unchanged and counts them", async () => {
		const { target, filePath } = await prepare("skip");
		const { result } = await importFile(filePath, "cinder-json", { type: "collection", collectionPath: target }, "skip");
		expect(result).toMatchObject({ writeCount: 0, skipCount: 1, failureCount: 0 });
		const data = (await db.doc(`${target}/user-00`).get()).data();
		expect(data).toEqual({ kept: "old", index: -1n });
	});
});

describe("import failures", () => {
	test("reports a bad document with its path and reason and continues", async () => {
		const filePath = join(folderPath, "broken.json");
		const good = { path: "a/good", fields: { n: { type: "integer", value: "1" } } };
		const badValue = { path: "a/bad-value", fields: { n: { type: "integer", value: "1.5" } } };
		const badPath = { path: "a", fields: {} };
		await Bun.write(
			filePath,
			JSON.stringify({ format: "cinder-json", version: 1, rootPath: "a", documents: [good, badValue, badPath, { ...good, path: "a/good-2" }] }),
		);
		const target = newCollection("failures");
		const { result, context } = await importFile(filePath, "cinder-json", { type: "collection", collectionPath: target });
		expect(result.writeCount).toBe(2);
		expect(result.failureCount).toBe(2);
		expect(result.failures).toEqual([
			{ documentPath: "a/bad-value", rowNumber: null, message: "An integer must be a whole number in the 64-bit range." },
			{ documentPath: "a", rowNumber: null, message: "The document has no valid path." },
		]);
		expect(context.logEntries.filter((entry) => entry.level === "warn")).toHaveLength(2);
	});

	test("rejects a file that is not a Cinder export", async () => {
		const filePath = join(folderPath, "not-cinder.json");
		await Bun.write(filePath, JSON.stringify([{ a: 1 }]));
		await expect(importFile(filePath, "cinder-json", { type: "original-paths" })).rejects.toThrow(
			"The file is not a cinder-json export. 0 documents were written before this error and stay.",
		);
	});

	test("stops at invalid JSON and says how many documents stay", async () => {
		const filePath = join(folderPath, "cut.ndjson");
		await Bun.write(filePath, `${JSON.stringify({ format: "cinder-ndjson", version: 1 })}\n{"path":"a/1","fields":{}}\n{"path":`);
		const target = newCollection("cut");
		await expect(importFile(filePath, "ndjson", { type: "collection", collectionPath: target })).rejects.toThrow(
			"Line 3 is not valid JSON. 1 documents were written before this error and stay.",
		);
	});
});

describe("plain JSON import", () => {
	test("imports an array with __id and generated ids, mapping JSON types", async () => {
		const filePath = join(folderPath, "plain-array.json");
		await Bun.write(
			filePath,
			`﻿${JSON.stringify([
				{ __id: "dara", __path: "ignored/x", age: 30, ratio: 0.5, tags: ["a", 1], when: "2026-10-23T00:00:00Z", none: null },
				{ name: "generated" },
				[1, 2],
				{ nested: [[1]] },
			])}`,
		);
		const target = newCollection("plain-array");
		const { result } = await importFile(filePath, "json", { type: "collection", collectionPath: target });
		expect(result.writeCount).toBe(2);
		expect(result.failures.map((failure) => failure.message)).toEqual([
			"Item 2 is not a JSON object.",
			"An array cannot hold another array directly; Firestore does not store nested arrays.",
		]);
		expect(encodeBigIntDocument(await db.doc(`${target}/dara`).get()).fields).toEqual({
			age: { type: "integer", value: "30" },
			ratio: { type: "double", value: 0.5 },
			tags: { type: "array", value: [{ type: "string", value: "a" }, { type: "integer", value: "1" }] },
			when: { type: "string", value: "2026-10-23T00:00:00Z" },
			none: { type: "null" },
		});
		const generated = (await db.collection(target).where("name", "==", "generated").get()).docs;
		expect(generated).toHaveLength(1);
	});

	test("imports an object keyed by document id", async () => {
		const filePath = join(folderPath, "plain-object.json");
		await Bun.write(filePath, JSON.stringify({ alpha: { n: 1 }, beta: { n: 2 }, "bad/id": { n: 3 } }));
		const target = newCollection("plain-object");
		const { result } = await importFile(filePath, "json", { type: "collection", collectionPath: target });
		expect(result.writeCount).toBe(2);
		expect(result.failures).toEqual([{ documentPath: `${target}/bad/id`, rowNumber: null, message: '"bad/id" cannot be a document id.' }]);
		expect((await db.doc(`${target}/beta`).get()).get("n")).toBe(2n);
	});
});

describe("import progress", () => {
	test("reports bytes read against the file size", async () => {
		const filePath = await exportTo("progress.json", "cinder-json", { type: "collection", collectionPath: SOURCE, isRecursive: false });
		const target = newCollection("progress");
		const { context } = await importFile(filePath, "cinder-json", { type: "collection", collectionPath: target });
		expect(context.progress.totalBytes).toBe(Bun.file(filePath).size);
		expect(context.progress.bytes).toBe(Bun.file(filePath).size);
		expect(context.progress.writes).toBe(USER_COUNT);
	});
});
