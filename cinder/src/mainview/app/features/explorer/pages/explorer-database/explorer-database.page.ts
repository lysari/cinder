import { Component, computed, effect, inject, input, untracked } from "@angular/core";
import { RouterLink } from "@angular/router";
import { LucideAngularModule } from "lucide-angular";
import type { DatabaseTarget } from "../../../../../../shared/interfaces/account.interface";
import { AccountsStore } from "../../../../core/stores/accounts.store";
import { CollectionsStore } from "../../../../core/stores/collections.store";
import { collectionRoute } from "../../../../shared/utils/explorer-route";
import { importRoute } from "../../../../shared/utils/transfer-route";
import { EmptyStateComponent } from "../../components/empty-state/empty-state.component";
import { ExplorerBreadcrumbComponent } from "../../components/explorer-breadcrumb/explorer-breadcrumb.component";

@Component({
	selector: "app-explorer-database-page",
	imports: [RouterLink, LucideAngularModule, EmptyStateComponent, ExplorerBreadcrumbComponent],
	templateUrl: "./explorer-database.page.html",
	styleUrl: "./explorer-database.page.scss",
})
export class ExplorerDatabasePage {
	private readonly accounts = inject(AccountsStore);
	protected readonly collections = inject(CollectionsStore);
	readonly accountId = input.required<string>();
	readonly projectId = input.required<string>();
	readonly databaseId = input.required<string>();
	protected readonly database = computed<DatabaseTarget>(() => ({
		accountId: this.accountId(),
		projectId: this.projectId(),
		databaseId: this.databaseId(),
	}));
	protected readonly accountLabel = computed(() => this.accounts.labelOf(this.accountId()));
	protected readonly rootCollections = computed(() => this.collections.rootCollectionsOf(this.database()));
	protected readonly importLink = computed(() => importRoute(this.database(), null));

	constructor() {
		effect(() => {
			const database = this.database();
			untracked(() => void this.collections.loadRootCollections(database));
		});
	}

	protected collectionLink(collectionId: string): string[] {
		return collectionRoute(this.database(), collectionId);
	}
}
