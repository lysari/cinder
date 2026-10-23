import type { QueryDirection, QueryOperator, QueryTargetType, QueryValueType } from "../constants/query";
import type { DatabaseTarget } from "./account.interface";
import type {
	FirestoreBooleanValue,
	FirestoreDoubleValue,
	FirestoreIntegerValue,
	FirestoreNullValue,
	FirestoreStringValue,
	FirestoreTimestampValue,
} from "./firestore-value.interface";

export type QueryScalarValue =
	| FirestoreStringValue
	| FirestoreIntegerValue
	| FirestoreDoubleValue
	| FirestoreBooleanValue
	| FirestoreNullValue
	| FirestoreTimestampValue;

export interface QueryArrayValue {
	type: "array";
	value: QueryScalarValue[];
}

export type QueryValue = QueryScalarValue | QueryArrayValue;

export type QueryTarget = { type: "collection"; collectionPath: string } | { type: "collection-group"; collectionId: string };

export interface QueryFilter {
	fieldPath: string;
	operator: QueryOperator;
	value: QueryValue;
}

export interface QueryOrder {
	fieldPath: string;
	direction: QueryDirection;
}

export interface StructuredQuery {
	target: QueryTarget;
	filters: QueryFilter[];
	orders: QueryOrder[];
	limit: number | null;
}

export interface QueryIssue {
	section: "target" | "filter" | "order" | "limit";
	index: number | null;
	message: string;
}

export interface QueryCursor {
	documentPath: string;
	documentCount: number;
}

export interface RunQueryParams {
	database: DatabaseTarget;
	query: StructuredQuery;
	pageSize: number;
	startAfter: QueryCursor | null;
}

export interface CountQueryParams {
	database: DatabaseTarget;
	query: StructuredQuery;
}

export type QueryParseResult = { isParsed: true; query: StructuredQuery } | { isParsed: false; reason: string };

export interface QueryValueForm {
	type: QueryValueType;
	text: string;
}

export interface QueryFilterForm {
	fieldPath: string;
	operator: QueryOperator;
	value: QueryValueForm;
	items: QueryValueForm[];
}

export interface QueryOrderForm {
	fieldPath: string;
	direction: QueryDirection;
}

export interface QueryForm {
	targetType: QueryTargetType;
	targetPath: string;
	filters: QueryFilterForm[];
	orders: QueryOrderForm[];
	limitText: string;
}

export interface QueryFormResult {
	query: StructuredQuery | null;
	issues: QueryIssue[];
}
