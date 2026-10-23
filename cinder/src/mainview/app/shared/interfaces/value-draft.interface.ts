import type { FirestoreValue } from "../../../../shared/interfaces/firestore-value.interface";

export type ValueType = FirestoreValue["type"];

export type TextValueType = "string" | "integer" | "double" | "bytes" | "timestamp" | "reference" | "vector";

export interface NullDraft {
	type: "null";
}

export interface BooleanDraft {
	type: "boolean";
	value: boolean;
}

export interface TextDraft {
	type: TextValueType;
	text: string;
}

export interface GeoPointDraft {
	type: "geopoint";
	latitude: string;
	longitude: string;
}

export interface MapDraft {
	type: "map";
	fields: FieldDraft[];
}

export interface ArrayDraft {
	type: "array";
	items: ValueDraft[];
}

export type ValueDraft = NullDraft | BooleanDraft | TextDraft | GeoPointDraft | MapDraft | ArrayDraft;

export interface FieldDraft {
	id: number;
	name: string;
	value: ValueDraft;
}

export interface FieldChanges {
	changedFields: Record<string, FirestoreValue>;
	deletedFieldNames: string[];
}
