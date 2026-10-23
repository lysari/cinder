import { Component, ElementRef, computed, effect, inject } from "@angular/core";
import { LucideAngularModule } from "lucide-angular";
import type { Tab } from "../../../../../../shared/interfaces/app-state.interface";
import { AccountsStore } from "../../../../core/stores/accounts.store";
import { TabsStore } from "../../../../core/stores/tabs.store";
import { routeContextOf } from "../../../utils/route-context";

const MIDDLE_BUTTON = 1;

interface TabLabel {
	tab: Tab;
	title: string;
	tooltip: string;
}

@Component({
	selector: "app-tab-strip",
	imports: [LucideAngularModule],
	templateUrl: "./tab-strip.component.html",
	styleUrl: "./tab-strip.component.scss",
})
export class TabStripComponent {
	private readonly element = inject(ElementRef<HTMLElement>);
	private readonly accounts = inject(AccountsStore);
	protected readonly tabs = inject(TabsStore);
	protected readonly labels = computed<TabLabel[]>(() =>
		this.tabs.tabs().map((tab) => {
			const { title, database } = routeContextOf(tab.url);
			const location = database ? `${this.accounts.labelOf(database.accountId)} / ${database.projectId} / ${database.databaseId}` : "";
			return { tab, title, tooltip: location ? `${title} — ${location}` : title };
		}),
	);

	constructor() {
		effect(() => {
			const activeTabId = this.tabs.activeTabId();
			requestAnimationFrame(() =>
				this.element.nativeElement.querySelector(`[data-tab-id="${activeTabId}"]`)?.scrollIntoView({ block: "nearest", inline: "nearest" }),
			);
		});
	}

	protected closeOnMiddleClick(event: MouseEvent, tabId: string): void {
		if (event.button === MIDDLE_BUTTON) {
			event.preventDefault();
			this.tabs.close(tabId);
		}
	}

	protected preventAutoscroll(event: MouseEvent): void {
		if (event.button === MIDDLE_BUTTON) {
			event.preventDefault();
		}
	}
}
