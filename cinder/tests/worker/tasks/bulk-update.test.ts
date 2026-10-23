import { Timestamp } from "@google-cloud/firestore";
import { afterAll, describe, expect, test } from "bun:test";
import { EMPTY_TASK_PROGRESS } from "../../../src/shared/constants/task";
import type { EmulatorDatabaseSettings } from "../../../src/shared/interfaces/account.interface";
import type { BulkUpdateOperation, BulkUpdatePreviewResult } from "../../../src/shared/interfaces/bulk-update.interface";
import type { FirestoreValue } from "../../../src/shared/interfaces/firestore-value.interface";
import type { StructuredQuery } from "../../../src/shared/interfaces/query.interface";
import type { TaskContext, WriteTaskResult } from "../../../src/shared/interfaces/task.interface";
import { createFirestore } from "../../../src/worker/firestore-client";
import { bulkUpdate } from "../../../src/worker/tasks/bulk-update";
import { decodeFields } from "../../../src/worker/utils/firestore-value-decoder";
import { encodeBigIntDocument } from "../../../src/worker/utils/firestore-value-encoder";

const SETTINGS: EmulatorDatabaseSettings = { type: "emulator", projectId: "demo-cinder", databaseId: "(default)", host: "127.0.0.1", port: 8080 };
const DATABASE = { accountId: "emulator", projectId: SETTINGS.projectId, databaseId: SETTINGS.databaseId };
const RUN_ID = crypto.randomUUID();
const db = createFirestore(SETTINGS, { useBigInt: true });
const usedCollections: string[] = [];

function createContext(): TaskContext {
	return { taskId: crypto.randomUUID(), isEmulator: true, progress: { ...EMPTY_TASK_PROGRESS }, log: () => {} };
}

async function seed(name: string, documents: Record<string, Record<string, FirestoreValue>>): Promise<string> {
	const collectionPath = `bulk-update-test-${name}-${RUN_ID}`;
	usedCollections.push(collectionPath);
	await Promise.all(Object.entries(documents).map(([id, fields]) => db.doc(`${collectionPath}/${id}`).set(decodeFields(fields, db))));
	return collectionPath;
}

function collectionQuery(collectionPath: string, changes: Partial<StructuredQuery> = {}): StructuredQuery {
	return { target: { type: "collection", collectionPath }, filters: [], orders: [], limit: null, ...changes };
}

async function run(query: StructuredQuery, operations: BulkUpdateOperation[]): Promise<{ result: WriteTaskResult; context: TaskContext }> {
	const context = createContext();
	const result = await bulkUpdate(db, { type: "bulk-update", database: DATABASE, query, operations, isDryRun: false }, context);
	return { result: result as WriteTaskResult, context };
}

async function preview(query: StructuredQuery, operations: BulkUpdateOperation[]): Promise<BulkUpdatePreviewResult> {
	return (await bulkUpdate(db, { type: "bulk-update", database: DATABASE, query, operations, isDryRun: true }, createContext())) as BulkUpdatePreviewResult;
}

async function fieldsOf(documentPath: string): Promise<Record<string, FirestoreValue>> {
	return encodeBigIntDocument(await db.doc(documentPath).get()).fields;
}

function integer(value: string): FirestoreValue {
	return { type: "integer", value };
}

function double(value: number): FirestoreValue {
	return { type: "double", value };
}

function text(value: string): FirestoreValue {
	return { type: "string", value };
}

afterAll(async () => {
	for (const collectionPath of usedCollections) {
		await db.recursiveDelete(db.collection(collectionPath));
	}
	await db.terminate();
});

