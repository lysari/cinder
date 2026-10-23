import { FieldValue, type Firestore, GeoPoint, Timestamp } from "@google-cloud/firestore";
import type { FirestoreValue } from "../../shared/interfaces/firestore-value.interface";

/** Turns a tagged value into the SDK value Firestore stores with that type. Pass the client that resolves reference paths. */
export function decodeValue(value: FirestoreValue, db: Firestore): unknown {
	switch (value.type) {
		case "null":
			return null;
		case "boolean":
		case "string":
			return value.value;
		case "integer":
			return BigInt(value.value);
		case "double":
			return Number(value.value);
		case "bytes":
			return Buffer.from(value.value, "base64");
		case "timestamp":
			return new Timestamp(value.value.seconds, value.value.nanos);
		case "geopoint":
			return new GeoPoint(value.value.latitude, value.value.longitude);
		case "reference":
			return db.doc(value.value);
		case "vector":
			return FieldValue.vector(value.value);
		case "array":
			return value.value.map((item) => decodeValue(item, db));
		case "map":
			return decodeFields(value.value, db);
	}
}

/** Turns tagged document fields into the object the SDK writes. Pass the fields of a create, set or update request. */
export function decodeFields(fields: Record<string, FirestoreValue>, db: Firestore): Record<string, unknown> {
	return Object.fromEntries(Object.entries(fields).map(([name, value]) => [name, decodeValue(value, db)]));
}
