import { describe, expect, test } from "bun:test";
import { scriptErrorLocation } from "../../../../../src/mainview/app/shared/utils/script-error";

describe("scriptErrorLocation", () => {
	test("finds the first script.js line and column of a task error", () => {
		const error = "TypeError: null is not an object\n    at helper (script.js:5:7)\n    at run (script.js:2:9)";
		expect(scriptErrorLocation(error)).toEqual({ line: 5, column: 7 });
		expect(scriptErrorLocation("SyntaxError: Unexpected token\nscript.js:3")).toEqual({ line: 3, column: null });
	});

	test("returns null when the error names no script line", () => {
		expect(scriptErrorLocation("Error: The script must define async function run().")).toBeNull();
	});
});
