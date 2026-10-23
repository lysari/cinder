import { Component, DestroyRef, ElementRef, afterNextRender, computed, inject, output, signal, viewChild } from "@angular/core";
import { Router } from "@angular/router";
import { LucideAngularModule } from "lucide-angular";
import type { DatabaseTarget } from "../../../../../../shared/interfaces/account.interface";
import { AccountsStore } from "../../../../core/stores/accounts.store";
import { CollectionsStore } from "../../../../core/stores/collections.store";
import { TabsStore } from "../../../../core/stores/tabs.store";
import { collectionRoute, databaseRoute } from "../../../utils/explorer-route";
import { rankByFuzzyScore } from "../../../utils/fuzzy-match";
import { queryRoute } from "../../../utils/query-route";
import { routeContextOf } from "../../../utils/route-context";
import { exportCollectionRoute, importRoute } from "../../../utils/transfer-route";
import { SidebarStore } from "../sidebar.store";

const MAX_ITEMS_PER_GROUP = 8;

type PaletteGroupName = "Accounts" | "Projects" | "Databases" | "Collections" | "Tabs" | "Actions";

interface PaletteItem {
	id: string;
	group: PaletteGroupName;
	label: string;
	detail: string;
	isClosing: boolean;
	choose: () => unknown;
}

interface PaletteGroup {
	name: PaletteGroupName;
	items: PaletteItem[];
}

@Component({
	selector: "app-command-palette",
	imports: [LucideAngularModule],
	templateUrl: "./command-palette.component.html",
	styleUrl: "./command-palette.component.scss",
})
export class CommandPaletteComponent {
	private readonly router = inject(Router);
	private readonly accounts = inject(AccountsStore);
	private readonly collections = inject(CollectionsStore);
	private readonly tabs = inject(TabsStore);
	private readonly tree = inject(SidebarStore);
	private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>("dialog");
	private readonly input = viewChild.required<ElementRef<HTMLInputElement>>("input");
	private readonly previousFocus = document.activeElement as HTMLElement | null;
	readonly closed = output<void>();
	protected readonly optionId = optionId;
	protected readonly query = signal("");
	protected readonly activeIndex = signal(0);
	protected readonly groups = computed<PaletteGroup[]>(() => {
		const query = this.query();
		const items = [...this.locationItems(), ...this.tabItems(), ...this.actionItems()];
		const groupNames: PaletteGroupName[] = ["Accounts", "Projects", "Databases", "Collections", "Tabs", "Actions"];
		return groupNames
			.map((name) => ({
				name,
				items: rankByFuzzyScore(
					items.filter((item) => item.group === name),
					query,
					(item) => `${item.label} ${item.detail}`,
				).slice(0, MAX_ITEMS_PER_GROUP),
			}))
			.filter((group) => group.items.length > 0);
	});
	protected readonly options = computed(() => this.groups().flatMap((group) => group.items));
	protected readonly activeOptionId = computed(() => (this.options().length > 0 ? optionId(this.activeIndex()) : null));

	constructor() {
		afterNextRender(() => {
			this.dialog().nativeElement.showModal();
			this.input().nativeElement.focus();
		});
		inject(DestroyRef).onDestroy(() => this.previousFocus?.focus());
	}

	protected indexOf(item: PaletteItem): number {
		return this.options().indexOf(item);
	}

	protected search(text: string): void {
		this.query.set(text);
		this.activeIndex.set(0);
	}

	protected handleKey(event: KeyboardEvent): void {
		const count = this.options().length;
		switch (event.key) {
			case "ArrowDown":
				event.preventDefault();
				this.moveActive(1, count);
				break;
			case "ArrowUp":
				event.preventDefault();
				this.moveActive(-1, count);
				break;
			case "Enter":
				event.preventDefault();
				this.choose(this.options()[this.activeIndex()]);
				break;
			case "Tab":
				event.preventDefault();
				break;
		}
	}

	protected choose(item: PaletteItem | undefined): void {
		if (!item) {
			return;
		}
		void item.choose();
		if (item.isClosing) {
			this.close();
		} else {
			this.search("");
		}
	}

	protected close(): void {
		this.dialog().nativeElement.close();
		this.closed.emit();
	}

	private moveActive(offset: number, count: number): void {
		if (count === 0) {
			return;
		}
		const index = (this.activeIndex() + offset + count) % count;
		this.activeIndex.set(index);
		document.getElementById(optionId(index))?.scrollIntoView({ block: "nearest" });
	}

