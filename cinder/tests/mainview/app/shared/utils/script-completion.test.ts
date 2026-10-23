import { CompletionContext, type CompletionResult } from "@codemirror/autocomplete";
import { javascript } from "@codemirror/lang-javascript";
import { EditorState } from "@codemirror/state";
import { describe, expect, test } from "bun:test";
import { completeScriptContext } from "../../../../../src/mainview/app/shared/utils/script-completion";

function complete(textWithCursor: string, isExplicit = false): CompletionResult | null {
	const position = textWithCursor.indexOf("|");
	const doc = textWithCursor.replace("|", "");
	const state = EditorState.create({ doc, extensions: [javascript()] });
	return completeScriptContext(new CompletionContext(state, position, isExplicit));
}

function labelsOf(result: CompletionResult | null): string[] {
	return result?.options.map((option) => option.label) ?? [];
}

describe("completeScriptContext", () => {
	test("completes members of db, admin.firestore and console", () => {
		expect(labelsOf(complete("db.col|"))).toContain("collectionGroup");
		expect(complete("db.col|")?.from).toBe(3);
		expect(labelsOf(complete("admin.|"))).toEqual(["firestore"]);
		expect(labelsOf(complete("admin.firestore.|"))).toEqual(["FieldValue", "Timestamp", "GeoPoint", "FieldPath"]);
		expect(labelsOf(complete("admin.firestore.Timestamp.from|"))).toContain("fromMillis");
		expect(labelsOf(complete("console.|"))).toEqual(["log", "info", "warn", "error"]);
	});

	test("completes query and document methods after a call, also on a continued line", () => {
		expect(labelsOf(complete('db.collection("users").|'))).toContain("where");
		expect(labelsOf(complete('db.collection("users")\n    .order|'))).toContain("orderBy");
		expect(labelsOf(complete("snapshot.|"))).toContain("docs");
	});

	test("completes the context names when typing a word or on request", () => {
		expect(labelsOf(complete("const x = d|"))).toEqual(["db", "admin", "console"]);
		expect(complete("const x = |")).toBeNull();
		expect(labelsOf(complete("const x = |", true))).toEqual(["db", "admin", "console"]);
	});

	test("does not complete inside strings and comments", () => {
		expect(complete('db.collection("db.|")')).toBeNull();
		expect(complete("// db.|")).toBeNull();
	});
});
