import { describe, expect, test } from "bun:test";
import { queryRoute } from "../../../../../src/mainview/app/shared/utils/query-route";

const DATABASE = { accountId: "account-1", projectId: "demo-cinder", databaseId: "(default)" };

describe("queryRoute", () => {
	test("opens the query page of a database, or starts it on a collection given as one segment", () => {
		expect(queryRoute(DATABASE, null)).toEqual(["/query", "account-1", "demo-cinder", "(default)"]);
		expect(queryRoute(DATABASE, "users/dara/orders")).toEqual(["/query", "account-1", "demo-cinder", "(default)", "c", "users/dara/orders"]);
	});
});