describe("bulk update operations", () => {
	test("sets, deletes and renames fields at dotted paths", async () => {
		const collectionPath = await seed("set", {
			a: { name: text("Dara"), address: { type: "map", value: { city: text("Phnom Penh"), zip: text("120101") } }, old: integer("1") },
			b: { name: text("Sok"), address: text("unknown") },
		});
		const { result } = await run(collectionQuery(collectionPath), [
			{ type: "set", fieldPath: "address.country", value: text("KH") },
			{ type: "delete", fieldPath: "address.zip" },
			{ type: "rename", fieldPath: "old", newFieldPath: "legacy.value", isOverwriting: false },
		]);
		expect(result).toMatchObject({ writeCount: 2, skipCount: 0, failureCount: 0 });
		expect(await fieldsOf(`${collectionPath}/a`)).toEqual({
			name: text("Dara"),
			address: { type: "map", value: { city: text("Phnom Penh"), country: text("KH") } },
			legacy: { type: "map", value: { value: integer("1") } },
		});
		expect(await fieldsOf(`${collectionPath}/b`)).toEqual({ name: text("Sok"), address: { type: "map", value: { country: text("KH") } } });
	});

	test("refuses a rename onto an existing field unless overwriting is allowed, and skips documents without the field", async () => {
		const collectionPath = await seed("rename", {
			conflict: { from: text("new"), to: text("old") },
			free: { from: text("moved") },
			missing: { other: text("x") },
		});
		const refused = await run(collectionQuery(collectionPath), [{ type: "rename", fieldPath: "from", newFieldPath: "to", isOverwriting: false }]);
		expect(refused.result).toMatchObject({ writeCount: 1, skipCount: 1, failureCount: 1 });
		expect(refused.result.failures).toEqual([
			{
				documentPath: `${collectionPath}/conflict`,
				rowNumber: null,
				message: "The field to already exists, so from was not renamed. Allow overwriting to replace it.",
			},
		]);
		expect(await fieldsOf(`${collectionPath}/conflict`)).toEqual({ from: text("new"), to: text("old") });
		expect(await fieldsOf(`${collectionPath}/free`)).toEqual({ to: text("moved") });
		expect(await fieldsOf(`${collectionPath}/missing`)).toEqual({ other: text("x") });

		const overwritten = await run(collectionQuery(collectionPath), [{ type: "rename", fieldPath: "from", newFieldPath: "to", isOverwriting: true }]);
		expect(overwritten.result).toMatchObject({ writeCount: 1, skipCount: 2, failureCount: 0 });
		expect(await fieldsOf(`${collectionPath}/conflict`)).toEqual({ to: text("new") });
	});

	test("increments integers as integers and anything with a double as a double", async () => {
		const collectionPath = await seed("increment", {
			int: { n: integer("9007199254740993") },
			intByDouble: { n: integer("2") },
			wholeDouble: { n: double(2) },
			missing: {},
			notNumber: { n: text("x") },
			overflow: { n: integer("9223372036854775807") },
		});
		const intDelta = await run(collectionQuery(collectionPath, { filters: [] }), [{ type: "increment", fieldPath: "n", value: { type: "integer", value: "1" } }]);
		expect(intDelta.result.failures.map((failure) => failure.documentPath)).toEqual([`${collectionPath}/overflow`]);
		expect((await fieldsOf(`${collectionPath}/int`)).n).toEqual(integer("9007199254740994"));
		expect((await fieldsOf(`${collectionPath}/wholeDouble`)).n).toEqual(double(3));
		expect((await fieldsOf(`${collectionPath}/missing`)).n).toEqual(integer("1"));
		expect((await fieldsOf(`${collectionPath}/notNumber`)).n).toEqual(integer("1"));
		expect((await fieldsOf(`${collectionPath}/overflow`)).n).toEqual(integer("9223372036854775807"));

		await run(collectionQuery(collectionPath), [
			{ type: "delete", fieldPath: "unused" },
			{ type: "increment", fieldPath: "n", value: { type: "double", value: 0.5 } },
		]);
		expect((await fieldsOf(`${collectionPath}/intByDouble`)).n).toEqual(double(3.5));
		expect((await fieldsOf(`${collectionPath}/wholeDouble`)).n).toEqual(double(3.5));
	});

	test("adds missing array items once and removes every equal item", async () => {
		const collectionPath = await seed("arrays", {
			list: { tags: { type: "array", value: [text("a"), integer("1"), text("a"), double(1)] } },
			none: {},
		});
		await run(collectionQuery(collectionPath), [
			{ type: "array-union", fieldPath: "tags", values: [text("a"), text("b"), text("b"), { type: "map", value: { k: integer("1") } }] },
			{ type: "array-remove", fieldPath: "tags", values: [integer("1")] },
		]);
		expect((await fieldsOf(`${collectionPath}/list`)).tags).toEqual({
			type: "array",
			value: [text("a"), text("a"), double(1), text("b"), { type: "map", value: { k: integer("1") } }],
		});
		expect((await fieldsOf(`${collectionPath}/none`)).tags).toEqual({
			type: "array",
			value: [text("a"), text("b"), { type: "map", value: { k: integer("1") } }],
		});
	});

	test("sets the server time, also inside a map written by an earlier operation", async () => {
		const collectionPath = await seed("timestamp", { a: { meta: text("old") } });
		const before = Timestamp.now();
		await run(collectionQuery(collectionPath), [
			{ type: "set", fieldPath: "meta", value: { type: "map", value: { by: text("cinder") } } },
			{ type: "server-timestamp", fieldPath: "meta.at" },
			{ type: "server-timestamp", fieldPath: "touchedAt" },
		]);
		const snapshot = await db.doc(`${collectionPath}/a`).get();
		expect(snapshot.get("meta.by")).toBe("cinder");
		expect(snapshot.get("meta.at")).toBeInstanceOf(Timestamp);
		expect((snapshot.get("touchedAt") as Timestamp).toMillis()).toBeGreaterThanOrEqual(before.toMillis() - 1000);
	});
});

