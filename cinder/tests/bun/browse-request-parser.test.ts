import { describe, expect, test } from "bun:test";
import {
	parseCreateDocumentParams,
	parseDeleteDocumentParams,
	parseDocumentParams,
	parseListCollectionsParams,
	parseListDocumentsParams,
	parseSetDocumentParams,
	parseUpdateDocumentParams,
} from "../../src/bun/browse-request-parser";
import type { FirestoreValue } from "../../src/shared/interfaces/firestore-value.interface";

const DATABASE = { accountId: "emulator", projectId: "demo-cinder", databaseId: "(default)" };

function setWith(value: unknown) {
	return () => parseSetDocumentParams({ database: DATABASE, documentPath: "users/dara", fields: { field: value } });
}

describe("parseListCollectionsParams", () => {
	test("accepts the root or a document path", () => {
		expect(parseListCollectionsParams({ database: DATABASE, documentPath: null })).toEqual({ database: DATABASE, documentPath: null });
		expect(parseListCollectionsParams({ database: DATABASE, documentPath: "users/dara" }).documentPath).toBe("users/dara");
	});

	test("rejects a collection path or a missing database", () => {
		expect(() => parseListCollectionsParams({ database: DATABASE, documentPath: "users" })).toThrow(
			"The document path must be an even number of ids joined by /.",
		);
		expect(() => parseListCollectionsParams({ documentPath: null })).toThrow(
			"The request needs an account id, project id and database id.",
		);
		expect(() => parseListCollectionsParams(undefined)).toThrow("The request has no parameters.");
	});
});

describe("parseListDocumentsParams", () => {
	test("accepts a page request and drops unknown fields", () => {
		const params = { database: DATABASE, collectionPath: "users/dara/orders", pageSize: 50, startAfterId: "o1", extra: 1 };
		expect(parseListDocumentsParams(params)).toEqual({
			database: DATABASE,
			collectionPath: "users/dara/orders",
			pageSize: 50,
			startAfterId: "o1",
		});
	});

	test("rejects bad page sizes, cursors and paths", () => {
		const params = { database: DATABASE, collectionPath: "users", pageSize: 50, startAfterId: null };
		expect(() => parseListDocumentsParams({ ...params, pageSize: 0 })).toThrow("The page size must be a whole number from 1 to 500.");
		expect(() => parseListDocumentsParams({ ...params, pageSize: 501 })).toThrow("The page size");
		expect(() => parseListDocumentsParams({ ...params, startAfterId: "a/b" })).toThrow("The page cursor must be a document id.");
		expect(() => parseListDocumentsParams({ ...params, collectionPath: "users/dara" })).toThrow(
			"The collection path must be an odd number of ids joined by /.",
		);
		expect(() => parseListDocumentsParams({ ...params, collectionPath: "users//orders" })).toThrow("The collection path");
	});
});

describe("parseDocumentParams and parseDeleteDocumentParams", () => {
	test("accept a document path", () => {
		expect(parseDocumentParams({ database: DATABASE, documentPath: "users/dara" })).toEqual({
			database: DATABASE,
			documentPath: "users/dara",
		});
		expect(parseDeleteDocumentParams({ database: DATABASE, documentPath: "users/dara", isRecursive: true }).isRecursive).toBe(true);
	});

	test("reject a reserved id and a delete without an explicit recursion choice", () => {
		expect(() => parseDocumentParams({ database: DATABASE, documentPath: "users/__dara__" })).toThrow("The document path");
		expect(() => parseDeleteDocumentParams({ database: DATABASE, documentPath: "users/dara" })).toThrow(
			"The delete request must say whether to delete subcollections.",
		);
	});
});

describe("parseCreateDocumentParams", () => {
	test("accepts a generated or given id", () => {
		const params = { database: DATABASE, collectionPath: "users", documentId: null, fields: {} };
		expect(parseCreateDocumentParams(params)).toEqual(params);
		expect(parseCreateDocumentParams({ ...params, documentId: "dara" }).documentId).toBe("dara");
	});

	test("rejects an id with a slash", () => {
		expect(() =>
			parseCreateDocumentParams({ database: DATABASE, collectionPath: "users", documentId: "a/b", fields: {} }),
		).toThrow("A document id is 1 to 1500 bytes long");
	});
});

