import { describe, expect, test } from "bun:test";
import { describeQuery, parseRouteQuery } from "../../../../../src/mainview/app/shared/utils/route-query";
import type { StructuredQuery } from "../../../../../src/shared/interfaces/query.interface";

const QUERY: StructuredQuery = {
	target: { type: "collection-group", collectionId: "orders" },
	filters: [{ fieldPath: "total", operator: ">", value: { type: "double", value: 1.5 } }],
	orders: [{ fieldPath: "total", direction: "desc" }],
	limit: 100,
};

describe("parseRouteQuery", () => {
	test("reads a valid query and refuses text that is not one", () => {
		expect(parseRouteQuery(JSON.stringify(QUERY))).toEqual(QUERY);
		expect(parseRouteQuery("{not json")).toBeNull();
		expect(parseRouteQuery(JSON.stringify({ ...QUERY, limit: 0 }))).toBeNull();
	});
});

describe("describeQuery", () => {
	test("names the target, the clause counts and the limit", () => {
		expect(describeQuery(QUERY)).toBe("query on group orders (1 filters, 1 orders, limit 100)");
		expect(describeQuery({ target: { type: "collection", collectionPath: "users" }, filters: [], orders: [], limit: null })).toBe(
			"query on users (0 filters, 0 orders)",
		);
	});
});
