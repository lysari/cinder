export interface FirestoreTimestamp {
	seconds: number;
	nanos: number;
}

export interface FirestoreGeoPoint {
	latitude: number;
	longitude: number;
}

export type NonFiniteDouble = "NaN" | "Infinity" | "-Infinity";

export interface FirestoreNullValue {
	type: "null";
}

export interface FirestoreBooleanValue {
	type: "boolean";
	value: boolean;
}

export interface FirestoreIntegerValue {
	type: "integer";
	value: string;
}

export interface FirestoreDoubleValue {
	type: "double";
	value: number | NonFiniteDouble;
}

export interface FirestoreStringValue {
	type: "string";
	value: string;
}

export interface FirestoreBytesValue {
	type: "bytes";
	value: string;
}

export interface FirestoreTimestampValue {
	type: "timestamp";
	value: FirestoreTimestamp;
}

export interface FirestoreGeoPointValue {
	type: "geopoint";
	value: FirestoreGeoPoint;
}

export interface FirestoreReferenceValue {
	type: "reference";
	value: string;
}

export interface FirestoreVectorValue {
	type: "vector";
	value: number[];
}

export interface FirestoreArrayValue {
	type: "array";
	value: FirestoreValue[];
}

export interface FirestoreMapValue {
	type: "map";
	value: Record<string, FirestoreValue>;
}

export type FirestoreValue =
	| FirestoreNullValue
	| FirestoreBooleanValue
	| FirestoreIntegerValue
	| FirestoreDoubleValue
	| FirestoreStringValue
	| FirestoreBytesValue
	| FirestoreTimestampValue
	| FirestoreGeoPointValue
	| FirestoreReferenceValue
	| FirestoreVectorValue
	| FirestoreArrayValue
	| FirestoreMapValue;

export interface FirestoreDocument {
	path: string;
	id: string;
	fields: Record<string, FirestoreValue>;
	createTime: FirestoreTimestamp;
	updateTime: FirestoreTimestamp;
}

export interface FirestoreDocumentResult {
	kind: "document";
	path: string;
	document: FirestoreDocument | null;
}

export interface FirestoreDocumentListResult {
	kind: "documents";
	documents: FirestoreDocument[];
}

export interface FirestoreValueResult {
	kind: "value";
	value: FirestoreValue;
}

export type FirestoreResult = FirestoreDocumentResult | FirestoreDocumentListResult | FirestoreValueResult;
