import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { EMPTY_TASK_PROGRESS } from "../../../src/shared/constants/task";
import type { EmulatorDatabaseSettings } from "../../../src/shared/interfaces/account.interface";
import type { CsvColumnMapping, LoadCsvTaskRequest } from "../../../src/shared/interfaces/csv.interface";
import type { TaskContext } from "../../../src/shared/interfaces/task.interface";
import { createFirestore } from "../../../src/worker/firestore-client";
import { analyzeCsv } from "../../../src/worker/tasks/analyze-csv";
import { loadCsv } from "../../../src/worker/tasks/load-csv";
import { encodeBigIntDocument } from "../../../src/worker/utils/firestore-value-encoder";

const SETTINGS: EmulatorDatabaseSettings = { type: "emulator", projectId: "demo-cinder", databaseId: "(default)", host: "127.0.0.1", port: 8080 };
const DATABASE = { accountId: "emulator", projectId: SETTINGS.projectId, databaseId: SETTINGS.databaseId };
const COLLECTION = `load-csv-test-${crypto.randomUUID()}`;
const CSV_TEXT = [
	"﻿id;name;age;score;active;joined;tags;address.city;notes",
	'dara;"Dara ""D""";30;1.5;true;2026-10-23 09:30;["a","b"];Phnom Penh;"line one',
	'line two"',
	"sok;Sok;41;2;FALSE;2026-10-23T02:30:00Z;[];Siem Reap;",
	'bad/id;Bad;1;1;true;2026-10-23;[];X;""',
	"vy;Vy;old;3;true;2026-10-23;[];Y;",
	"",
].join("\r\n");
const db = createFirestore(SETTINGS, { useBigInt: true });
let folderPath = "";
let filePath = "";

function createContext(): TaskContext {
	return { taskId: crypto.randomUUID(), isEmulator: true, progress: { ...EMPTY_TASK_PROGRESS }, log: () => undefined };
}

beforeAll(async () => {
	folderPath = await mkdtemp(join(tmpdir(), "cinder-csv-test-"));
	filePath = join(folderPath, "people.csv");
	await Bun.write(filePath, CSV_TEXT);
});

afterAll(async () => {
	await db.recursiveDelete(db.collection(COLLECTION));
	await db.terminate();
	await rm(folderPath, { recursive: true, force: true });
});

describe("analyzeCsv", () => {
	test("detects the delimiter and quoting, counts rows and infers column types", async () => {
		const context = createContext();
		const analysis = await analyzeCsv({ type: "analyze-csv", database: DATABASE, filePath }, context);
		expect(analysis).toMatchObject({ kind: "csv-analysis", delimiter: ";", hasQuotedFields: true, rowCount: 4 });
		expect(analysis.columns.map(({ name, type }) => `${name}:${type}`)).toEqual([
			"id:string",
			"name:string",
			"age:string",
			"score:double",
			"active:boolean",
			"joined:timestamp",
			"tags:json",
			"address.city:string",
			"notes:string",
		]);
		expect(analysis.columns[1]?.sampleValues).toEqual(['Dara "D"', "Sok", "Bad"]);
		expect(analysis.previewRows[0]?.[8]).toBe("line one\r\nline two");
		expect(analysis.previewRows[1]?.[8]).toBeNull();
		expect(context.progress.bytes).toBe(Bun.file(filePath).size);
	});
});

describe("loadCsv", () => {
	test("writes rows with the id column, dotted names, chosen types and time zone, and lists failing rows", async () => {
		const columns: CsvColumnMapping[] = [
			{ index: 0, isIncluded: false, fieldName: "id", type: "string" },
			{ index: 1, isIncluded: true, fieldName: "name", type: "string" },
			{ index: 2, isIncluded: true, fieldName: "age", type: "integer" },
			{ index: 3, isIncluded: true, fieldName: "score", type: "double" },
			{ index: 4, isIncluded: true, fieldName: "active", type: "boolean" },
			{ index: 5, isIncluded: true, fieldName: "joined", type: "timestamp" },
			{ index: 6, isIncluded: true, fieldName: "tags", type: "json" },
			{ index: 7, isIncluded: true, fieldName: "address.city", type: "string" },
			{ index: 8, isIncluded: true, fieldName: "profile.notes", type: "string" },
		];
		const request: LoadCsvTaskRequest = {
			type: "load-csv",
			database: DATABASE,
			filePath,
			delimiter: ";",
			collectionPath: COLLECTION,
			idColumnIndex: 0,
			columns,
			timeZone: "Asia/Phnom_Penh",
			writeMode: "overwrite",
		};
		const context = createContext();
		const result = await loadCsv(db, request, context);
		expect(result).toMatchObject({ kind: "writes", writeCount: 2, skipCount: 0, deleteCount: 0, failureCount: 2 });
		expect(result.failures).toEqual([
			{ documentPath: `${COLLECTION}/bad/id`, rowNumber: 4, message: '"bad/id" in the id column cannot be a document id.' },
			{ documentPath: `${COLLECTION}/vy`, rowNumber: 5, message: 'age: "old" is not a whole number in the 64-bit range.' },
		]);
		const dara = encodeBigIntDocument(await db.doc(`${COLLECTION}/dara`).get()).fields;
		expect(dara).toEqual({
			name: { type: "string", value: 'Dara "D"' },
			age: { type: "integer", value: "30" },
			score: { type: "double", value: 1.5 },
			active: { type: "boolean", value: true },
			joined: { type: "timestamp", value: { seconds: 1792722600, nanos: 0 } },
			tags: { type: "array", value: [{ type: "string", value: "a" }, { type: "string", value: "b" }] },
			address: { type: "map", value: { city: { type: "string", value: "Phnom Penh" } } },
			profile: { type: "map", value: { notes: { type: "string", value: "line one\r\nline two" } } },
		});
		const sok = encodeBigIntDocument(await db.doc(`${COLLECTION}/sok`).get()).fields;
		expect(sok.score).toEqual({ type: "double", value: 2 });
		expect(sok.joined).toEqual({ type: "timestamp", value: { seconds: 1792722600, nanos: 0 } });
		expect(sok.profile).toEqual({ type: "map", value: { notes: { type: "null" } } });
	});

	test("generates ids when no id column is chosen and skips existing documents in skip mode", async () => {
		const collectionPath = `${COLLECTION}/generated/rows`;
		const request: LoadCsvTaskRequest = {
			type: "load-csv",
			database: DATABASE,
			filePath,
			delimiter: ";",
			collectionPath,
			idColumnIndex: null,
			columns: [{ index: 1, isIncluded: true, fieldName: "name", type: "string" }],
			timeZone: "UTC",
			writeMode: "skip",
		};
		const result = await loadCsv(db, request, createContext());
		expect(result).toMatchObject({ writeCount: 4, failureCount: 0 });
		expect((await db.collection(collectionPath).get()).size).toBe(4);
	});
});
