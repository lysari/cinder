import "@angular/compiler";
import { describe, expect, test } from "bun:test";
import { routeContextOf } from "../../../../../src/mainview/app/shared/utils/route-context";

const DATABASE = { accountId: "acc", projectId: "demo-cinder", databaseId: "(default)" };

describe("routeContextOf", () => {
	test("titles the pages without a database", () => {
		expect(routeContextOf("/")).toEqual({ title: "Start", database: null, collectionPath: null });
		expect(routeContextOf("/tasks?task=t1").title).toBe("Tasks");
		expect(routeContextOf("/accounts/new").title).toBe("Add account");
	});

	test("decodes explorer paths and names the database and collection", () => {
		expect(routeContextOf("/explorer/acc/demo-cinder/%28default%29")).toEqual({ title: "demo-cinder / (default)", database: DATABASE, collectionPath: null });
		expect(routeContextOf("/explorer/acc/demo-cinder/%28default%29/c/users%2Fdara%2Forders")).toEqual({
			title: "users/dara/orders",
			database: DATABASE,
			collectionPath: "users/dara/orders",
		});
		expect(routeContextOf("/explorer/acc/demo-cinder/%28default%29/c/users/new").title).toBe("New document in users");
		expect(routeContextOf("/explorer/acc/demo-cinder/%28default%29/d/users%2Fdara")).toEqual({ title: "users/dara", database: DATABASE, collectionPath: null });
	});

	test("titles query, transfer and bulk edit pages", () => {
		expect(routeContextOf("/query/acc/demo-cinder/%28default%29").title).toBe("Query demo-cinder / (default)");
		expect(routeContextOf("/query/acc/demo-cinder/%28default%29/c/users")).toMatchObject({ title: "Query users", collectionPath: "users" });
		expect(routeContextOf("/transfer/export/acc/demo-cinder/%28default%29/c/users").title).toBe("Export users");
		expect(routeContextOf("/transfer/export/acc/demo-cinder/%28default%29/q/%7B%7D").title).toBe("Export query matches");
		expect(routeContextOf("/transfer/import/acc/demo-cinder/%28default%29").title).toBe("Import into (default)");
		expect(routeContextOf("/transfer/copy/acc/demo-cinder/%28default%29/d/users%2Fdara/duplicate").title).toBe("Duplicate users/dara");
		expect(routeContextOf("/bulk-edit/update/acc/demo-cinder/%28default%29/c/users").title).toBe("Bulk update users");
		expect(routeContextOf("/bulk-edit/delete/acc/demo-cinder/%28default%29/q/%7B%7D")).toMatchObject({ title: "Delete query matches", database: DATABASE });
	});
});
