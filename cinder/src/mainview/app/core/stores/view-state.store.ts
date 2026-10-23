import { Injectable, computed, effect, inject, signal } from "@angular/core";
import type { DocumentView } from "../../../../shared/constants/document-view";
import type { SavedQueryPage, ViewState } from "../../../../shared/interfaces/app-state.interface";
import { load } from "../../shared/utils/load";
import { RpcService } from "../services/rpc.service";
import { TabsStore } from "./tabs.store";

@Injectable({ providedIn: "root" })
export class ViewStateStore {
	private readonly rpc = inject(RpcService);
	private readonly tabs = inject(TabsStore);
	private readonly isRestored = signal(false);
	private savedText = "";
	readonly documentView = signal<DocumentView>("table");
	readonly sidebarExpandedIds = signal<string[]>([]);
	readonly queryPages = signal<SavedQueryPage[]>([]);
	readonly snapshot = computed<ViewState>(() => {
		const tabs = this.tabs.tabs();
		const tabIds = new Set(tabs.map((tab) => tab.id));
		return {
			tabs,
			activeTabId: this.tabs.activeTabId(),
			sidebarExpandedIds: this.sidebarExpandedIds(),
			documentView: this.documentView(),
			queryPages: this.queryPages().filter((page) => tabIds.has(page.tabId)),
		};
	});

	constructor() {
		effect(() => {
			const snapshot = this.snapshot();
			const text = JSON.stringify(snapshot);
			if (this.isRestored() && text !== this.savedText) {
				this.savedText = text;
				this.rpc.send.saveViewState(snapshot);
			}
		});
	}

	async restore(): Promise<void> {
		const saved = await load(() => this.rpc.request.getViewState());
		if (saved.status === "loaded" && saved.value) {
			const { tabs, activeTabId, sidebarExpandedIds, documentView, queryPages } = saved.value;
			this.tabs.restore(tabs, activeTabId);
			this.sidebarExpandedIds.set(sidebarExpandedIds);
			this.documentView.set(documentView);
			this.queryPages.set(queryPages);
		}
		this.savedText = JSON.stringify(this.snapshot());
		this.isRestored.set(true);
	}
}
