import type { TaskRequest } from "../shared/interfaces/task.interface";
import { isObject } from "../shared/utils/type-guards";
import { parseDatabaseTarget } from "./account-request-parser";

export function parseTaskRequest(value: unknown): TaskRequest {
	if (!isObject(value) || value.type !== "run-script") {
		throw new Error("Unknown task type.");
	}
	if (typeof value.script !== "string") {
		throw new Error("A run-script task needs a script.");
	}
	return { type: "run-script", database: parseDatabaseTarget(value.database), script: value.script };
}
