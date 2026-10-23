import type { StructuredQuery } from "../../../../shared/interfaces/query.interface";
import { validateQuery } from "../../../../shared/utils/query-validation";
import { parseStructuredQuery } from "../../../../shared/utils/structured-query-parser";

/** Reads a builder query that a route carries as JSON in one URL segment; returns null unless it parses and passes `validateQuery`. */
export function parseRouteQuery(text: string): StructuredQuery | null {
	try {
		const query = parseStructuredQuery(JSON.parse(text));
		return validateQuery(query).length === 0 ? query : null;
	} catch {
		return null;
	}
}

/** Describes a structured query in one line for a page or task title, e.g. "query on users (2 filters, 1 orders, limit 100)". */
export function describeQuery({ target, filters, orders, limit }: StructuredQuery): string {
	const targetText = target.type === "collection" ? target.collectionPath : `group ${target.collectionId}`;
	const limitText = limit === null ? "" : `, limit ${limit}`;
	return `query on ${targetText} (${filters.length} filters, ${orders.length} orders${limitText})`;
}
