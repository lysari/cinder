import { describe, expect, test } from "bun:test";
import type { QueryForm, StructuredQuery } from "../../../../../src/shared/interfaces/query.interface";
import { queryFormFromQuery, readQueryForm } from "../../../../../src/mainview/app/shared/utils/query-form";

const QUERY: StructuredQuery = {
	target: { type: "collection-group", collectionId: "orders" },
	filters: [
		{ fieldPath: "total", operator: ">=", value: { type: "double", value: 9.5 } },
		{ fieldPath: "count", operator: "<", value: { type: "integer", value: "9007199254740993" } },
		{ fieldPath: "paid", operator: "==", value: { type: "boolean", value: false } },
		{ fieldPath: "note", operator: "==", value: { type: "null" } },
		{ fieldPath: "at", operator: ">", value: { type: "timestamp", value: { seconds: 1700000000, nanos: 123456789 } } },
		{
			fieldPath: "status",
			operator: "in",
			value: { type: "array", value: [{ type: "string", value: "new" }, { type: "double", value: 2 }, { type: "boolean", value: true }] },
		},
	],
	orders: [{ fieldPath: "total", direction: "desc" }],
	limit: 25,
};

function formOf(partial: Partial<QueryForm>): QueryForm {
	return { targetType: "collection", targetPath: "users", filters: [], orders: [], limitText: "", ...partial };
}

describe("query form", () => {
	test("turns a query into form values and reads the same query back", () => {
		const form = queryFormFromQuery(QUERY);
		expect(form.targetType).toBe("collection-group");
		expect(form.targetPath).toBe("orders");
		expect(form.filters[0]?.value).toEqual({ type: "double", text: "9.5" });
		expect(form.filters[2]?.value).toEqual({ type: "boolean", text: "false" });
		expect(form.filters[3]?.value).toEqual({ type: "null", text: "" });
		expect(form.filters[4]?.value).toEqual({ type: "timestamp", text: "2023-11-14T22:13:20.123456789Z" });
		expect(form.filters[5]?.items).toEqual([
			{ type: "string", text: "new" },
			{ type: "double", text: "2" },
			{ type: "boolean", text: "true" },
		]);
		expect(form.limitText).toBe("25");
		expect(readQueryForm(form)).toEqual({ query: QUERY, issues: [] });
	});

	test("reads digits of any script and an empty limit as no limit", () => {
		const form = formOf({
			filters: [{ fieldPath: "age", operator: ">", value: { type: "integer", text: "១៨" }, items: [] }],
			limitText: "  ",
		});
		expect(readQueryForm(form).query).toEqual({
			target: { type: "collection", collectionPath: "users" },
			filters: [{ fieldPath: "age", operator: ">", value: { type: "integer", value: "18" } }],
			orders: [],
			limit: null,
		});
		expect(readQueryForm(formOf({ limitText: "៥០" })).query?.limit).toBe(50);
	});

	test("reports values typed wrong per filter row and value, and returns no query", () => {
		const form = formOf({
			filters: [
				{ fieldPath: "age", operator: "==", value: { type: "integer", text: "eighteen" }, items: [] },
				{
					fieldPath: "at",
					operator: "in",
					value: { type: "integer", text: "ignored" },
					items: [
						{ type: "timestamp", text: "2026-10-23T07:05:00Z" },
						{ type: "timestamp", text: "yesterday" },
					],
				},
			],
			limitText: "ten",
		});
		expect(readQueryForm(form)).toEqual({
			query: null,
			issues: [
				{ section: "filter", index: 0, message: "Enter a whole number from -9223372036854775808 to 9223372036854775807." },
				{
					section: "filter",
					index: 1,
					message: "Value 2: Enter a date and time from the years 1 to 9999 with its offset, such as 2026-10-23T07:05:00Z.",
				},
				{ section: "limit", index: null, message: "Enter a whole number, or leave the limit empty for no limit." },
			],
		});
	});

	test("adds the shared validator's issues to a readable query", () => {
		const result = readQueryForm(
			formOf({
				targetPath: "users/dara",
				filters: [{ fieldPath: "tags", operator: "in", value: { type: "string", text: "" }, items: [] }],
			}),
		);
		expect(result.query?.target).toEqual({ type: "collection", collectionPath: "users/dara" });
		expect(result.issues.map((issue) => issue.message)).toEqual([
			"Enter a collection path such as users or users/dara/orders.",
			"Add at least one value.",
		]);
	});
});
