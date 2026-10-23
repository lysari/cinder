import { describe, expect, test } from "bun:test";
import { parseTaskRequest } from "../../src/bun/task-request-parser";
import type { TaskRequest } from "../../src/shared/interfaces/task.interface";

const DATABASE = { accountId: "emulator", projectId: "demo-cinder", databaseId: "(default)" };

describe("parseTaskRequest", () => {
	test("accepts a run-script request", () => {
		const request: TaskRequest = { type: "run-script", database: DATABASE, script: "async function run() {}" };
		expect(parseTaskRequest(request)).toEqual(request);
	});

	test("drops fields the request type does not have", () => {
		const request = { type: "run-script", database: { ...DATABASE, extra: 1 }, script: "", extra: true };
		expect(parseTaskRequest(request)).toEqual({ type: "run-script", database: DATABASE, script: "" });
	});

	test("rejects an unknown task type", () => {
		expect(() => parseTaskRequest({ type: "format-disk" })).toThrow("Unknown task type.");
		expect(() => parseTaskRequest(null)).toThrow("Unknown task type.");
	});

	test("rejects a run-script request without a script", () => {
		expect(() => parseTaskRequest({ type: "run-script", database: DATABASE })).toThrow("A run-script task needs a script.");
	});

	test("rejects a request without a full database target", () => {
		expect(() => parseTaskRequest({ type: "run-script", database: { ...DATABASE, databaseId: "" }, script: "" })).toThrow(
			"The request needs an account id, project id and database id.",
		);
	});
});
