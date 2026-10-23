import { describe, expect, test } from "bun:test";
import type { BulkUpdateOperation } from "../../../src/shared/interfaces/bulk-update.interface";
import { fieldPathsOverlap, validateBulkUpdate } from "../../../src/shared/utils/bulk-update-validation";

describe("validateBulkUpdate", () => {
	test("accepts a valid list", () => {
		const operations: BulkUpdateOperation[] = [
			{ type: "set", fieldPath: "meta", value: { type: "map", value: {} } },
			{ type: "server-timestamp", fieldPath: "meta.at" },
			{ type: "increment", fieldPath: "count", value: { type: "integer", value: "1" } },
		];
		expect(validateBulkUpdate(operations)).toEqual([]);
	});

	test("checks field paths, rename targets, increments, array values and the list size", () => {
		expect(validateBulkUpdate([{ type: "delete", fieldPath: "" }])).toEqual([{ index: 0, message: "Enter a field path." }]);
		expect(validateBulkUpdate([{ type: "rename", fieldPath: "a.b", newFieldPath: "a", isOverwriting: false }])).toEqual([
			{ index: 0, message: "The new field path cannot be the field itself or lie inside it." },
		]);
		expect(validateBulkUpdate([{ type: "rename", fieldPath: "a", newFieldPath: "b*", isOverwriting: false }])).toEqual([
			{ index: 0, message: "New name: A field path cannot contain ~ * / [ or ]." },
		]);
		expect(validateBulkUpdate([{ type: "increment", fieldPath: "n", value: { type: "double", value: "NaN" } }])).toEqual([
			{ index: 0, message: "Increment by a finite number." },
		]);
		expect(validateBulkUpdate([{ type: "array-union", fieldPath: "n", values: [] }])).toEqual([{ index: 0, message: "Add at least one value." }]);
		const tooMany = Array.from({ length: 51 }, (): BulkUpdateOperation => ({ type: "delete", fieldPath: "a" }));
		expect(validateBulkUpdate(tooMany)).toEqual([{ index: null, message: "A bulk update can have at most 50 operations." }]);
	});

	test("refuses operations after a server timestamp on the same field or inside it", () => {
		const issues = validateBulkUpdate([
			{ type: "server-timestamp", fieldPath: "meta" },
			{ type: "set", fieldPath: "other", value: { type: "null" } },
			{ type: "rename", fieldPath: "x", newFieldPath: "meta.at", isOverwriting: false },
		]);
		expect(issues).toEqual([{ index: 2, message: "Operation 1 sets this field to the server time; put this operation before it." }]);
	});
});

describe("fieldPathsOverlap", () => {
	test("matches the same field and nested fields, not shared prefixes", () => {
		expect(fieldPathsOverlap("a", "a")).toBe(true);
		expect(fieldPathsOverlap("a", "a.b")).toBe(true);
		expect(fieldPathsOverlap("a.b", "a")).toBe(true);
		expect(fieldPathsOverlap("a", "ab")).toBe(false);
	});
});
