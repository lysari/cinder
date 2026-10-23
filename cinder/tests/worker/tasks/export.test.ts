import { FieldValue, GeoPoint, Timestamp } from "@google-cloud/firestore";
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { parse } from "csv-parse/sync";
import { mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { removeExportLeftovers } from "../../../src/bun/services/export-file";
import { TaskQueue } from "../../../src/bun/services/task-queue";
import type { ExportFormat } from "../../../src/shared/constants/data-transfer";
import { EMPTY_TASK_PROGRESS } from "../../../src/shared/constants/task";
import type { EmulatorAccount, EmulatorDatabaseSettings } from "../../../src/shared/interfaces/account.interface";
import type { ExportSource } from "../../../src/shared/interfaces/export.interface";
import type { TaskContext, TaskUpdate } from "../../../src/shared/interfaces/task.interface";
import { createFirestore } from "../../../src/worker/firestore-client";
import { exportDocuments } from "../../../src/worker/tasks/export";

const SETTINGS: EmulatorDatabaseSettings = { type: "emulator", projectId: "demo-cinder", databaseId: "(default)", host: "127.0.0.1", port: 8080 };
const ACCOUNT: EmulatorAccount = { id: "emulator", type: "emulator", host: "127.0.0.1", port: 8080, projectIds: ["demo-cinder"] };
const DATABASE = { accountId: ACCOUNT.id, projectId: SETTINGS.projectId, databaseId: SETTINGS.databaseId };
const WORKER_PATH = join(import.meta.dir, "../../../src/worker/index.ts");
const RUN_ID = crypto.randomUUID();
const COLLECTION = `export-test-${RUN_ID}`;
const GROUP_ID = `export-group-${RUN_ID}`;
const LARGE_COLLECTION = `export-test-large-${RUN_ID}`;
const LARGE_COUNT = 3000;
const CLEANUP_TIMEOUT_MS = 60_000;
const db = createFirestore(SETTINGS, { useBigInt: true });
let folderPath = "";

function createContext(): TaskContext {
	return { taskId: crypto.randomUUID(), isEmulator: true, progress: { ...EMPTY_TASK_PROGRESS }, log: () => undefined };
}

async function exportSource(source: ExportSource, format: ExportFormat, fileName: string) {
	const context = createContext();
	const result = await exportDocuments(
		db,
		{ type: "export", database: DATABASE, source, format, folderPath, fileName, isOverwriting: false },
		context,
	);
	return { result, context, text: await Bun.file(result.filePath).text() };
}

beforeAll(async () => {
	folderPath = await mkdtemp(join(tmpdir(), "cinder-export-test-"));
	await db.doc(`${COLLECTION}/alpha`).set({
		name: "Alpha, \"the first\"",
		count: 3n,
		ratio: 0.5,
		active: true,
		missing: null,
		empty: "",
		createdAt: new Timestamp(1792634400, 120_000_000),
		place: new GeoPoint(11.55, 104.92),
		owner: db.doc("users/dara"),
		tags: ["a", "b"],
		address: { city: "Phnom Penh", geo: { zip: 12000n } },
		notes: "line one\nline two",
		embedding: FieldValue.vector([1, 2]),
	});
	await db.doc(`${COLLECTION}/beta`).set({ name: "Beta", count: 1n, extra: { flag: false } });
	await db.doc(`${COLLECTION}/beta/${GROUP_ID}/one`).set({ kind: "sub" });
	await db.doc(`other-${RUN_ID}/x/${GROUP_ID}/two`).set({ kind: "other" });
	const writer = db.bulkWriter({ throttling: false });
	for (let index = 0; index < LARGE_COUNT; index += 1) {
		void writer.set(db.doc(`${LARGE_COLLECTION}/doc-${String(index).padStart(5, "0")}`), { index: BigInt(index), padding: "x".repeat(200) });
	}
	await writer.close();
}, CLEANUP_TIMEOUT_MS);

afterAll(async () => {
	await db.recursiveDelete(db.collection(COLLECTION));
	await db.recursiveDelete(db.collection(`other-${RUN_ID}`));
	await db.recursiveDelete(db.collection(LARGE_COLLECTION));
	await db.terminate();
	await rm(folderPath, { recursive: true, force: true });
}, CLEANUP_TIMEOUT_MS);

describe("export formats", () => {
	test("CSV flattens maps to dotted columns, writes arrays as JSON and timestamps as UTC ISO", async () => {
		const { text } = await exportSource({ type: "collection", collectionPath: COLLECTION, isRecursive: false }, "csv", "users.csv");
		const rows: string[][] = parse(text, { relax_column_count: false });
		const [header, alpha, beta] = rows as [string[], string[], string[]];
		expect(header).toEqual([
			"__path",
			"__id",
			"active",
			"address.city",
			"address.geo.zip",
			"count",
			"createdAt",
			"embedding",
			"empty",
			"extra.flag",
			"missing",
			"name",
			"notes",
			"owner",
			"place",
			"ratio",
			"tags",
		]);
		const cell = (row: string[], column: string) => row[header.indexOf(column)];
		expect(cell(alpha, "__path")).toBe(`${COLLECTION}/alpha`);
		expect(cell(alpha, "__id")).toBe("alpha");
		expect(cell(alpha, "address.geo.zip")).toBe("12000");
		expect(cell(alpha, "createdAt")).toBe("2026-10-22T02:00:00.120Z");
		expect(cell(alpha, "tags")).toBe('["a","b"]');
		expect(cell(alpha, "place")).toBe('{"latitude":11.55,"longitude":104.92}');
		expect(cell(alpha, "embedding")).toBe("[1,2]");
		expect(cell(alpha, "owner")).toBe("users/dara");
		expect(cell(alpha, "name")).toBe('Alpha, "the first"');
		expect(cell(alpha, "notes")).toBe("line one\nline two");
		expect(cell(beta, "extra.flag")).toBe("false");
		expect(cell(beta, "createdAt")).toBe("");
		const alphaLine = text.split("\r\n")[1] as string;
		expect(alphaLine).toContain(',"",,,"Alpha, ""the first""",');
		expect(text.split("\r\n")[0]).toStartWith("__path,__id,active");
		expect((await readdir(folderPath)).filter((name) => name.startsWith("."))).toEqual([]);
	});

	test("readable JSON writes an array of plain objects with __path and __id", async () => {
		const { text, result } = await exportSource({ type: "collection", collectionPath: COLLECTION, isRecursive: false }, "readable-json", "users.json");
		const documents = JSON.parse(text) as Record<string, unknown>[];
		expect(result.documentCount).toBe(2);
		expect(documents[0]).toMatchObject({
			__path: `${COLLECTION}/alpha`,
			__id: "alpha",
			count: 3,
			ratio: 0.5,
			createdAt: "2026-10-22T02:00:00.120Z",
			owner: "users/dara",
			place: { latitude: 11.55, longitude: 104.92 },
			address: { city: "Phnom Penh", geo: { zip: 12000 } },
		});
		expect(Object.keys(documents[0] as object).slice(0, 2)).toEqual(["__path", "__id"]);
	});

	test("Cinder JSON starts with a readable header and counts its documents", async () => {
		const { text } = await exportSource({ type: "collection", collectionPath: COLLECTION, isRecursive: true }, "cinder-json", "tree.json");
		const file = JSON.parse(text);
		expect(file).toMatchObject({ format: "cinder-json", version: 1, projectId: "demo-cinder", rootPath: COLLECTION, documentCount: 3 });
		expect(file.documents.map((document: { path: string }) => document.path)).toEqual([
			`${COLLECTION}/alpha`,
			`${COLLECTION}/beta`,
			`${COLLECTION}/beta/${GROUP_ID}/one`,
		]);
		expect(text.split("\n")[1]).toBe('\t"format": "cinder-json",');
	});
});

describe("export sources", () => {
	test("exports only the documents a query matches", async () => {
		const source: ExportSource = {
			type: "query",
			query: {
				target: { type: "collection", collectionPath: LARGE_COLLECTION },
				filters: [{ fieldPath: "index", operator: ">=", value: { type: "integer", value: "2990" } }],
				orders: [{ fieldPath: "index", direction: "desc" }],
				limit: 5,
			},
		};
		const { text, context } = await exportSource(source, "ndjson", "query.ndjson");
		const paths = text.trimEnd().split("\n").slice(1).map((line) => JSON.parse(line).path);
		expect(paths).toEqual([2999, 2998, 2997, 2996, 2995].map((index) => `${LARGE_COLLECTION}/doc-0${index}`));
		await Bun.sleep(100);
		expect(context.progress.totalDocuments).toBe(5);
	});

	test("exports a collection group across parents", async () => {
		const { text } = await exportSource({ type: "collection-group", collectionId: GROUP_ID }, "ndjson", "group.ndjson");
		const kinds = text.trimEnd().split("\n").slice(1).map((line) => JSON.parse(line).fields.kind.value);
		expect(kinds.sort()).toEqual(["other", "sub"]);
		expect(JSON.parse(text.split("\n")[0] as string).rootPath).toBeNull();
	});

	test("pages through a large collection and reports reads and bytes", async () => {
		const { result, context } = await exportSource({ type: "collection", collectionPath: LARGE_COLLECTION, isRecursive: false }, "ndjson", "large.ndjson");
		expect(result.documentCount).toBe(LARGE_COUNT);
		expect(context.progress.reads).toBe(LARGE_COUNT);
		expect(context.progress.totalDocuments).toBe(LARGE_COUNT);
		expect(result.byteCount).toBe(Bun.file(result.filePath).size);
	});
});

describe("export cancel", () => {
	test("canceling a running export removes the partial file", async () => {
		const updates: TaskUpdate[] = [];
		const queue = new TaskQueue({
			workerPath: WORKER_PATH,
			concurrency: 1,
			findAccount: () => ACCOUNT,
			onUpdate: (update) => updates.push(update),
			cleanUp: removeExportLeftovers,
		});
		const taskId = queue.start({
			type: "export",
			database: DATABASE,
			source: { type: "collection", collectionPath: LARGE_COLLECTION, isRecursive: true },
			format: "csv",
			folderPath,
			fileName: "canceled.csv",
			isOverwriting: false,
		});
		while (!updates.some((update) => update.taskId === taskId && update.progress.reads > 0)) {
			await Bun.sleep(10);
		}
		expect((await readdir(folderPath)).some((name) => name.startsWith(".canceled.csv."))).toBe(true);
		queue.cancel(taskId);
		while (!updates.some((update) => update.taskId === taskId && update.status === "canceled")) {
			await Bun.sleep(10);
		}
		expect((await readdir(folderPath)).filter((name) => name.includes("canceled.csv"))).toEqual([]);
	});
});
