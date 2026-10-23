import { describe, expect, test } from "bun:test";
import type { BulkUpdateOperationForm } from "../../../../../src/mainview/app/shared/interfaces/bulk-update-form.interface";
import { initialOperationValue, readBulkUpdateForm } from "../../../../../src/mainview/app/shared/utils/bulk-update-form";

function row(changes: Partial<BulkUpdateOperationForm>): BulkUpdateOperationForm {
	return { type: "set", fieldPath: "name", newFieldPath: "", isOverwriting: false, value: { type: "string", text: "Dara" }, ...changes };
}

describe("initialOperationValue", () => {
	test("starts increments at 1 and array operations with one empty item", () => {
		expect(initialOperationValue("increment")).toEqual({ type: "integer", text: "1" });
		expect(initialOperationValue("array-union")).toEqual({ type: "array", items: [{ type: "string", text: "" }] });
		expect(initialOperationValue("set")).toEqual({ type: "string", text: "" });
	});
});

describe("readBulkUpdateForm", () => {
	test("reads every operation type into its request shape", () => {
		const result = readBulkUpdateForm([
			row({}),
			row({ type: "delete", fieldPath: "old" }),
			row({ type: "rename", fieldPath: "a", newFieldPath: "b.c", isOverwriting: true }),
			row({ type: "increment", fieldPath: "n", value: { type: "double", text: "១.៥" } }),
			row({ type: "array-remove", fieldPath: "tags", value: { type: "array", items: [{ type: "integer", text: "1" }] } }),
			row({ type: "server-timestamp", fieldPath: "at" }),
		]);
		expect(result).toEqual({
			issues: [],
			operations: [
				{ type: "set", fieldPath: "name", value: { type: "string", value: "Dara" } },
				{ type: "delete", fieldPath: "old" },
				{ type: "rename", fieldPath: "a", newFieldPath: "b.c", isOverwriting: true },
				{ type: "increment", fieldPath: "n", value: { type: "double", value: 1.5 } },
				{ type: "array-remove", fieldPath: "tags", values: [{ type: "integer", value: "1" }] },
				{ type: "server-timestamp", fieldPath: "at" },
			],
		});
	});

	test("ties value and field path issues to their rows and withholds the operations", () => {
		const result = readBulkUpdateForm([
			row({ type: "increment", value: { type: "string", text: "1" } }),
			row({ fieldPath: "a..b", value: { type: "integer", text: "x" } }),
			row({ type: "array-union", value: { type: "string", text: "x" } }),
		]);
		expect(result.operations).toBeNull();
		expect(result.issues).toEqual([
			{ index: 0, message: "Increment by an integer or a double." },
			{ index: 1, message: "Fix the value." },
			{ index: 2, message: "Enter a list of valid values." },
			{ index: 1, message: "A field path cannot start or end with a dot or have two dots in a row." },
		]);
	});

	test("reports list issues without a row", () => {
		expect(readBulkUpdateForm([]).issues).toEqual([{ index: null, message: "Add at least one operation." }]);
	});
});
