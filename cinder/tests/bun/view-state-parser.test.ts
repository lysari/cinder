import { describe, expect, test } from "bun:test";
import { parseViewState, parseWindowFrame, tabUrlOfLink } from "../../src/bun/view-state-parser";
import { MAX_TABS } from "../../src/shared/constants/view-state";
import type { ViewState } from "../../src/shared/interfaces/app-state.interface";

const VIEW: ViewState = {
	tabs: [
		{ id: "a1", url: "/" },
		{ id: "b2", url: "/explorer/acc/p/%28default%29/c/users%2Fdara%2Forders" },
	],
	activeTabId: "b2",
	sidebarExpandedIds: ["acc", "acc/p", '["acc","p","(default)"]'],
	documentView: "json",
	queryPages: [
		{
			tabId: "a1",
			database: { accountId: "acc", projectId: "p", databaseId: "(default)" },
			collectionPath: "users",
			mode: "builder",
			form: {
				targetType: "collection-group",
				targetPath: "orders",
				filters: [{ fieldPath: "age", operator: "in", value: { type: "integer", text: "" }, items: [{ type: "integer", text: "1x" }] }],
				orders: [{ fieldPath: "age", direction: "desc" }],
				limitText: "not a number yet",
			},
			script: "",
		},
	],
};

function withChanges(changes: Record<string, unknown>): unknown {
	return { ...structuredClone(VIEW), ...changes };
}

describe("parseViewState", () => {
	test("accepts a full view state, keeping form text the user is still typing", () => {
		expect(parseViewState(structuredClone(VIEW))).toEqual(VIEW);
	});

	test("refuses broken tabs", () => {
		expect(() => parseViewState(withChanges({ tabs: [] }))).toThrow(`1 to ${MAX_TABS} tabs`);
		expect(() => parseViewState(withChanges({ tabs: [{ id: "a1", url: "/" }, { id: "a1", url: "/tasks" }] }))).toThrow("same id");
		expect(() => parseViewState(withChanges({ tabs: [{ id: "a 1", url: "/" }], activeTabId: "a 1" }))).toThrow("letters, digits or dashes");
		expect(() => parseViewState(withChanges({ tabs: [{ id: "a1", url: "https://example.com" }], activeTabId: "a1" }))).toThrow("start with /");
		expect(() => parseViewState(withChanges({ activeTabId: "zz" }))).toThrow("active tab");
	});

	test("refuses unknown values and query pages of closed tabs", () => {
		expect(() => parseViewState(withChanges({ documentView: "grid" }))).toThrow("document view");
		const page = VIEW.queryPages[0];
		expect(() => parseViewState(withChanges({ queryPages: [{ ...page, tabId: "gone" }] }))).toThrow("belong to one of the tabs");
		expect(() => parseViewState(withChanges({ queryPages: [{ ...page, mode: "sql" }] }))).toThrow("mode");
		expect(() => parseViewState(withChanges({ queryPages: [{ ...page, collectionPath: "users/dara" }] }))).toThrow("collection path");
		const badOperator = { ...page.form, filters: [{ ...page.form.filters[0], operator: "like" }] };
		expect(() => parseViewState(withChanges({ queryPages: [{ ...page, form: badOperator }] }))).toThrow("known operator");
		expect(() => parseViewState(withChanges({ sidebarExpandedIds: "acc" }))).toThrow("sidebar rows");
	});
});

describe("parseWindowFrame", () => {
	test("accepts whole numbers within limits and refuses tiny or fractional frames", () => {
		expect(parseWindowFrame({ x: -200, y: 25, width: 1280, height: 800 })).toEqual({ x: -200, y: 25, width: 1280, height: 800 });
		expect(() => parseWindowFrame({ x: 0, y: 0, width: 100, height: 800 })).toThrow("at least");
		expect(() => parseWindowFrame({ x: 0.5, y: 0, width: 1280, height: 800 })).toThrow("whole numbers");
		expect(() => parseWindowFrame(null)).toThrow("object");
	});
});

describe("tabUrlOfLink", () => {
	test("reads the router URL of a Cmd+clicked in-app link", () => {
		const url = "views://mainview/index.html#/explorer/acc/p/%28default%29/c/users%2Fdara";
		expect(tabUrlOfLink({ url, isCmdClick: true, isSPANavigation: false })).toBe("/explorer/acc/p/%28default%29/c/users%2Fdara");
	});

	test("ignores router navigations while Cmd is held, other pages and other origins", () => {
		expect(tabUrlOfLink({ url: "views://mainview/index.html#/tasks", isCmdClick: true, isSPANavigation: true })).toBeNull();
		expect(tabUrlOfLink({ url: "https://example.com/#/tasks", isCmdClick: true })).toBeNull();
		expect(tabUrlOfLink({ url: "views://other/index.html#/tasks", isCmdClick: true })).toBeNull();
		expect(tabUrlOfLink("views://mainview/index.html#/tasks")).toBeNull();
	});
});
