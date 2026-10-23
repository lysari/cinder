import { describe, expect, test } from "bun:test";
import type { StructuredQuery } from "../../../../../src/shared/interfaces/query.interface";
import {
	bulkUpdateCollectionRoute,
	bulkUpdateQueryRoute,
	deleteCollectionRoute,
	deleteQueryRoute,
} from "../../../../../src/mainview/app/shared/utils/bulk-edit-route";
import { parseRouteQuery } from "../../../../../src/mainview/app/shared/utils/route-query";

const DATABASE = { accountId: "account-1", projectId: "demo-cinder", databaseId: "(default)" };
const QUERY: StructuredQuery = {
	target: { type: "collection", collectionPath: "users" },
	filters: [{ fieldPath: "age", operator: ">=", value: { type: "integer", value: "18" } }],
	orders: [],
	limit: 10,
};

describe("bulk edit routes", () => {
	test("pass a collection path as one segment", () => {
		expect(bulkUpdateCollectionRoute(DATABASE, "users/dara/orders")).toEqual([
			"/bulk-edit",
			"update",
			"account-1",
			"demo-cinder",
			"(default)",
			"c",
			"users/dara/orders",
		]);
		expect(deleteCollectionRoute(DATABASE, "users")).toEqual(["/bulk-edit", "delete", "account-1", "demo-cinder", "(default)", "c", "users"]);
	});

	test("pass a query as JSON that the pages read back unchanged", () => {
		const updateCommands = bulkUpdateQueryRoute(DATABASE, QUERY);
		const deleteCommands = deleteQueryRoute(DATABASE, QUERY);
		expect(updateCommands.slice(0, 6)).toEqual(["/bulk-edit", "update", "account-1", "demo-cinder", "(default)", "q"]);
		expect(deleteCommands.slice(0, 6)).toEqual(["/bulk-edit", "delete", "account-1", "demo-cinder", "(default)", "q"]);
		expect(parseRouteQuery(updateCommands[6] as string)).toEqual(QUERY);
	});
});
