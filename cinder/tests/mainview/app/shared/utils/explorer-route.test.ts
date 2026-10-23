import "@angular/compiler";
import { DefaultUrlSerializer, PRIMARY_OUTLET, UrlSegment, UrlSegmentGroup, UrlTree } from "@angular/router";
import { describe, expect, test } from "bun:test";
import {
	collectionRoute,
	databaseRoute,
	documentRoute,
	addDocumentRoute,
} from "../../../../../src/mainview/app/shared/utils/explorer-route";

const DATABASE = { accountId: "account-1", projectId: "demo-cinder", databaseId: "(default)" };
const serializer = new DefaultUrlSerializer();

function serialize(commands: string[]): string {
	const [absoluteRoot, ...rest] = commands;
	const segments = [absoluteRoot?.replace(/^\//, "") ?? "", ...rest].map((command) => new UrlSegment(command, {}));
	return serializer.serialize(new UrlTree(new UrlSegmentGroup([], { [PRIMARY_OUTLET]: new UrlSegmentGroup(segments, {}) })));
}

function parseSegments(url: string): string[] {
	return serializer.parse(url).root.children[PRIMARY_OUTLET]?.segments.map((segment) => segment.path) ?? [];
}

describe("explorer routes", () => {
	test("put the database target in front of every page", () => {
		expect(databaseRoute(DATABASE)).toEqual(["/explorer", "account-1", "demo-cinder", "(default)"]);
		expect(collectionRoute(DATABASE, "users")).toEqual(["/explorer", "account-1", "demo-cinder", "(default)", "c", "users"]);
		expect(addDocumentRoute(DATABASE, "users")).toEqual([...collectionRoute(DATABASE, "users"), "new"]);
		expect(documentRoute(DATABASE, "users/dara")).toEqual(["/explorer", "account-1", "demo-cinder", "(default)", "d", "users/dara"]);
	});

	test("encode a nested path as one URL segment that the router reads back unchanged", () => {
		const documentPath = "users/a b;c=1?x#y%z/orders/ភ្នំពេញ(1)";
		const url = serialize(documentRoute(DATABASE, documentPath));
		expect(url).toBe(
			"/explorer/account-1/demo-cinder/%28default%29/d/users%2Fa%20b%3Bc%3D1%3Fx%23y%25z%2Forders%2F%E1%9E%97%E1%9F%92%E1%9E%93%E1%9F%86%E1%9E%96%E1%9F%81%E1%9E%89%281%29",
		);
		expect(parseSegments(url)).toEqual(["explorer", "account-1", "demo-cinder", "(default)", "d", documentPath]);
	});
});
