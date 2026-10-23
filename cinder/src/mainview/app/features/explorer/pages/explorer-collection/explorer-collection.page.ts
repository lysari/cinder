import { Component, computed, effect, inject, input, untracked } from "@angular/core";
import { RouterLink } from "@angular/router";
import { LucideAngularModule } from "lucide-angular";
import type { DatabaseTarget } from "../../../../../../shared/interfaces/account.interface";
import { AccountsStore } from "../../../../core/stores/accounts.store";
import { ViewStateStore } from "../../../../core/stores/view-state.store";
import { DocumentViewsComponent } from "../../../../shared/components/document-views/document-views.component";
import { ViewSwitcherComponent } from "../../../../shared/components/view-switcher/view-switcher.component";
import { MAX_LIVE_DOCUMENTS } from "../../../../../../shared/constants/browse-session";
import { bulkUpdateCollectionRoute, deleteCollectionRoute } from "../../../../shared/utils/bulk-edit-route";
import { addDocumentRoute } from "../../../../shared/utils/explorer-route";
import { queryRoute } from "../../../../shared/utils/query-route";
import { copyRoute, exportCollectionRoute, importRoute } from "../../../../shared/utils/transfer-route";
import { EmptyStateComponent } from "../../components/empty-state/empty-state.component";
import { ExplorerBreadcrumbComponent } from "../../components/explorer-breadcrumb/explorer-breadcrumb.component";
import { CollectionStore } from "../../stores/collection.store";

@Component({
	selector: "app-explorer-collection-page",
	imports: [
		RouterLink,
		LucideAngularModule,
		DocumentViewsComponent,
		EmptyStateComponent,
		ExplorerBreadcrumbComponent,
		ViewSwitcherComponent,
	],
	providers: [CollectionStore],
	templateUrl: "./explorer-collection.page.html",
	styleUrl: "./explorer-collection.page.scss",
})
export class ExplorerCollectionPage {
	private readonly accounts = inject(AccountsStore);
	protected readonly store = inject(CollectionStore);
	readonly accountId = input.required<string>();
	readonly projectId = input.required<string>();
	readonly databaseId = input.required<string>();
	readonly collectionPath = input.required<string>();
	protected readonly database = computed<DatabaseTarget>(() => ({
		accountId: this.accountId(),
		projectId: this.projectId(),
		databaseId: this.databaseId(),
	}));
	protected readonly accountLabel = computed(() => this.accounts.labelOf(this.accountId()));
	protected readonly addDocumentLink = computed(() => addDocumentRoute(this.database(), this.collectionPath()));
	protected readonly queryLink = computed(() => queryRoute(this.database(), this.collectionPath()));
	protected readonly exportLink = computed(() => exportCollectionRoute(this.database(), this.collectionPath()));
	protected readonly importLink = computed(() => importRoute(this.database(), this.collectionPath()));
	protected readonly bulkUpdateLink = computed(() => bulkUpdateCollectionRoute(this.database(), this.collectionPath()));
	protected readonly copyLink = computed(() => copyRoute(this.database(), { type: "collection", collectionPath: this.collectionPath() }, "copy"));
	protected readonly renameLink = computed(() => copyRoute(this.database(), { type: "collection", collectionPath: this.collectionPath() }, "rename"));
	protected readonly deleteLink = computed(() => deleteCollectionRoute(this.database(), this.collectionPath()));
	protected readonly view = inject(ViewStateStore).documentView;
	protected readonly maxLiveDocuments = MAX_LIVE_DOCUMENTS;
	protected readonly isLiveTooLarge = computed(() => this.store.documents().length > MAX_LIVE_DOCUMENTS);

	constructor() {
		effect(() => {
			const database = this.database();
			const collectionPath = this.collectionPath();
			untracked(() => void this.store.open(database, collectionPath));
		});
	}
}
