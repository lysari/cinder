import "@angular/compiler";
import { Location } from "@angular/common";
import {
	type EnvironmentInjector,
	Injector,
	ɵChangeDetectionScheduler as ChangeDetectionScheduler,
	ɵEffectScheduler as EffectScheduler,
	ɵINJECTOR_SCOPE as INJECTOR_SCOPE,
} from "@angular/core";
import { Router } from "@angular/router";
import { describe, expect, mock, test } from "bun:test";
import { Subject } from "rxjs";
import type { SavedQueryPage, ViewState } from "../../../../../src/shared/interfaces/app-state.interface";

mock.module("electrobun/view", () => ({ Electroview: class {} }));

const { RpcService } = await import("../../../../../src/mainview/app/core/services/rpc.service");
const { TabsStore } = await import("../../../../../src/mainview/app/core/stores/tabs.store");
const { ViewStateStore } = await import("../../../../../src/mainview/app/core/stores/view-state.store");

const QUERY_PAGE: SavedQueryPage = {
	tabId: "tab-2",
	database: { accountId: "a", projectId: "p", databaseId: "(default)" },
	collectionPath: "users",
	mode: "javascript",
	form: { targetType: "collection", targetPath: "users", filters: [], orders: [], limitText: "100" },
	script: "async function run() {}",
};
const SAVED: ViewState = {
	tabs: [
		{ id: "tab-1", url: "/tasks" },
		{ id: "tab-2", url: "/query/a/p/%28default%29/c/users" },
	],
	activeTabId: "tab-2",
	sidebarExpandedIds: ["a"],
	documentView: "json",
	queryPages: [QUERY_PAGE],
};

function createStores(getViewState: () => Promise<ViewState | null>) {
	const savedStates: ViewState[] = [];
	const rpc = { request: { getViewState }, send: { saveViewState: (state: ViewState) => savedStates.push(state) } };
	const router = { events: new Subject(), navigateByUrl: async () => true };
	const injector = Injector.create({
		providers: [
			{ provide: INJECTOR_SCOPE, useValue: "root" },
			{ provide: RpcService, useValue: rpc },
			{ provide: Router, useValue: router },
			{ provide: Location, useValue: { replaceState: () => undefined } },
			{ provide: ChangeDetectionScheduler, useValue: { notify: () => undefined, runningTick: false } },
			TabsStore,
			ViewStateStore,
		],
	}) as EnvironmentInjector;
	const viewState = injector.get(ViewStateStore);
	const runEffects = () => injector.get(EffectScheduler).flush();
	return { viewState, tabs: injector.get(TabsStore), savedStates, runEffects };
}

describe("ViewStateStore", () => {
	test("restores every saved part and snapshots it back unchanged", async () => {
		const { viewState, tabs } = createStores(async () => structuredClone(SAVED));
		await viewState.restore();
		expect(tabs.activeTab().url).toBe("/query/a/p/%28default%29/c/users");
		expect(viewState.documentView()).toBe("json");
		expect(viewState.snapshot()).toEqual(SAVED);
	});

	test("sends the state only after the restore and only when it changed", async () => {
		const { viewState, savedStates, runEffects } = createStores(async () => structuredClone(SAVED));
		runEffects();
		expect(savedStates).toEqual([]);
		await viewState.restore();
		runEffects();
		expect(savedStates).toEqual([]);
		viewState.documentView.set("tree");
		runEffects();
		runEffects();
		expect(savedStates).toHaveLength(1);
		expect(savedStates[0].documentView).toBe("tree");
	});

	test("drops the query pages of closed tabs from the snapshot", async () => {
		const { viewState, tabs } = createStores(async () => structuredClone(SAVED));
		await viewState.restore();
		tabs.close("tab-2");
		expect(viewState.snapshot().queryPages).toEqual([]);
		expect(viewState.snapshot().tabs.map((tab) => tab.id)).toEqual(["tab-1"]);
	});

	test("starts with defaults when nothing was saved or the request failed", async () => {
		for (const getViewState of [async () => null, async () => Promise.reject(new Error("no answer"))]) {
			const { viewState } = createStores(getViewState);
			await viewState.restore();
			expect(viewState.snapshot()).toMatchObject({ documentView: "table", sidebarExpandedIds: [], queryPages: [] });
			expect(viewState.snapshot().tabs.map((tab) => tab.url)).toEqual(["/"]);
		}
	});
});
