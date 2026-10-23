import {
	MAX_FIELD_PATH_BYTES,
	MAX_NANOS,
	MAX_TIMESTAMP_SECONDS,
	MIN_TIMESTAMP_SECONDS,
} from "../constants/firestore-limits";
import { ARRAY_VALUE_OPERATORS, MAX_IN_VALUES, MAX_NOT_IN_VALUES, MAX_QUERY_LIMIT, type QueryOperator } from "../constants/query";
import type { QueryFilter, QueryIssue, QueryScalarValue, StructuredQuery } from "../interfaces/query.interface";
import { isCollectionPath, isIntegerText, isValidId } from "./firestore-validation";

const FORBIDDEN_FIELD_PATH_PATTERN = /[~*/[\]]/;
const ARRAY_MEMBERSHIP_OPERATORS: readonly QueryOperator[] = ["array-contains", "array-contains-any"];
const NULL_AND_NAN_OPERATORS: readonly QueryOperator[] = ["==", "!="];
const textEncoder = new TextEncoder();

/** Lists what keeps a structured query from running in Firestore, each tied to its section and row. An empty list means it can run. */
export function validateQuery(query: StructuredQuery): QueryIssue[] {
	return [
		...targetIssues(query),
		...query.filters.flatMap(filterIssues),
		...combinationIssues(query.filters),
		...orderIssues(query),
		...limitIssues(query),
	];
}

/** Returns why a dotted field path such as "address.city" cannot be used, or null when it can; queries and bulk updates share these rules. */
export function fieldPathError(fieldPath: string): string | null {
	if (fieldPath.length === 0) {
		return "Enter a field path.";
	}
	if (fieldPath.split(".").some((segment) => segment.length === 0)) {
		return "A field path cannot start or end with a dot or have two dots in a row.";
	}
	if (FORBIDDEN_FIELD_PATH_PATTERN.test(fieldPath)) {
		return "A field path cannot contain ~ * / [ or ].";
	}
	return textEncoder.encode(fieldPath).length > MAX_FIELD_PATH_BYTES ? "A field path can be at most 1500 bytes long." : null;
}

function targetIssues({ target }: StructuredQuery): QueryIssue[] {
	if (target.type === "collection") {
		return isCollectionPath(target.collectionPath)
			? []
			: [issue("target", null, "Enter a collection path such as users or users/dara/orders.")];
	}
	return isValidId(target.collectionId) ? [] : [issue("target", null, "Enter a collection id without slashes, such as orders.")];
}

function filterIssues(filter: QueryFilter, index: number): QueryIssue[] {
	const messages: string[] = [];
	const pathError = fieldPathError(filter.fieldPath);
	if (pathError) {
		messages.push(pathError);
	}
	const isArrayOperator = ARRAY_VALUE_OPERATORS.includes(filter.operator);
	if (isArrayOperator && filter.value.type !== "array") {
		messages.push(`${filter.operator} needs a list of values.`);
	}
	if (!isArrayOperator && filter.value.type === "array") {
		messages.push(`${filter.operator} compares with one value; only in, not-in and array-contains-any take a list.`);
	}
	if (isArrayOperator && filter.value.type === "array") {
		const maxValues = filter.operator === "not-in" ? MAX_NOT_IN_VALUES : MAX_IN_VALUES;
		if (filter.value.value.length === 0) {
			messages.push("Add at least one value.");
		} else if (filter.value.value.length > maxValues) {
			messages.push(`${filter.operator} takes at most ${maxValues} values.`);
		}
	}
	const scalars = filter.value.type === "array" ? filter.value.value : [filter.value];
	if (!NULL_AND_NAN_OPERATORS.includes(filter.operator) && filter.value.type !== "array" && isNullOrNaN(filter.value)) {
		messages.push("null and NaN can only be compared with == or !=.");
	}
	messages.push(...scalars.map(scalarError).filter((message) => message !== null));
	return messages.map((message) => issue("filter", index, message));
}

function combinationIssues(filters: QueryFilter[]): QueryIssue[] {
	const issues: QueryIssue[] = [];
	const indexesOf = (operators: readonly QueryOperator[]) =>
		filters.flatMap((filter, index) => (operators.includes(filter.operator) ? [index] : []));
	const membershipIndexes = indexesOf(ARRAY_MEMBERSHIP_OPERATORS);
	for (const index of membershipIndexes.slice(1)) {
		issues.push(issue("filter", index, "A query can have only one array-contains or array-contains-any filter."));
	}
	const notInIndexes = indexesOf(["not-in"]);
	for (const index of notInIndexes.slice(1)) {
		issues.push(issue("filter", index, "A query can have only one not-in filter."));
	}
	if (notInIndexes.length > 0) {
		for (const index of indexesOf(["!="])) {
			issues.push(issue("filter", index, "!= cannot be combined with not-in."));
		}
		for (const index of indexesOf(["in", "array-contains-any"])) {
			issues.push(issue("filter", index, `${filters[index]?.operator} cannot be combined with not-in.`));
		}
	}
	return issues;
}

function orderIssues({ orders }: StructuredQuery): QueryIssue[] {
	return orders.flatMap((order, index) => {
		const pathError = fieldPathError(order.fieldPath);
		if (pathError) {
			return [issue("order", index, pathError)];
		}
		const isDuplicate = orders.slice(0, index).some((earlier) => earlier.fieldPath === order.fieldPath);
		return isDuplicate ? [issue("order", index, "This field is already ordered above.")] : [];
	});
}

function limitIssues({ limit }: StructuredQuery): QueryIssue[] {
	if (limit === null || (Number.isInteger(limit) && limit >= 1 && limit <= MAX_QUERY_LIMIT)) {
		return [];
	}
	return [issue("limit", null, `The limit must be a whole number from 1 to ${MAX_QUERY_LIMIT}.`)];
}

function scalarError(value: QueryScalarValue): string | null {
	switch (value.type) {
		case "integer":
			return isIntegerText(value.value) ? null : "An integer must be a whole number in the 64-bit range.";
		case "double":
			return typeof value.value === "number" && !Number.isFinite(value.value)
				? "A double must be a finite number, NaN, Infinity or -Infinity."
				: null;
		case "timestamp": {
			const { seconds, nanos } = value.value;
			const isInRange =
				Number.isInteger(seconds) &&
				Number.isInteger(nanos) &&
				seconds >= MIN_TIMESTAMP_SECONDS &&
				seconds <= MAX_TIMESTAMP_SECONDS &&
				nanos >= 0 &&
				nanos <= MAX_NANOS;
			return isInRange ? null : "A timestamp must lie between the years 1 and 9999.";
		}
		default:
			return null;
	}
}

function isNullOrNaN(value: QueryScalarValue): boolean {
	return value.type === "null" || (value.type === "double" && value.value === "NaN");
}

function issue(section: QueryIssue["section"], index: number | null, message: string): QueryIssue {
	return { section, index, message };
}
