import { describe, expect, test } from "bun:test";
import type { CopyTaskRequest } from "../../../src/shared/interfaces/copy.interface";
import { copyRequestError, isSameDatabase } from "../../../src/shared/utils/copy-validation";

const DATABASE = { accountId: "a", projectId: "p", databaseId: "(default)" };

function request(changes: Partial<CopyTaskRequest>): CopyTaskRequest {
	return {
		type: "copy",
		database: DATABASE,
		source: { type: "document", documentPath: "users/dara" },
		destination: { database: DATABASE, path: "users/dara-copy" },
		isMove: false,
		isRecursive: true,
		writeMode: "overwrite",
		isRewritingReferences: false,
		...changes,
	};
}

describe("copyRequestError", () => {
	test("accepts a copy next to the source or the same path in another database", () => {
		expect(copyRequestError(request({}))).toBeNull();
		expect(copyRequestError(request({ destination: { database: { ...DATABASE, databaseId: "other" }, path: "users/dara" }, isMove: true }))).toBeNull();
	});

	test("refuses a document copied inside itself with its subcollections, and any move into itself", () => {
		const inside = { database: DATABASE, path: "users/dara/copies/dara" };
		expect(copyRequestError(request({ destination: inside }))).toContain("The destination lies inside the source");
		expect(copyRequestError(request({ destination: inside, isRecursive: false }))).toBeNull();
		expect(copyRequestError(request({ destination: inside, isRecursive: false, isMove: true }))).toContain("Nothing can be moved into itself");
	});

	test("does not mistake a sibling with the same prefix for the source's subtree", () => {
		expect(copyRequestError(request({ source: { type: "collection", collectionPath: "users" }, destination: { database: DATABASE, path: "users2" }, isMove: true }))).toBeNull();
	});
});

describe("isSameDatabase", () => {
	test("compares account, project and database", () => {
		expect(isSameDatabase(DATABASE, { ...DATABASE })).toBe(true);
		expect(isSameDatabase(DATABASE, { ...DATABASE, accountId: "b" })).toBe(false);
	});
});
