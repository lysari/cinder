import { Component, inject, signal } from "@angular/core";
import { Router, RouterLink, RouterLinkActive } from "@angular/router";
import { LucideAngularModule } from "lucide-angular";
import type { AccountSummary, DatabaseTarget } from "../../../../../../shared/interfaces/account.interface";
import { AccountsStore } from "../../../../core/stores/accounts.store";
import { CollectionsStore } from "../../../../core/stores/collections.store";
import { errorMessage } from "../../../utils/error-message";
import { collectionRoute, databaseRoute } from "../../../utils/explorer-route";

const ACCOUNT_ICONS: Record<AccountSummary["type"], string> = {
	emulator: "server",
	"service-account": "key-round",
	"google-user": "user-round",
};

@Component({
	selector: "app-sidebar",
	imports: [RouterLink, RouterLinkActive, LucideAngularModule],
	templateUrl: "./sidebar.component.html",
	styleUrl: "./sidebar.component.scss",
})
export class SidebarComponent {
	private readonly router = inject(Router);
	private readonly expandedIds = signal<ReadonlySet<string>>(new Set());
	protected readonly store = inject(AccountsStore);
	protected readonly collections = inject(CollectionsStore);
	protected readonly accountIcons = ACCOUNT_ICONS;
	protected readonly removalAccountId = signal<string | null>(null);
	protected readonly isRemoving = signal(false);
	protected readonly removalError = signal<string | null>(null);

	constructor() {
		void this.store.loadAccounts();
	}

	protected isExpanded(accountId: string): boolean {
		return this.expandedIds().has(accountId);
	}

	protected isProjectExpanded(accountId: string, projectId: string): boolean {
		return this.expandedIds().has(projectKey(accountId, projectId));
	}

	protected toggleAccount(accountId: string): void {
		if (this.toggle(accountId)) {
			void this.store.loadProjects(accountId);
		}
	}

	protected toggleProject(accountId: string, projectId: string): void {
		if (this.toggle(projectKey(accountId, projectId))) {
			void this.store.loadDatabases(accountId, projectId);
		}
	}

	protected isDatabaseExpanded(database: DatabaseTarget): boolean {
		return this.expandedIds().has(databaseKey(database));
	}

	protected toggleDatabase(database: DatabaseTarget): void {
		if (this.toggle(databaseKey(database))) {
			void this.collections.loadRootCollections(database);
		}
	}

	protected expandDatabase(database: DatabaseTarget): void {
		if (!this.isDatabaseExpanded(database)) {
			this.toggleDatabase(database);
		}
	}

	protected databaseLink(database: DatabaseTarget): string[] {
		return databaseRoute(database);
	}

	protected collectionLink(database: DatabaseTarget, collectionId: string): string[] {
		return collectionRoute(database, collectionId);
	}

	protected askToRemove(accountId: string): void {
		this.removalError.set(null);
		this.removalAccountId.set(accountId);
	}

	protected cancelRemoval(): void {
		this.removalAccountId.set(null);
	}

	protected async removeAccount(accountId: string): Promise<void> {
		this.isRemoving.set(true);
		this.removalError.set(null);
		try {
			await this.store.removeAccount(accountId);
			this.removalAccountId.set(null);
			await this.router.navigate(["/"]);
		} catch (error) {
			this.removalError.set(errorMessage(error));
		} finally {
			this.isRemoving.set(false);
		}
	}

	private toggle(id: string): boolean {
		const expandedIds = new Set(this.expandedIds());
		const isExpanding = !expandedIds.delete(id);
		if (isExpanding) {
			expandedIds.add(id);
		}
		this.expandedIds.set(expandedIds);
		return isExpanding;
	}
}

function projectKey(accountId: string, projectId: string): string {
	return `${accountId}/${projectId}`;
}

function databaseKey({ accountId, projectId, databaseId }: DatabaseTarget): string {
	return JSON.stringify([accountId, projectId, databaseId]);
}
