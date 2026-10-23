import type { FirestoreDocument, FirestoreValue } from "../../../../shared/interfaces/firestore-value.interface";
import { formatTimestampUtc } from "./firestore-value-format";

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

function fieldsToReadableJson(fields: Record<string, FirestoreValue>): Record<string, unknown> {
	return Object.fromEntries(Object.entries(fields).map(([name, value]) => [name, toReadableJson(value)]));
}