describe("parseUpdateDocumentParams", () => {
	const params = {
		database: DATABASE,
		documentPath: "users/dara",
		changedFields: { "a.b": { type: "string", value: "x" } },
		deletedFieldNames: ["old"],
	};

	test("accepts changed and deleted fields", () => {
		expect(parseUpdateDocumentParams(params)).toEqual(params as ReturnType<typeof parseUpdateDocumentParams>);
	});

	test("rejects an update without changes or with a field both changed and deleted", () => {
		expect(() => parseUpdateDocumentParams({ ...params, changedFields: {}, deletedFieldNames: [] })).toThrow(
			"The update changes no field.",
		);
		expect(() => parseUpdateDocumentParams({ ...params, deletedFieldNames: ["a.b"] })).toThrow(
			"A field cannot be changed and deleted in the same update.",
		);
		expect(() => parseUpdateDocumentParams({ ...params, deletedFieldNames: [""] })).toThrow(
			"The deleted field names must be a list of field names.",
		);
	});
});

describe("tagged value parsing", () => {
	test("accepts every value type", () => {
		const fields: Record<string, FirestoreValue> = {
			null: { type: "null" },
			boolean: { type: "boolean", value: true },
			integer: { type: "integer", value: "-9223372036854775808" },
			double: { type: "double", value: 0.25 },
			nan: { type: "double", value: "NaN" },
			string: { type: "string", value: "" },
			bytes: { type: "bytes", value: "AQL/" },
			timestamp: { type: "timestamp", value: { seconds: 0, nanos: 999999999 } },
			geopoint: { type: "geopoint", value: { latitude: -90, longitude: 180 } },
			reference: { type: "reference", value: "users/dara" },
			vector: { type: "vector", value: [1, 2.5] },
			array: { type: "array", value: [{ type: "map", value: { list: { type: "array", value: [] } } }] },
			map: { type: "map", value: { "a/b.c": { type: "null" } } },
		};
		expect(parseSetDocumentParams({ database: DATABASE, documentPath: "users/dara", fields }).fields).toEqual(fields);
	});

	test("drops fields a tagged value does not have", () => {
		expect(setWith({ type: "integer", value: "1", extra: true })().fields.field).toEqual({ type: "integer", value: "1" });
	});

	test("rejects values that do not match their type", () => {
		expect(setWith({ type: "integer", value: "1.5" })).toThrow("An integer must be a whole number in the 64-bit range.");
		expect(setWith({ type: "integer", value: "9223372036854775808" })).toThrow("An integer");
		expect(setWith({ type: "integer", value: 1 })).toThrow("An integer");
		expect(setWith({ type: "double", value: "1" })).toThrow("A double must be a number, NaN, Infinity or -Infinity.");
		expect(setWith({ type: "bytes", value: "abc" })).toThrow("A bytes value must be base64 text.");
		expect(setWith({ type: "timestamp", value: { seconds: 0, nanos: 1_000_000_000 } })).toThrow(
			"A timestamp must lie between the years 1 and 9999.",
		);
		expect(setWith({ type: "geopoint", value: { latitude: 91, longitude: 0 } })).toThrow("A geopoint needs a latitude");
		expect(setWith({ type: "reference", value: "users" })).toThrow("A reference must be a document path.");
		expect(setWith({ type: "vector", value: [] })).toThrow("A vector must be a non-empty list of finite numbers.");
		expect(setWith({ type: "regex", value: "." })).toThrow("Unknown value type.");
		expect(setWith("plain")).toThrow("Each value must be a tagged value.");
	});

	test("rejects nested arrays, reserved field names and values nested too deep", () => {
		expect(setWith({ type: "array", value: [{ type: "array", value: [] }] })).toThrow(
			"An array cannot hold another array directly; wrap it in a map.",
		);
		expect(setWith({ type: "map", value: { __name__: { type: "null" } } })).toThrow('"__name__" is not a valid field name.');
		let deepValue: unknown = { type: "null" };
		for (let level = 0; level < 21; level += 1) {
			deepValue = { type: "map", value: { inner: deepValue } };
		}
		expect(setWith(deepValue)).toThrow("Values may nest at most 20 levels deep.");
	});
});
