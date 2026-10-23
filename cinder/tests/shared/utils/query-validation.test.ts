import { describe, expect, test } from "bun:test";
import type { QueryFilter, QueryScalarValue, StructuredQuery } from "../../../src/shared/interfaces/query.interface";
import { validateQuery } from "../../../src/shared/utils/query-validation";

const ONE: QueryScalarValue = { type: "integer", value: "1" };

function queryOf(partial: Partial<StructuredQuery>): StructuredQuery {
	return { target: { type: "collection", collectionPath: "users" }, filters: [], orders: [], limit: null, ...partial };
}

function listOf(count: number): QueryFilter["value"] {
	return { type: "array", value: Array.from({ length: count }, (_, index) => ({ type: "integer", value: String(index) })) };
}

function messagesOf(query: StructuredQuery): string[] {
	return validateQuery(query).map((issue) => issue.message);
}

describe("validateQuery", () => {
	test("accepts a query that Firestore can run", () => {
		const query = queryOf({
			target: { type: "collection-group", collectionId: "orders" },
			filters: [
				{ fieldPath: "address.city", operator: "==", value: { type: "string", value: "Phnom Penh" } },
				{ fieldPath: "total", operator: ">=", value: { type: "double", value: 9.5 } },
				{ fieldPath: "status", operator: "in", value: listOf(30) },
				{ fieldPath: "tags", operator: "array-contains", value: { type: "string", value: "new" } },
				{ fieldPath: "owner", operator: "!=", value: { type: "null" } },
			],
			orders: [
				{ fieldPath: "total", direction: "desc" },
				{ fieldPath: "name", direction: "asc" },
			],
			limit: 2_147_483_647,
		});
		expect(validateQuery(query)).toEqual([]);
	});

	test("checks the collection path or collection group id", () => {
		expect(validateQuery(queryOf({ target: { type: "collection", collectionPath: "users/dara" } }))).toEqual([
			{ section: "target", index: null, message: "Enter a collection path such as users or users/dara/orders." },
		]);
		expect(messagesOf(queryOf({ target: { type: "collection", collectionPath: "" } }))).toHaveLength(1);
		expect(validateQuery(queryOf({ target: { type: "collection-group", collectionId: "a/b" } }))).toEqual([
			{ section: "target", index: null, message: "Enter a collection id without slashes, such as orders." },
		]);
	});

	test("checks field paths of filters and orders", () => {
		const paths = ["", ".a", "a.", "a..b", "a/b", "a*", "a~", "a[0]", "x".repeat(1501)];
		const messages = paths.map((fieldPath) => messagesOf(queryOf({ filters: [{ fieldPath, operator: "==", value: ONE }] }))[0]);
		expect(messages).toEqual([
			"Enter a field path.",
			"A field path cannot start or end with a dot or have two dots in a row.",
			"A field path cannot start or end with a dot or have two dots in a row.",
			"A field path cannot start or end with a dot or have two dots in a row.",
			"A field path cannot contain ~ * / [ or ].",
			"A field path cannot contain ~ * / [ or ].",
			"A field path cannot contain ~ * / [ or ].",
			"A field path cannot contain ~ * / [ or ].",
			"A field path can be at most 1500 bytes long.",
		]);
		expect(validateQuery(queryOf({ orders: [{ fieldPath: "a..b", direction: "asc" }] }))).toEqual([
			{ section: "order", index: 0, message: "A field path cannot start or end with a dot or have two dots in a row." },
		]);
		expect(messagesOf(queryOf({ filters: [{ fieldPath: "名前 with spaces-and-dashes", operator: "==", value: ONE }] }))).toEqual([]);
	});

	test("needs lists for in, not-in and array-contains-any, within their size limits", () => {
		const filtersOf = (operator: QueryFilter["operator"], value: QueryFilter["value"]) =>
			validateQuery(queryOf({ filters: [{ fieldPath: "a", operator: "==", value: ONE }, { fieldPath: "b", operator, value }] }));
		expect(filtersOf("in", ONE)).toEqual([{ section: "filter", index: 1, message: "in needs a list of values." }]);
		expect(filtersOf("in", listOf(0))).toEqual([{ section: "filter", index: 1, message: "Add at least one value." }]);
		expect(filtersOf("in", listOf(31))).toEqual([{ section: "filter", index: 1, message: "in takes at most 30 values." }]);
		expect(filtersOf("array-contains-any", listOf(31))[0]?.message).toBe("array-contains-any takes at most 30 values.");
		expect(filtersOf("not-in", listOf(10))).toEqual([]);
		expect(filtersOf("not-in", listOf(11))[0]?.message).toBe("not-in takes at most 10 values.");
		expect(filtersOf("==", listOf(2))).toEqual([
			{ section: "filter", index: 1, message: "== compares with one value; only in, not-in and array-contains-any take a list." },
		]);
	});

	test("allows null and NaN only with == and !=", () => {
		const nan: QueryScalarValue = { type: "double", value: "NaN" };
		expect(messagesOf(queryOf({ filters: [{ fieldPath: "a", operator: "==", value: { type: "null" } }] }))).toEqual([]);
		expect(messagesOf(queryOf({ filters: [{ fieldPath: "a", operator: "!=", value: nan }] }))).toEqual([]);
		expect(messagesOf(queryOf({ filters: [{ fieldPath: "a", operator: "<", value: { type: "null" } }] }))).toEqual([
			"null and NaN can only be compared with == or !=.",
		]);
		expect(messagesOf(queryOf({ filters: [{ fieldPath: "a", operator: "array-contains", value: nan }] }))).toEqual([
			"null and NaN can only be compared with == or !=.",
		]);
	});

	test("checks values that did not come from the builder", () => {
		const filters: QueryFilter[] = [
			{ fieldPath: "a", operator: "==", value: { type: "integer", value: "9223372036854775808" } },
			{ fieldPath: "b", operator: "==", value: { type: "timestamp", value: { seconds: 253402300800, nanos: 0 } } },
			{ fieldPath: "c", operator: "in", value: { type: "array", value: [{ type: "timestamp", value: { seconds: 0, nanos: 1e9 } }] } },
		];
		expect(validateQuery(queryOf({ filters }))).toEqual([
			{ section: "filter", index: 0, message: "An integer must be a whole number in the 64-bit range." },
			{ section: "filter", index: 1, message: "A timestamp must lie between the years 1 and 9999." },
			{ section: "filter", index: 2, message: "A timestamp must lie between the years 1 and 9999." },
		]);
	});

	test("refuses filter combinations Firestore rejects", () => {
		const list = listOf(2);
		expect(
			validateQuery(
				queryOf({
					filters: [
						{ fieldPath: "a", operator: "array-contains", value: ONE },
						{ fieldPath: "b", operator: "array-contains-any", value: list },
					],
				}),
			),
		).toEqual([{ section: "filter", index: 1, message: "A query can have only one array-contains or array-contains-any filter." }]);
		expect(
			validateQuery(
				queryOf({
					filters: [
						{ fieldPath: "a", operator: "not-in", value: list },
						{ fieldPath: "b", operator: "not-in", value: list },
						{ fieldPath: "c", operator: "!=", value: ONE },
						{ fieldPath: "d", operator: "in", value: list },
					],
				}),
			),
		).toEqual([
			{ section: "filter", index: 1, message: "A query can have only one not-in filter." },
			{ section: "filter", index: 2, message: "!= cannot be combined with not-in." },
			{ section: "filter", index: 3, message: "in cannot be combined with not-in." },
		]);
		expect(
			messagesOf(
				queryOf({
					filters: [
						{ fieldPath: "a", operator: "in", value: list },
						{ fieldPath: "b", operator: "array-contains-any", value: list },
						{ fieldPath: "c", operator: "!=", value: ONE },
						{ fieldPath: "d", operator: "!=", value: ONE },
					],
				}),
			),
		).toEqual([]);
	});

	test("refuses ordering by the same field twice", () => {
		expect(
			validateQuery(
				queryOf({
					orders: [
						{ fieldPath: "a", direction: "asc" },
						{ fieldPath: "b", direction: "asc" },
						{ fieldPath: "a", direction: "desc" },
					],
				}),
			),
		).toEqual([{ section: "order", index: 2, message: "This field is already ordered above." }]);
	});

	test("needs a whole-number limit from 1 to 2147483647", () => {
		for (const limit of [0, -1, 1.5, 2_147_483_648, Number.NaN]) {
			expect(validateQuery(queryOf({ limit }))).toEqual([
				{ section: "limit", index: null, message: "The limit must be a whole number from 1 to 2147483647." },
			]);
		}
		expect(validateQuery(queryOf({ limit: 1 }))).toEqual([]);
	});
});
