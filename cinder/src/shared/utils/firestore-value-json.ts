import type { FirestoreDocument, FirestoreValue } from "../interfaces/firestore-value.interface";
import { formatTimestampUtc } from "./firestore-timestamp";

/** Turns a tagged value into plain JSON for reading: timestamps become ISO strings, references paths, bytes base64. */
export function toReadableJson(value: FirestoreValue): unknown {
	switch (value.type) {
		case "null":
			return null;
		case "boolean":
		case "string":
		case "bytes":
		case "reference":
		case "double":
		case "vector":
			return value.value;
		case "integer": {
			const integer = Number(value.value);
			return Number.isSafeInteger(integer) ? integer : value.value;
		}
		case "timestamp":
			return formatTimestampUtc(value.value);
		case "geopoint":
			return { latitude: value.value.latitude, longitude: value.value.longitude };
		case "array":
			return value.value.map(toReadableJson);
		case "map":
			return fieldsToReadableJson(value.value);
	}
}

/** Turns documents into one readable JSON object keyed by document id, each holding its fields. */
export function documentsToReadableJson(documents: FirestoreDocument[]): Record<string, unknown> {
	return Object.fromEntries(documents.map((document) => [document.id, fieldsToReadableJson(document.fields)]));
}

/** Turns a document's tagged fields into one readable JSON object. Pass `document.fields`. */
export function fieldsToReadableJson(fields: Record<string, FirestoreValue>): Record<string, unknown> {
	return Object.fromEntries(Object.entries(fields).map(([name, value]) => [name, toReadableJson(value)]));
}

/** Turns a parsed plain JSON value into a tagged value: safe whole numbers become integers, other numbers doubles. Throws on an array inside an array. */
export function valueFromPlainJson(value: unknown): FirestoreValue {
	if (value === null) {
		return { type: "null" };
	}
	switch (typeof value) {
		case "boolean":
			return { type: "boolean", value };
		case "string":
			return { type: "string", value };
		case "number":
			return Number.isSafeInteger(value) && !Object.is(value, -0)
				? { type: "integer", value: String(value) }
				: { type: "double", value };
		case "object":
			return Array.isArray(value) ? { type: "array", value: value.map(itemFromPlainJson) } : { type: "map", value: fieldsFromPlainJson(value) };
		default:
			throw new Error(`A ${typeof value} is not a JSON value.`);
	}
}

/** Turns a parsed plain JSON object into tagged document fields. Pass the object an import item holds. */
export function fieldsFromPlainJson(object: object): Record<string, FirestoreValue> {
	return Object.fromEntries(Object.entries(object).map(([name, value]) => [name, valueFromPlainJson(value)]));
}

function itemFromPlainJson(item: unknown): FirestoreValue {
	if (Array.isArray(item)) {
		throw new Error("An array cannot hold another array directly; Firestore does not store nested arrays.");
	}
	return valueFromPlainJson(item);
}
