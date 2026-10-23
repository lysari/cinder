import { Component, inject, signal } from "@angular/core";
import { Router, RouterLink, RouterLinkActive } from "@angular/router";
import { LucideAngularModule } from "lucide-angular";
import type { AccountSummary, DatabaseTarget } from "../../../../../../shared/interfaces/account.interface";
import { AccountsStore } from "../../../../core/stores/accounts.store";
import { CollectionsStore } from "../../../../core/stores/collections.store";
import { bulkUpdateCollectionRoute, deleteCollectionRoute } from "../../../utils/bulk-edit-route";
import { errorMessage } from "../../../utils/error-message";
import { collectionRoute, databaseRoute } from "../../../utils/explorer-route";
import { queryRoute } from "../../../utils/query-route";
import { type CopyOperation, copyRoute } from "../../../utils/transfer-route";
import { SidebarStore } from "../sidebar.store";

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
	protected readonly store = inject(AccountsStore);
	protected readonly tree = inject(SidebarStore);
	protected readonly collections = inject(CollectionsStore);
	protected readonly accountIcons = ACCOUNT_ICONS;
	protected readonly removalAccountId = signal<string | null>(null);
	protected readonly isRemoving = signal(false);
	protected readonly openMenuKey = signal<string | null>(null);
	protected readonly removalError = signal<string | null>(null);

	constructor() {
		void this.tree.loadExpanded();
	}

	protected databaseLink(database: DatabaseTarget): string[] {
		return databaseRoute(database);
	}

	protected collectionLink(database: DatabaseTarget, collectionId: string): string[] {
		return collectionRoute(database, collectionId);
	}

	protected queryLink(database: DatabaseTarget): string[] {
		return queryRoute(database, null);
	}

	protected bulkUpdateLink(database: DatabaseTarget, collectionId: string): string[] {
		return bulkUpdateCollectionRoute(database, collectionId);
	}

	protected copyLink(database: DatabaseTarget, collectionId: string, operation: CopyOperation): string[] {
		return copyRoute(database, { type: "collection", collectionPath: collectionId }, operation);
	}

	protected deleteLink(database: DatabaseTarget, collectionId: string): string[] {
		return deleteCollectionRoute(database, collectionId);
	}

	protected isCollectionMenuOpen(database: DatabaseTarget, collectionId: string): boolean {
		return this.openMenuKey() === collectionKey(database, collectionId);
	}

	protected toggleCollectionMenu(database: DatabaseTarget, collectionId: string): void {
		const key = collectionKey(database, collectionId);
		this.openMenuKey.set(this.openMenuKey() === key ? null : key);
	}

	protected closeCollectionMenu(): void {
		this.openMenuKey.set(null);
	}

	protected closeCollectionMenuOnBlur(event: FocusEvent): void {
		if (!(event.currentTarget as HTMLElement).contains(event.relatedTarget as Node | null)) {
			this.closeCollectionMenu();
		}
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
}

function collectionKey({ accountId, projectId, databaseId }: DatabaseTarget, collectionId: string): string {
	return JSON.stringify([accountId, projectId, databaseId, collectionId]);
}
