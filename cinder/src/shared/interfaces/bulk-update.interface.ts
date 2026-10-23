import type { DatabaseTarget } from "./account.interface";
import type { FirestoreDoubleValue, FirestoreIntegerValue, FirestoreValue } from "./firestore-value.interface";
import type { StructuredQuery } from "./query.interface";

export type BulkUpdateOperation =
	| { type: "set"; fieldPath: string; value: FirestoreValue }
	| { type: "delete"; fieldPath: string }
	| { type: "rename"; fieldPath: string; newFieldPath: string; isOverwriting: boolean }
	| { type: "increment"; fieldPath: string; value: FirestoreIntegerValue | FirestoreDoubleValue }
	| { type: "array-union"; fieldPath: string; values: FirestoreValue[] }
	| { type: "array-remove"; fieldPath: string; values: FirestoreValue[] }
	| { type: "server-timestamp"; fieldPath: string };

export type BulkUpdateOperationType = BulkUpdateOperation["type"];

export interface BulkUpdateTaskRequest {
	type: "bulk-update";
	database: DatabaseTarget;
	query: StructuredQuery;
	operations: BulkUpdateOperation[];
	isDryRun: boolean;
}

export interface BulkUpdateIssue {
	index: number | null;
	message: string;
}

export interface BulkUpdateFieldChange {
	fieldPath: string;
	before: FirestoreValue | null;
	after: FirestoreValue | null;
	isServerTimestamp: boolean;
}

export interface BulkUpdatePreviewDocument {
	path: string;
	changes: BulkUpdateFieldChange[];
	problem: string | null;
}

export interface BulkUpdatePreviewResult {
	kind: "bulk-update-preview";
	documents: BulkUpdatePreviewDocument[];
}
