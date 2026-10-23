import {
	DocumentReference,
	DocumentSnapshot,
	GeoPoint,
	QuerySnapshot,
	Timestamp,
	VectorValue,
} from "@google-cloud/firestore";
import { types } from "node:util";
import type {
	FirestoreDocument,
	FirestoreResult,
	FirestoreTimestamp,
	FirestoreValue,
} from "../../shared/interfaces/firestore-value.interface";

/** Encodes a script's return value for the main process. Pass the awaited value; snapshots become documents, anything else a tagged value. */
export function encodeResult(value: unknown): FirestoreResult {
	if (value instanceof DocumentSnapshot) {
		return { kind: "document", path: value.ref.path, document: value.exists ? encodeDocument(value, false) : null };
	}
	if (value instanceof QuerySnapshot) {
		return { kind: "documents", documents: value.docs.map((document) => encodeDocument(document, false)) };
	}
	return { kind: "value", value: encodeValue(value) };
}

/** Encodes an existing document read by a client created with `useBigInt: true`, so integers and doubles keep their stored type. */
export function encodeBigIntDocument(snapshot: DocumentSnapshot): FirestoreDocument {
	return encodeDocument(snapshot, true);
}

function encodeDocument(snapshot: DocumentSnapshot, isBigIntClient: boolean): FirestoreDocument {
	return {
		path: snapshot.ref.path,
		id: snapshot.id,
		fields: encodeFields(snapshot.data() ?? {}, isBigIntClient),
		createTime: encodeTimestamp(snapshot.createTime as Timestamp),
		updateTime: encodeTimestamp(snapshot.updateTime as Timestamp),
	};
}

/** Encodes one Firestore SDK or plain JavaScript value as a JSON-safe tagged value. Pass any value a document or script can hold. */
export function encodeValue(value: unknown): FirestoreValue {
	return encode(value, false);
}

function encode(value: unknown, isBigIntClient: boolean): FirestoreValue {
	if (value === null || value === undefined) {
		return { type: "null" };
	}
	switch (typeof value) {
		case "boolean":
			return { type: "boolean", value };
		case "number":
			return isBigIntClient ? encodeDouble(value) : encodeNumber(value);
		case "bigint":
			return { type: "integer", value: value.toString() };
		case "string":
			return { type: "string", value };
		case "object":
			return encodeObject(value, isBigIntClient);
		default:
			return { type: "string", value: String(value) };
	}
}

function encodeNumber(value: number): FirestoreValue {
	if (Number.isInteger(value)) {
		return { type: "integer", value: value.toString() };
	}
	return encodeDouble(value);
}

function encodeDouble(value: number): FirestoreValue {
	if (Number.isNaN(value)) {
		return { type: "double", value: "NaN" };
	}
	if (!Number.isFinite(value)) {
		return { type: "double", value: value > 0 ? "Infinity" : "-Infinity" };
	}
	return { type: "double", value };
}

function encodeObject(value: object, isBigIntClient: boolean): FirestoreValue {
	if (Array.isArray(value)) {
		return { type: "array", value: value.map((item) => encode(item, isBigIntClient)) };
	}
	if (value instanceof Timestamp) {
		return { type: "timestamp", value: encodeTimestamp(value) };
	}
	if (types.isDate(value)) {
		return { type: "timestamp", value: encodeTimestamp(Timestamp.fromDate(value)) };
	}
	if (types.isUint8Array(value)) {
		return { type: "bytes", value: Buffer.from(value).toString("base64") };
	}
	if (value instanceof GeoPoint) {
		return { type: "geopoint", value: { latitude: value.latitude, longitude: value.longitude } };
	}
	if (value instanceof DocumentReference) {
		return { type: "reference", value: value.path };
	}
	if (value instanceof VectorValue) {
		return { type: "vector", value: value.toArray() };
	}
	if (value instanceof DocumentSnapshot) {
		return value.exists ? { type: "map", value: encodeFields(value.data() ?? {}, isBigIntClient) } : { type: "null" };
	}
	if (value instanceof QuerySnapshot) {
		return { type: "array", value: value.docs.map((document) => encode(document, isBigIntClient)) };
	}
	if (isPlainObject(value)) {
		return { type: "map", value: encodeFields(value, isBigIntClient) };
	}
	return { type: "string", value: String(value) };
}

function encodeFields(fields: Record<string, unknown>, isBigIntClient: boolean): Record<string, FirestoreValue> {
	return Object.fromEntries(Object.entries(fields).map(([key, field]) => [key, encode(field, isBigIntClient)]));
}

function encodeTimestamp(timestamp: Timestamp): FirestoreTimestamp {
	return { seconds: timestamp.seconds, nanos: timestamp.nanoseconds };
}

function isPlainObject(value: object): value is Record<string, unknown> {
	const prototype = Object.getPrototypeOf(value);
	return prototype === null || Object.getPrototypeOf(prototype) === null;
}
