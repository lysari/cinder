import { describe, expect, test } from "bun:test";
import { exportFileNameError, exportPartialFileName, exportSpoolFileName } from "../../../src/shared/utils/export-file-name";

describe("exportFileNameError", () => {
	test("accepts a plain name with the format's extension", () => {
		expect(exportFileNameError("users.json", "cinder-json")).toBeNull();
		expect(exportFileNameError("Users Export.JSONL", "ndjson")).toBeNull();
		expect(exportFileNameError("ភ្នំពេញ.csv", "csv")).toBeNull();
	});

	test("rejects folders, traversal, hidden names and control characters", () => {
		expect(exportFileNameError("../users.json", "cinder-json")).toBe("A file name cannot contain /, \\, : or control characters.");
		expect(exportFileNameError("a\\b.json", "cinder-json")).toBe("A file name cannot contain /, \\, : or control characters.");
		expect(exportFileNameError("a\nb.json", "cinder-json")).toBe("A file name cannot contain /, \\, : or control characters.");
		expect(exportFileNameError("..", "cinder-json")).toBe('A file name cannot start with a dot or contain "..".');
		expect(exportFileNameError(".users.json", "cinder-json")).toBe('A file name cannot start with a dot or contain "..".');
		expect(exportFileNameError("", "cinder-json")).toBe("Enter a file name.");
		expect(exportFileNameError(`${"a".repeat(200)}.json`, "cinder-json")).toBe("A file name can be at most 200 bytes long.");
	});

	test("asks for the extension of the format", () => {
		expect(exportFileNameError("users.csv", "readable-json")).toBe("End the file name with .json.");
		expect(exportFileNameError("users", "csv")).toBe("End the file name with .csv.");
	});
});

describe("temporary export file names", () => {
	test("hide the files next to the final one and name the task", () => {
		expect(exportPartialFileName("users.json", "t1")).toBe(".users.json.t1.partial");
		expect(exportSpoolFileName("users.csv", "t1")).toBe(".users.csv.t1.spool");
	});
});
