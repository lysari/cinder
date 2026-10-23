import { describe, expect, test } from "bun:test";
import { copyRoute } from "../../../../../src/mainview/app/shared/utils/transfer-route";

const DATABASE = { accountId: "account-1", projectId: "demo-cinder", databaseId: "(default)" };

describe("copyRoute", () => {
	test("names the source as one segment and ends with the operation", () => {
		expect(copyRoute(DATABASE, { type: "collection", collectionPath: "users/dara/orders" }, "rename")).toEqual([
			"/transfer",
			"copy",
			"account-1",
			"demo-cinder",
			"(default)",
			"c",
			"users/dara/orders",
			"rename",
		]);
		expect(copyRoute(DATABASE, { type: "document", documentPath: "users/dara" }, "duplicate")).toEqual([
			"/transfer",
			"copy",
			"account-1",
			"demo-cinder",
			"(default)",
			"d",
			"users/dara",
			"duplicate",
		]);
	});
});
