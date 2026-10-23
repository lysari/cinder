import { describe, expect, test } from "bun:test";
import { cinderJsonClosing, cinderJsonOpening, parseCinderDocument, parseCinderHeader, toJsonText } from "../../../src/shared/utils/cinder-json";

describe("toJsonText", () => {
	test("writes JSON like JSON.stringify but keeps a negative zero", () => {
		const value = { a: [1, -0, 0.5, "x\n\"y\""], b: { c: null, d: true } };
		expect(toJsonText(value)).toBe(JSON.stringify(value).replace("[1,0,", "[1,-0,"));
		expect(Object.is((JSON.parse(toJsonText({ n: -0 })) as { n: number }).n, -0)).toBe(true);
	});
});

describe("Cinder JSON layout", () => {
	test("opens with the header fields and closes with the document count, as valid JSON", () => {
		const header = {
			format: "cinder-json",
			version: 1,
			exportedAt: "2026-10-23T00:00:00.000Z",
			projectId: "demo-cinder",
			databaseId: "(default)",
			source: { type: "collection" as const, collectionPath: "users", isRecursive: false },
			rootPath: "users",
		};
		const text = `${cinderJsonOpening(header)}\t\t{"path":"users/a","fields":{}}${cinderJsonClosing(1)}`;
		expect(JSON.parse(text)).toEqual({ ...header, documents: [{ path: "users/a", fields: {} }], documentCount: 1 });
	});
});

describe("parseCinderHeader", () => {
	test("reads the root path and export time of a matching header", () => {
		expect(parseCinderHeader({ format: "cinder-ndjson", version: 1, rootPath: "users", exportedAt: "t" }, "cinder-ndjson")).toEqual({
			rootPath: "users",
			exportedAt: "t",
		});
		expect(parseCinderHeader({ format: "cinder-json", version: 1 }, "cinder-json")).toEqual({ rootPath: null, exportedAt: null });
	});

	test("rejects another format, a newer version or a bad root path", () => {
		expect(() => parseCinderHeader({ format: "other", version: 1 }, "cinder-json")).toThrow("The file is not a cinder-json export.");
		expect(() => parseCinderHeader({ format: "cinder-json", version: 2 }, "cinder-json")).toThrow("format version 2");
		expect(() => parseCinderHeader({ format: "cinder-json", version: 1, rootPath: "users/a" }, "cinder-json")).toThrow("rootPath");
	});
});

describe("parseCinderDocument", () => {
	test("checks the path and the tagged fields", () => {
		expect(parseCinderDocument({ path: "users/a", fields: { n: { type: "integer", value: "1" } } })).toEqual({
			path: "users/a",
			fields: { n: { type: "integer", value: "1" } },
		});
		expect(() => parseCinderDocument({ path: "users", fields: {} })).toThrow("The document has no valid path.");
		expect(() => parseCinderDocument({ path: "users/a", fields: { n: { type: "unknown" } } })).toThrow("Unknown value type.");
	});
});
