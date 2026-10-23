import "@angular/compiler";
import { Location } from "@angular/common";
import { type EnvironmentInjector, Injector } from "@angular/core";
import { NavigationEnd, Router } from "@angular/router";
import { describe, expect, test } from "bun:test";
import { Subject } from "rxjs";
import { parseViewState } from "../../../../../src/bun/view-state-parser";
import { TabsStore } from "../../../../../src/mainview/app/core/stores/tabs.store";
import { MAX_TABS } from "../../../../../src/shared/constants/view-state";

function createStore() {
	const events = new Subject<unknown>();
	const navigatedUrls: string[] = [];
	const replacedUrls: string[] = [];
	const router = {
		events,
		navigateByUrl: async (url: string) => {
			navigatedUrls.push(url);
			events.next(new NavigationEnd(navigatedUrls.length, url, url));
			return true;
		},
	};
	const location = { replaceState: (url: string) => replacedUrls.push(url) };
	const injector = Injector.create({
		providers: [{ provide: Router, useValue: router }, { provide: Location, useValue: location }, TabsStore],
	}) as EnvironmentInjector;
	const store = injector.get(TabsStore);
	const navigateInPlace = (url: string) => router.navigateByUrl(url);
	return { store, navigatedUrls, replacedUrls, navigateInPlace };
}

function urlsOf(store: TabsStore): string[] {
	return store.tabs().map((tab) => tab.url);
}

describe("TabsStore", () => {
	test("starts with one start tab that follows navigation", async () => {
		const { store, navigateInPlace } = createStore();
		expect(urlsOf(store)).toEqual(["/"]);
		await navigateInPlace("/tasks");
		expect(urlsOf(store)).toEqual(["/tasks"]);
		expect(store.activeTab().url).toBe("/tasks");
	});

	test("opens new tabs after the active one, in the background or activated", async () => {
		const { store, navigatedUrls, navigateInPlace } = createStore();
		await navigateInPlace("/explorer/a/p/d");
		store.openInNewTab("/explorer/a/p/d/c/users", false);
		expect(urlsOf(store)).toEqual(["/explorer/a/p/d", "/explorer/a/p/d/c/users"]);
		expect(store.activeTab().url).toBe("/explorer/a/p/d");
		store.newTab();
		expect(urlsOf(store)).toEqual(["/explorer/a/p/d", "/", "/explorer/a/p/d/c/users"]);
		expect(store.activeTab().url).toBe("/");
		expect(navigatedUrls.at(-1)).toBe("/");
	});

	test("switches with wrap-around and navigates to each tab's own URL", async () => {
		const { store, navigatedUrls, navigateInPlace } = createStore();
		await navigateInPlace("/tasks");
		store.openInNewTab("/query/a/p/d", true);
		await navigateInPlace("/query/a/p/d/c/users");
		store.activatePrevious();
		expect(store.activeTab().url).toBe("/tasks");
		store.activatePrevious();
		expect(store.activeTab().url).toBe("/query/a/p/d/c/users");
		store.activateNext();
		expect(navigatedUrls.slice(-3)).toEqual(["/tasks", "/query/a/p/d/c/users", "/tasks"]);
		expect(urlsOf(store)).toEqual(["/tasks", "/query/a/p/d/c/users"]);
	});

	test("closing the active tab activates its right neighbour, else its left; the last tab becomes a start tab", async () => {
		const { store, navigateInPlace } = createStore();
		await navigateInPlace("/tasks");
		store.openInNewTab("/a", false);
		store.openInNewTab("/b", false);
		expect(urlsOf(store)).toEqual(["/tasks", "/b", "/a"]);
		store.closeActive();
		expect(store.activeTab().url).toBe("/b");
		const [, last] = store.tabs();
		store.activate(last.id);
		store.closeActive();
		expect(store.activeTab().url).toBe("/b");
		store.close(store.tabs()[0].id);
		expect(urlsOf(store)).toEqual(["/"]);
		expect(store.tabs()[0].id).not.toBe(last.id);
	});

	test("closing a background tab keeps the active one", async () => {
		const { store, navigatedUrls } = createStore();
		store.openInNewTab("/a", false);
		const background = store.tabs()[1];
		const navigationCount = navigatedUrls.length;
		store.close(background.id);
		expect(urlsOf(store)).toEqual(["/"]);
		expect(navigatedUrls.length).toBe(navigationCount);
	});

	test("stops opening tabs at the limit", () => {
		const { store } = createStore();
		for (let index = 1; index < MAX_TABS + 5; index++) {
			store.openInNewTab(`/t${index}`, false);
		}
		expect(store.tabs().length).toBe(MAX_TABS);
		expect(store.canOpenTab()).toBe(false);
	});

	test("restores saved tabs through the main-process check and puts the active URL in the address", async () => {
		const first = createStore();
		await first.navigateInPlace("/explorer/a/p/%28default%29/c/users%2Fdara%2Forders");
		first.store.openInNewTab("/query/a/p/%28default%29", true);
		const saved = parseViewState(
			JSON.parse(
				JSON.stringify({
					tabs: first.store.tabs(),
					activeTabId: first.store.activeTabId(),
					sidebarExpandedIds: [],
					documentView: "table",
					queryPages: [],
				}),
			),
		);

		const second = createStore();
		second.store.restore(saved.tabs, saved.activeTabId);
		expect(second.store.tabs()).toEqual(first.store.tabs());
		expect(second.store.activeTabId()).toBe(first.store.activeTabId());
		expect(second.replacedUrls).toEqual(["/query/a/p/%28default%29"]);

		second.store.restore(saved.tabs, "unknown");
		expect(second.store.activeTabId()).toBe(first.store.activeTabId());
	});
});
