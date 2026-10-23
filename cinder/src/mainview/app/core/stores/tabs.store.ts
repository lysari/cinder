import { Location } from "@angular/common";
import { Injectable, computed, inject, signal } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { NavigationEnd, Router } from "@angular/router";
import { filter } from "rxjs";
import { MAX_TABS, START_URL } from "../../../../shared/constants/view-state";
import type { Tab } from "../../../../shared/interfaces/app-state.interface";

@Injectable({ providedIn: "root" })
export class TabsStore {
	private readonly router = inject(Router);
	private readonly location = inject(Location);
	private readonly firstTab: Tab = { id: crypto.randomUUID(), url: START_URL };
	readonly tabs = signal<Tab[]>([this.firstTab]);
	readonly activeTabId = signal(this.firstTab.id);
	readonly activeTab = computed(() => this.tabs().find((tab) => tab.id === this.activeTabId()) ?? this.tabs()[0]);
	readonly canOpenTab = computed(() => this.tabs().length < MAX_TABS);

	constructor() {
		this.router.events
			.pipe(
				filter((event) => event instanceof NavigationEnd),
				takeUntilDestroyed(),
			)
			.subscribe((event) => this.setActiveUrl(event.urlAfterRedirects));
	}

	restore(tabs: Tab[], activeTabId: string): void {
		const activeTab = tabs.find((tab) => tab.id === activeTabId);
		if (!activeTab) {
			return;
		}
		this.tabs.set(tabs);
		this.activeTabId.set(activeTabId);
		this.location.replaceState(activeTab.url);
	}

	newTab(): void {
		this.openInNewTab(START_URL, true);
	}

	openInNewTab(url: string, isActivating: boolean): void {
		if (!this.canOpenTab()) {
			return;
		}
		const tab: Tab = { id: crypto.randomUUID(), url };
		const activeIndex = this.tabs().findIndex(({ id }) => id === this.activeTabId());
		this.tabs.update((tabs) => [...tabs.slice(0, activeIndex + 1), tab, ...tabs.slice(activeIndex + 1)]);
		if (isActivating) {
			this.activate(tab.id);
		}
	}

	activate(tabId: string): void {
		const tab = this.tabs().find(({ id }) => id === tabId);
		if (!tab || tabId === this.activeTabId()) {
			return;
		}
		this.activeTabId.set(tabId);
		void this.router.navigateByUrl(tab.url);
	}

	activateNext(): void {
		this.activateByOffset(1);
	}

	activatePrevious(): void {
		this.activateByOffset(-1);
	}

	close(tabId: string): void {
		const tabs = this.tabs();
		const index = tabs.findIndex(({ id }) => id === tabId);
		if (index === -1) {
			return;
		}
		const remainingTabs = tabs.filter(({ id }) => id !== tabId);
		if (remainingTabs.length === 0) {
			const startTab: Tab = { id: crypto.randomUUID(), url: START_URL };
			this.tabs.set([startTab]);
			this.activeTabId.set(startTab.id);
			void this.router.navigateByUrl(START_URL);
			return;
		}
		this.tabs.set(remainingTabs);
		if (tabId === this.activeTabId()) {
			const nextTab = remainingTabs[Math.min(index, remainingTabs.length - 1)];
			this.activeTabId.set(nextTab.id);
			void this.router.navigateByUrl(nextTab.url);
		}
	}

	closeActive(): void {
		this.close(this.activeTabId());
	}

	private activateByOffset(offset: number): void {
		const tabs = this.tabs();
		const index = tabs.findIndex(({ id }) => id === this.activeTabId());
		this.activate(tabs[(index + offset + tabs.length) % tabs.length].id);
	}

	private setActiveUrl(url: string): void {
		const activeTabId = this.activeTabId();
		if (this.activeTab().url !== url) {
			this.tabs.update((tabs) => tabs.map((tab) => (tab.id === activeTabId ? { ...tab, url } : tab)));
		}
	}
}
