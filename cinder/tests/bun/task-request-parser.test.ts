import { describe, expect, test } from "bun:test";
import { FileAccess } from "../../src/bun/services/file-access";
import { parseTaskRequest } from "../../src/bun/task-request-parser";
import type { CsvColumnMapping } from "../../src/shared/interfaces/csv.interface";
import type { TaskRequest } from "../../src/shared/interfaces/task.interface";

const DATABASE = { accountId: "emulator", projectId: "demo-cinder", databaseId: "(default)" };
const FOLDER = "/tmp/cinder-exports";
const FILE = "/tmp/cinder-imports/users.csv";

function createFileAccess(): FileAccess {
	const fileAccess = new FileAccess();
	fileAccess.allowFolder(FOLDER);
	fileAccess.allowFile(FILE);
	return fileAccess;
}

function exportRequest(changes: Record<string, unknown> = {}): Record<string, unknown> {
	return {
		type: "export",
		database: DATABASE,
		source: { type: "collection", collectionPath: "users", isRecursive: true },
		format: "cinder-json",
		folderPath: FOLDER,
		fileName: "users.json",
		isOverwriting: false,
		...changes,
	};
}

function loadCsvRequest(columns: CsvColumnMapping[], changes: Record<string, unknown> = {}): Record<string, unknown> {
	return {
		type: "load-csv",
		database: DATABASE,
		filePath: FILE,
		delimiter: ",",
		collectionPath: "people",
		idColumnIndex: 0,
		columns,
		timeZone: "Asia/Phnom_Penh",
		writeMode: "merge",
		...changes,
	};
}