	private locationItems(): PaletteItem[] {
		const accounts = this.accounts.accounts();
		if (accounts.status !== "loaded") {
			return [];
		}
		return accounts.value.flatMap((account) => {
			const accountItem: PaletteItem = {
				id: `account:${account.id}`,
				group: "Accounts",
				label: account.label,
				detail: "Show its projects",
				isClosing: false,
				choose: () => this.tree.expandAccount(account.id),
			};
			const projects = this.accounts.projectsOf(account.id);
			const projectItems = projects?.status === "loaded" ? projects.value : [];
			return [
				accountItem,
				...projectItems.flatMap(({ projectId, displayName }) => {
					const projectItem: PaletteItem = {
						id: `project:${account.id}/${projectId}`,
						group: "Projects",
						label: displayName,
						detail: `${projectId} · ${account.label}`,
						isClosing: false,
						choose: () => this.tree.expandProject(account.id, projectId),
					};
					const databases = this.accounts.databasesOf(account.id, projectId);
					const databaseIds = databases?.status === "loaded" ? databases.value.databaseIds : [];
					return [
						projectItem,
						...databaseIds.flatMap((databaseId) =>
							this.databaseItems({ accountId: account.id, projectId, databaseId }, account.label),
						),
					];
				}),
			];
		});
	}

	private databaseItems(database: DatabaseTarget, accountLabel: string): PaletteItem[] {
		const location = `${database.projectId} / ${database.databaseId}`;
		const databaseItem: PaletteItem = {
			id: `database:${JSON.stringify(database)}`,
			group: "Databases",
			label: location,
			detail: accountLabel,
			isClosing: true,
			choose: () => {
				void this.tree.expandDatabase(database);
				return this.router.navigate(databaseRoute(database));
			},
		};
		const collectionIds = this.collections.rootCollectionsOf(database);
		const collectionItems: PaletteItem[] = (collectionIds?.status === "loaded" ? collectionIds.value : []).map((collectionId) => ({
			id: `collection:${JSON.stringify(database)}/${collectionId}`,
			group: "Collections",
			label: collectionId,
			detail: location,
			isClosing: true,
			choose: () => this.router.navigate(collectionRoute(database, collectionId)),
		}));
		return [databaseItem, ...collectionItems];
	}

	private tabItems(): PaletteItem[] {
		return this.tabs.tabs().map((tab) => ({
			id: `tab:${tab.id}`,
			group: "Tabs",
			label: routeContextOf(tab.url).title,
			detail: tab.id === this.tabs.activeTabId() ? "Current tab" : "Switch to tab",
			isClosing: true,
			choose: () => this.tabs.activate(tab.id),
		}));
	}

	private actionItems(): PaletteItem[] {
		const { database, collectionPath } = routeContextOf(this.tabs.activeTab().url);
		const items: PaletteItem[] = [];
		if (database) {
			items.push({
				id: "action:new-query",
				group: "Actions",
				label: "New query",
				detail: `${database.projectId} / ${database.databaseId}`,
				isClosing: true,
				choose: () => this.router.navigate(queryRoute(database, collectionPath)),
			});
		}
		if (database && collectionPath !== null) {
			items.push({
				id: "action:export",
				group: "Actions",
				label: "Export collection",
				detail: collectionPath,
				isClosing: true,
				choose: () => this.router.navigate(exportCollectionRoute(database, collectionPath)),
			});
			items.push({
				id: "action:import",
				group: "Actions",
				label: "Import into collection",
				detail: collectionPath,
				isClosing: true,
				choose: () => this.router.navigate(importRoute(database, collectionPath)),
			});
		}
		items.push({
			id: "action:add-account",
			group: "Actions",
			label: "Add account",
			detail: "Emulator, service account or Google account",
			isClosing: true,
			choose: () => this.router.navigate(["/accounts/new"]),
		});
		items.push({
			id: "action:tasks",
			group: "Actions",
			label: "Show tasks",
			detail: "Running and finished tasks",
			isClosing: true,
			choose: () => this.router.navigate(["/tasks"]),
		});
		items.push({
			id: "action:new-tab",
			group: "Actions",
			label: "New tab",
			detail: "⌘T",
			isClosing: true,
			choose: () => this.tabs.newTab(),
		});
		items.push({
			id: "action:close-tab",
			group: "Actions",
			label: "Close tab",
			detail: "⌘W",
			isClosing: true,
			choose: () => this.tabs.closeActive(),
		});
		return items;
	}
}

function optionId(index: number): string {
	return `command-palette-option-${index}`;
}
