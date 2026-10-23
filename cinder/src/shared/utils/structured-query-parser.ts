import { QUERY_DIRECTIONS, QUERY_OPERATORS, QUERY_TARGET_TYPES, QUERY_VALUE_TYPES } from "../constants/query";
import type { FirestoreValue } from "../interfaces/firestore-value.interface";
import type {
	QueryFilter,
	QueryOrder,
	QueryScalarValue,
	QueryTarget,
	QueryValue,
	StructuredQuery,
} from "../interfaces/query.interface";
import { parseValue } from "./firestore-value-parser";
import { isObject } from "./type-guards";

/** Checks the shape of an untrusted structured query (target, operators, directions, scalar filter values). Run `validateQuery` on the result for Firestore's rules. */
export function parseStructuredQuery(value: unknown): StructuredQuery {
	if (!isObject(value) || !Array.isArray(value.filters) || !Array.isArray(value.orders)) {
		throw new Error("The query needs a target, filters and orders.");
	}
	if (value.limit !== null && typeof value.limit !== "number") {
		throw new Error("The query limit must be a number or null.");
	}
	return {
		target: parseQueryTarget(value.target),
		filters: value.filters.map(parseQueryFilter),
		orders: value.orders.map(parseQueryOrder),
		limit: value.limit,
	};
}

function parseQueryTarget(value: unknown): QueryTarget {
	const type = isObject(value) ? QUERY_TARGET_TYPES.find((candidate) => candidate === value.type) : undefined;
	if (type === "collection" && isObject(value) && typeof value.collectionPath === "string") {
		return { type, collectionPath: value.collectionPath };
	}
	if (type === "collection-group" && isObject(value) && typeof value.collectionId === "string") {
		return { type, collectionId: value.collectionId };
	}
	throw new Error("The query target must be a collection path or a collection group id.");
}

function parseQueryFilter(value: unknown): QueryFilter {
	const operator = isObject(value) ? QUERY_OPERATORS.find((candidate) => candidate === value.operator) : undefined;
	if (!isObject(value) || typeof value.fieldPath !== "string" || !operator) {
		throw new Error("Each filter needs a field path, a known operator and a value.");
	}
	return { fieldPath: value.fieldPath, operator, value: parseQueryValue(value.value) };
}

function parseQueryValue(value: unknown): QueryValue {
	const parsed = parseValue(value, 1);
	if (parsed.type !== "array") {
		return parseQueryScalar(parsed);
	}
	return { type: "array", value: parsed.value.map(parseQueryScalar) };
}

function parseQueryScalar(value: FirestoreValue): QueryScalarValue {
	const isScalar = (candidate: FirestoreValue): candidate is QueryScalarValue =>
		QUERY_VALUE_TYPES.some((type) => type === candidate.type);
	if (!isScalar(value)) {
		throw new Error("A filter value must be a string, integer, double, boolean, null or timestamp, or a list of those.");
	}
	return value;
}

function parseQueryOrder(value: unknown): QueryOrder {
	const direction = isObject(value) ? QUERY_DIRECTIONS.find((candidate) => candidate === value.direction) : undefined;
	if (!isObject(value) || typeof value.fieldPath !== "string" || !direction) {
		throw new Error("Each order needs a field path and the direction asc or desc.");
	}
	return { fieldPath: value.fieldPath, direction };
}
