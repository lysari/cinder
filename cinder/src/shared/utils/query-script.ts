import type { QueryScalarValue, QueryValue, StructuredQuery } from "../interfaces/query.interface";

const INDENT = "  ";
const MILLIS_PER_SECOND = 1000;
const NANOS_PER_MILLI = 1_000_000;
const MAX_PLAIN_WHOLE_DOUBLE = 1e21;

/** Writes a structured query as a run-script program that runs it and returns the snapshot. Read it back with `parseQueryScript`. */
export function generateQueryScript(query: StructuredQuery): string {
	const source =
		query.target.type === "collection"
			? `db.collection(${stringLiteral(query.target.collectionPath)})`
			: `db.collectionGroup(${stringLiteral(query.target.collectionId)})`;
	const clauses = [
		...query.filters.map(
			(filter) => `.where(${stringLiteral(filter.fieldPath)}, ${stringLiteral(filter.operator)}, ${valueLiteral(filter.value)})`,
		),
		...query.orders.map((order) => `.orderBy(${stringLiteral(order.fieldPath)}, ${stringLiteral(order.direction)})`),
		...(query.limit === null ? [] : [`.limit(${query.limit})`]),
		".get();",
	];
	return [
		"async function run() {",
		`${INDENT}const query = await ${source}`,
		...clauses.map((clause) => `${INDENT}${INDENT}${clause}`),
		`${INDENT}return query;`,
		"}",
		"",
	].join("\n");
}

function stringLiteral(text: string): string {
	return JSON.stringify(text);
}

function valueLiteral(value: QueryValue): string {
	if (value.type === "array") {
		return `[${value.value.map(scalarLiteral).join(", ")}]`;
	}
	return scalarLiteral(value);
}

function scalarLiteral(value: QueryScalarValue): string {
	switch (value.type) {
		case "string":
			return stringLiteral(value.value);
		case "integer":
			return Number.isSafeInteger(Number(value.value)) ? value.value : `${value.value}n`;
		case "double":
			return doubleLiteral(value.value);
		case "boolean":
			return String(value.value);
		case "null":
			return "null";
		case "timestamp": {
			const { seconds, nanos } = value.value;
			return nanos % NANOS_PER_MILLI === 0
				? `admin.firestore.Timestamp.fromMillis(${seconds * MILLIS_PER_SECOND + nanos / NANOS_PER_MILLI})`
				: `new admin.firestore.Timestamp(${seconds}, ${nanos})`;
		}
	}
}

function doubleLiteral(value: number | "NaN" | "Infinity" | "-Infinity"): string {
	if (typeof value === "string") {
		return value;
	}
	if (Object.is(value, -0)) {
		return "-0.0";
	}
	return Number.isInteger(value) && Math.abs(value) < MAX_PLAIN_WHOLE_DOUBLE ? value.toFixed(1) : String(value);
}
