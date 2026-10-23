import { FieldPath, FieldValue, GeoPoint, Timestamp, type Firestore } from "@google-cloud/firestore";
import { createContext, Script } from "node:vm";
import { format, types } from "node:util";
import type { FirestoreResult } from "../../shared/interfaces/firestore-value.interface";
import type { TaskLogLevel } from "../../shared/interfaces/task.interface";
import { encodeResult } from "../utils/firestore-value-encoder";

const SCRIPT_FILENAME = "script.js";

export async function runScript(
	db: Firestore,
	script: string,
	log: (level: TaskLogLevel, message: string) => void,
): Promise<FirestoreResult> {
	const context = createContext({
		db,
		admin: { firestore: { FieldValue, Timestamp, GeoPoint, FieldPath } },
		console: {
			log: (...args: unknown[]) => log("log", format(...args)),
			info: (...args: unknown[]) => log("info", format(...args)),
			warn: (...args: unknown[]) => log("warn", format(...args)),
			error: (...args: unknown[]) => log("error", format(...args)),
		},
		setTimeout,
		clearTimeout,
		setInterval,
		clearInterval,
		setImmediate,
		clearImmediate,
	});
	try {
		new Script(script, { filename: SCRIPT_FILENAME }).runInContext(context);
		if (typeof context.run !== "function") {
			throw new Error("The script must define async function run().");
		}
		return encodeResult(await context.run());
	} catch (error) {
		throw new Error(describeScriptError(error));
	}
}

function describeScriptError(error: unknown): string {
	if (!types.isNativeError(error) || !error.stack) {
		return String(error);
	}
	const scriptFrames = error.stack.split("\n").filter((line) => line.includes(SCRIPT_FILENAME));
	return [`${error.name}: ${error.message}`, ...scriptFrames].join("\n");
}
