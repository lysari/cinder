import type { Completion, CompletionContext, CompletionResult } from "@codemirror/autocomplete";
import { syntaxTree } from "@codemirror/language";

const NO_COMPLETION_NODES = new Set(["String", "TemplateString", "LineComment", "BlockComment", "RegExp"]);
const WORD_BEFORE_PATTERN = /[\w$]*$/;
const MEMBER_ACCESS_PATTERN = /(?:([A-Za-z_$][\w$]*(?:\s*\.\s*[A-Za-z_$][\w$]*)*)\s*)?\.\s*$/;
const WORD_PATTERN = /^[\w$]*$/;

const CONTEXT_COMPLETIONS: Completion[] = [
	{ label: "db", type: "variable", detail: "Firestore" },
	{ label: "admin", type: "namespace", detail: "admin.firestore" },
	{ label: "console", type: "variable", detail: "task log" },
];

const MEMBER_COMPLETIONS: Record<string, Completion[]> = {
	db: [
		{ label: "collection", type: "method", detail: "(path)" },
		{ label: "collectionGroup", type: "method", detail: "(collectionId)" },
		{ label: "doc", type: "method", detail: "(path)" },
		{ label: "getAll", type: "method", detail: "(...documents)" },
		{ label: "listCollections", type: "method", detail: "()" },
		{ label: "batch", type: "method", detail: "()" },
		{ label: "bulkWriter", type: "method", detail: "()" },
		{ label: "runTransaction", type: "method", detail: "(update)" },
		{ label: "recursiveDelete", type: "method", detail: "(reference)" },
	],
	admin: [{ label: "firestore", type: "namespace" }],
	"admin.firestore": [
		{ label: "FieldValue", type: "class" },
		{ label: "Timestamp", type: "class" },
		{ label: "GeoPoint", type: "class" },
		{ label: "FieldPath", type: "class" },
	],
	"admin.firestore.FieldValue": [
		{ label: "serverTimestamp", type: "method", detail: "()" },
		{ label: "increment", type: "method", detail: "(n)" },
		{ label: "arrayUnion", type: "method", detail: "(...values)" },
		{ label: "arrayRemove", type: "method", detail: "(...values)" },
		{ label: "delete", type: "method", detail: "()" },
		{ label: "vector", type: "method", detail: "(values)" },
	],
	"admin.firestore.Timestamp": [
		{ label: "now", type: "method", detail: "()" },
		{ label: "fromDate", type: "method", detail: "(date)" },
		{ label: "fromMillis", type: "method", detail: "(milliseconds)" },
	],
	"admin.firestore.FieldPath": [{ label: "documentId", type: "method", detail: "()" }],
	console: [
		{ label: "log", type: "method", detail: "(...values)" },
		{ label: "info", type: "method", detail: "(...values)" },
		{ label: "warn", type: "method", detail: "(...values)" },
		{ label: "error", type: "method", detail: "(...values)" },
	],
};

const REFERENCE_AND_QUERY_COMPLETIONS: Completion[] = [
	{ label: "where", type: "method", detail: "(field, operator, value)" },
	{ label: "orderBy", type: "method", detail: "(field, direction)" },
	{ label: "limit", type: "method", detail: "(count)" },
	{ label: "limitToLast", type: "method", detail: "(count)" },
	{ label: "offset", type: "method", detail: "(count)" },
	{ label: "select", type: "method", detail: "(...fields)" },
	{ label: "startAt", type: "method", detail: "(...values)" },
	{ label: "startAfter", type: "method", detail: "(...values)" },
	{ label: "endAt", type: "method", detail: "(...values)" },
	{ label: "endBefore", type: "method", detail: "(...values)" },
	{ label: "count", type: "method", detail: "()" },
	{ label: "get", type: "method", detail: "()" },
	{ label: "doc", type: "method", detail: "(id)" },
	{ label: "collection", type: "method", detail: "(id)" },
	{ label: "listDocuments", type: "method", detail: "()" },
	{ label: "listCollections", type: "method", detail: "()" },
	{ label: "add", type: "method", detail: "(data)" },
	{ label: "create", type: "method", detail: "(data)" },
	{ label: "set", type: "method", detail: "(data, options)" },
	{ label: "update", type: "method", detail: "(data)" },
	{ label: "delete", type: "method", detail: "()" },
	{ label: "data", type: "method", detail: "()" },
	{ label: "docs", type: "property" },
	{ label: "size", type: "property" },
	{ label: "empty", type: "property" },
	{ label: "exists", type: "property" },
	{ label: "id", type: "property" },
	{ label: "ref", type: "property" },
	{ label: "path", type: "property" },
	{ label: "parent", type: "property" },
];

/** Completes the run-script context in a JavaScript editor: members of db, admin.firestore and console, and query methods after a dot. */
export function completeScriptContext(context: CompletionContext): CompletionResult | null {
	if (NO_COMPLETION_NODES.has(syntaxTree(context.state).resolveInner(context.pos, -1).name)) {
		return null;
	}
	const word = context.matchBefore(WORD_BEFORE_PATTERN);
	const from = word ? word.from : context.pos;
	const line = context.state.doc.lineAt(from);
	const member = MEMBER_ACCESS_PATTERN.exec(line.text.slice(0, from - line.from));
	if (member) {
		const objectPath = member[1]?.replace(/\s+/g, "");
		const options = (objectPath && MEMBER_COMPLETIONS[objectPath]) || REFERENCE_AND_QUERY_COMPLETIONS;
		return { from, options, validFor: WORD_PATTERN };
	}
	if (from === context.pos && !context.explicit) {
		return null;
	}
	return { from, options: CONTEXT_COMPLETIONS, validFor: WORD_PATTERN };
}