describe("bulk update scope", () => {
	test("a dry run returns before and after values and writes nothing", async () => {
		const collectionPath = await seed("preview", {
			a: { n: integer("1"), tag: text("x") },
			b: { n: double(2.5), to: text("taken"), tag: text("y") },
		});
		const operations: BulkUpdateOperation[] = [
			{ type: "increment", fieldPath: "n", value: { type: "integer", value: "2" } },
			{ type: "rename", fieldPath: "tag", newFieldPath: "to", isOverwriting: false },
			{ type: "server-timestamp", fieldPath: "at" },
		];
		const result = await preview(collectionQuery(collectionPath), operations);
		expect(result.documents).toEqual([
			{
				path: `${collectionPath}/a`,
				problem: null,
				changes: [
					{ fieldPath: "n", before: integer("1"), after: integer("3"), isServerTimestamp: false },
					{ fieldPath: "tag", before: text("x"), after: null, isServerTimestamp: false },
					{ fieldPath: "to", before: null, after: text("x"), isServerTimestamp: false },
					{ fieldPath: "at", before: null, after: null, isServerTimestamp: true },
				],
			},
			{
				path: `${collectionPath}/b`,
				problem: "The field to already exists, so tag was not renamed. Allow overwriting to replace it.",
				changes: [],
			},
		]);
		expect(await fieldsOf(`${collectionPath}/a`)).toEqual({ n: integer("1"), tag: text("x") });
	});

	test("a dry run reads at most 20 documents", async () => {
		const documents = Object.fromEntries(Array.from({ length: 25 }, (_, index) => [`d${String(index).padStart(2, "0")}`, { n: integer(String(index)) }]));
		const collectionPath = await seed("preview-limit", documents);
		const result = await preview(collectionQuery(collectionPath), [{ type: "set", fieldPath: "n", value: integer("0") }]);
		expect(result.documents).toHaveLength(20);
		expect(result.documents[1]?.changes).toEqual([{ fieldPath: "n", before: integer("1"), after: integer("0"), isServerTimestamp: false }]);
	});

	test("a query-scoped update touches only the matching documents", async () => {
		const collectionPath = await seed("query", {
			a: { team: text("red"), n: integer("1") },
			b: { team: text("blue"), n: integer("1") },
			c: { team: text("red"), n: integer("1") },
		});
		const query = collectionQuery(collectionPath, { filters: [{ fieldPath: "team", operator: "==", value: { type: "string", value: "red" } }] });
		const { result, context } = await run(query, [{ type: "increment", fieldPath: "n", value: { type: "integer", value: "10" } }]);
		expect(result).toMatchObject({ writeCount: 2, failureCount: 0 });
		expect(context.progress.totalDocuments).toBe(2);
		expect((await fieldsOf(`${collectionPath}/a`)).n).toEqual(integer("11"));
		expect((await fieldsOf(`${collectionPath}/b`)).n).toEqual(integer("1"));
		expect((await fieldsOf(`${collectionPath}/c`)).n).toEqual(integer("11"));
	});

	test("updates a document once even when the update moves it further along the query order", async () => {
		const documents = Object.fromEntries(Array.from({ length: 1200 }, (_, index) => [`d${index}`, { n: integer(String(index)) }]));
		const collectionPath = await seed("reorder", documents);
		const query = collectionQuery(collectionPath, { orders: [{ fieldPath: "n", direction: "asc" }] });
		const { result } = await run(query, [{ type: "increment", fieldPath: "n", value: { type: "integer", value: "600" } }]);
		expect(result).toMatchObject({ writeCount: 1200, failureCount: 0 });
		const values = (await db.collection(collectionPath).get()).docs.map((snapshot) => Number(snapshot.get("n")) - Number(snapshot.id.slice(1)));
		expect(new Set(values)).toEqual(new Set([600]));
	});

	test("a collection group update reaches every collection with that id", async () => {
		const parent = await seed("group", { p1: {}, p2: {} });
		const groupId = `bulk-group-${RUN_ID}`;
		await db.doc(`${parent}/p1/${groupId}/x`).set({ n: 1n });
		await db.doc(`${parent}/p2/${groupId}/y`).set({ n: 2n });
		const query: StructuredQuery = { target: { type: "collection-group", collectionId: groupId }, filters: [], orders: [], limit: null };
		const { result } = await run(query, [{ type: "set", fieldPath: "seen", value: { type: "boolean", value: true } }]);
		expect(result.writeCount).toBe(2);
		expect((await db.doc(`${parent}/p2/${groupId}/y`).get()).get("seen")).toBe(true);
	});
});