describe("parseTaskRequest", () => {
	test("accepts a run-script request", () => {
		const request: TaskRequest = { type: "run-script", database: DATABASE, script: "async function run() {}" };
		expect(parseTaskRequest(request, createFileAccess())).toEqual(request);
	});

	test("drops fields the request type does not have", () => {
		const request = { type: "run-script", database: { ...DATABASE, extra: 1 }, script: "", extra: true };
		expect(parseTaskRequest(request, createFileAccess())).toEqual({ type: "run-script", database: DATABASE, script: "" });
	});

	test("rejects an unknown task type", () => {
		expect(() => parseTaskRequest({ type: "format-disk" }, createFileAccess())).toThrow("Unknown task type.");
		expect(() => parseTaskRequest(null, createFileAccess())).toThrow("Unknown task type.");
	});

	test("rejects a run-script request without a script", () => {
		expect(() => parseTaskRequest({ type: "run-script", database: DATABASE }, createFileAccess())).toThrow("A run-script task needs a script.");
	});

	test("rejects a request without a full database target", () => {
		expect(() => parseTaskRequest({ type: "run-script", database: { ...DATABASE, databaseId: "" }, script: "" }, createFileAccess())).toThrow(
			"The request needs an account id, project id and database id.",
		);
	});

	test("accepts an export into a folder the user picked", () => {
		expect(parseTaskRequest(exportRequest(), createFileAccess())).toEqual(exportRequest() as unknown as TaskRequest);
	});

	test("rejects export file names that leave the folder or do not fit the format", () => {
		const fileAccess = createFileAccess();
		expect(() => parseTaskRequest(exportRequest({ fileName: "../users.json" }), fileAccess)).toThrow("A file name cannot contain /");
		expect(() => parseTaskRequest(exportRequest({ fileName: "..json" }), fileAccess)).toThrow('cannot start with a dot or contain ".."');
		expect(() => parseTaskRequest(exportRequest({ fileName: "a..b.json" }), fileAccess)).toThrow('cannot start with a dot or contain ".."');
		expect(() => parseTaskRequest(exportRequest({ fileName: "C:\\users.json" }), fileAccess)).toThrow("A file name cannot contain /");
		expect(() => parseTaskRequest(exportRequest({ fileName: ".hidden.json" }), fileAccess)).toThrow("cannot start with a dot");
		expect(() => parseTaskRequest(exportRequest({ fileName: "users.csv" }), fileAccess)).toThrow("End the file name with .json.");
		expect(() => parseTaskRequest(exportRequest({ format: "ndjson", fileName: "users.json" }), fileAccess)).toThrow(
			"End the file name with .ndjson or .jsonl.",
		);
	});

	test("rejects an export into a folder the user did not pick", () => {
		expect(() => parseTaskRequest(exportRequest({ folderPath: "/etc" }), createFileAccess())).toThrow("Choose the folder again");
		expect(() => parseTaskRequest(exportRequest({ folderPath: `${FOLDER}/../../etc` }), createFileAccess())).toThrow("Choose the folder again");
	});

	test("checks an export query with the shared query rules", () => {
		const query = { target: { type: "collection", collectionPath: "users" }, filters: [], orders: [], limit: 0 };
		expect(() => parseTaskRequest(exportRequest({ source: { type: "query", query } }), createFileAccess())).toThrow("The query cannot run:");
	});

	test("accepts a plain JSON import only into a collection, from a picked file", () => {
		const request = { type: "import", database: DATABASE, filePath: FILE, format: "json", writeMode: "skip" };
		expect(() => parseTaskRequest({ ...request, target: { type: "original-paths" } }, createFileAccess())).toThrow(
			"A plain JSON file is imported into a collection.",
		);
		expect(parseTaskRequest({ ...request, target: { type: "collection", collectionPath: "people" } }, createFileAccess())).toMatchObject({
			target: { type: "collection", collectionPath: "people" },
		});
		expect(() =>
			parseTaskRequest({ ...request, filePath: "/etc/passwd", target: { type: "collection", collectionPath: "people" } }, createFileAccess()),
		).toThrow("Choose the file again");
	});

	test("accepts a CSV load with dotted field names and rejects conflicting ones", () => {
		const columns: CsvColumnMapping[] = [
			{ index: 0, isIncluded: false, fieldName: "id", type: "string" },
			{ index: 1, isIncluded: true, fieldName: "address.city", type: "string" },
			{ index: 2, isIncluded: true, fieldName: "address.zip", type: "integer" },
		];
		expect(parseTaskRequest(loadCsvRequest(columns), createFileAccess())).toMatchObject({ idColumnIndex: 0, columns });
		const conflicting = [...columns, { index: 3, isIncluded: true, fieldName: "address", type: "string" as const }];
		expect(() => parseTaskRequest(loadCsvRequest(conflicting), createFileAccess())).toThrow(
			'"address" cannot be both a value and a map of nested fields.',
		);
		expect(() => parseTaskRequest(loadCsvRequest(columns, { timeZone: "Mars/Olympus" }), createFileAccess())).toThrow("Choose a known time zone.");
		expect(() => parseTaskRequest(loadCsvRequest(columns, { idColumnIndex: 5 }), createFileAccess())).toThrow("The id column");
		expect(() =>
			parseTaskRequest(loadCsvRequest([{ index: 0, isIncluded: true, fieldName: "a..b", type: "string" }]), createFileAccess()),
		).toThrow("is not a valid field name");
	});

	test("accepts a bulk update and checks its operations with the shared rules", () => {
		const request = {
			type: "bulk-update",
			database: DATABASE,
			query: { target: { type: "collection-group", collectionId: "orders" }, filters: [], orders: [], limit: null },
			operations: [
				{ type: "set", fieldPath: "address.city", value: { type: "string", value: "Phnom Penh" } },
				{ type: "rename", fieldPath: "old", newFieldPath: "new", isOverwriting: false },
				{ type: "increment", fieldPath: "count", value: { type: "double", value: 0.5 } },
				{ type: "array-union", fieldPath: "tags", values: [{ type: "string", value: "a" }] },
				{ type: "server-timestamp", fieldPath: "updatedAt" },
			],
			isDryRun: true,
		};
		expect(parseTaskRequest(request, createFileAccess())).toEqual(request as TaskRequest);
		const withOperations = (operations: unknown[]) => () => parseTaskRequest({ ...request, operations }, createFileAccess());
		expect(withOperations([])).toThrow("Add at least one operation.");
		expect(withOperations([{ type: "delete", fieldPath: "a..b" }])).toThrow("Operation 1: A field path cannot start or end with a dot");
		expect(withOperations([{ type: "rename", fieldPath: "a", newFieldPath: "a.b", isOverwriting: true }])).toThrow(
			"Operation 1: The new field path cannot be the field itself or lie inside it.",
		);
		expect(withOperations([{ type: "increment", fieldPath: "n", value: { type: "string", value: "1" } }])).toThrow(
			"Operation 1: increment by an integer or a double.",
		);
		expect(withOperations([{ type: "array-remove", fieldPath: "n", values: [{ type: "array", value: [] }] }])).toThrow(
			"Operation 1: A value cannot be an array",
		);
		expect(withOperations([{ type: "server-timestamp", fieldPath: "meta" }, { type: "set", fieldPath: "meta.by", value: { type: "null" } }])).toThrow(
			"Operation 2: Operation 1 sets this field to the server time",
		);
		expect(withOperations([{ type: "drop", fieldPath: "n" }])).toThrow("Operation 1 has an unknown type.");
		expect(() => parseTaskRequest({ ...request, query: { ...request.query, limit: 0 } }, createFileAccess())).toThrow("The query cannot run:");
	});

	test("accepts a copy and checks the destination path type", () => {
		const request = {
			type: "copy",
			database: DATABASE,
			source: { type: "collection", collectionPath: "users" },
			destination: { database: { ...DATABASE, accountId: "other", projectId: "demo-cinder-copy" }, path: "users" },
			isMove: true,
			isRecursive: true,
			writeMode: "merge",
			isRewritingReferences: false,
		};
		expect(parseTaskRequest(request, createFileAccess())).toEqual(request as TaskRequest);
		const withChanges = (changes: Record<string, unknown>) => () => parseTaskRequest({ ...request, ...changes }, createFileAccess());
		expect(withChanges({ destination: { database: DATABASE, path: "users/dara" } })).toThrow("Enter a collection path for the destination");
		expect(withChanges({ source: { type: "document", documentPath: "users/dara" }, destination: { database: DATABASE, path: "people" } })).toThrow(
			"Enter a document path for the destination",
		);
		expect(withChanges({ source: { type: "query" } })).toThrow("The copy source must be a collection or a document.");
		expect(withChanges({ isRewritingReferences: undefined })).toThrow("The copy must say whether it moves");
		expect(withChanges({ writeMode: "replace" })).toThrow("The write mode must be overwrite, merge or skip.");
	});

	test("refuses a copy or move onto or into its own source in the same database", () => {
		const request = {
			type: "copy",
			database: DATABASE,
			source: { type: "collection", collectionPath: "users" },
			destination: { database: DATABASE, path: "users" },
			isMove: false,
			isRecursive: true,
			writeMode: "overwrite",
			isRewritingReferences: false,
		};
		const fileAccess = createFileAccess();
		expect(() => parseTaskRequest(request, fileAccess)).toThrow("The destination is the source itself.");
		const inside = { ...request, destination: { database: DATABASE, path: "users/dara/backup" } };
		expect(() => parseTaskRequest({ ...inside, isMove: true }, fileAccess)).toThrow("Nothing can be moved into itself");
		expect(() => parseTaskRequest(inside, fileAccess)).toThrow("The destination lies inside the source");
		expect(parseTaskRequest({ ...inside, isRecursive: false }, fileAccess)).toMatchObject({ destination: { path: "users/dara/backup" } });
		expect(parseTaskRequest({ ...request, destination: { database: DATABASE, path: "users-backup" } }, fileAccess)).toMatchObject({
			destination: { path: "users-backup" },
		});
	});

	test("accepts a collection or query delete", () => {
		const collection = { type: "delete-collection", database: DATABASE, source: { type: "collection", collectionPath: "users/dara/orders" } };
		expect(parseTaskRequest(collection, createFileAccess())).toEqual(collection as TaskRequest);
		const query = { target: { type: "collection", collectionPath: "users" }, filters: [], orders: [], limit: 10 };
		expect(parseTaskRequest({ ...collection, source: { type: "query", query } }, createFileAccess())).toMatchObject({ source: { query } });
		expect(() => parseTaskRequest({ ...collection, source: { type: "collection", collectionPath: "users/dara" } }, createFileAccess())).toThrow(
			"The collection path must be an odd number of ids joined by /.",
		);
		expect(() => parseTaskRequest({ ...collection, source: { type: "document" } }, createFileAccess())).toThrow(
			"The delete source must be a collection or a query.",
		);
	});
});
