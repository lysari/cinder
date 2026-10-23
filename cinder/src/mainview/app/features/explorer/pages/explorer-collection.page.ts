import { Component, computed, effect, inject, input, signal, untracked } from "@angular/core";
import { Router, RouterLink } from "@angular/router";
import { LucideAngularModule } from "lucide-angular";
import type { DatabaseTarget } from "../../../../../shared/interfaces/account.interface";
import type { FirestoreDocument, FirestoreMapValue } from "../../../../../shared/interfaces/firestore-value.interface";
import { AccountsStore } from "../../../core/stores/accounts.store";
import { documentRoute, addDocumentRoute } from "../../../shared/utils/explorer-route";
import { documentsToReadableJson } from "../../../shared/utils/firestore-value-json";
import { CollectionTableComponent } from "../components/collection-table.component";
import { EmptyStateComponent } from "../components/empty-state.component";
import { ExplorerBreadcrumbComponent } from "../components/explorer-breadcrumb.component";
import { ValueCellComponent } from "../components/value-cell.component";
import { ValueTreeComponent } from "../components/value-tree.component";
import { CollectionStore } from "../stores/collection.store";

type CollectionView = "table" | "tree" | "json";

@Component({
	selector: "app-explorer-collection-page",
	imports: [
		RouterLink,
		LucideAngularModule,
		CollectionTableComponent,
		EmptyStateComponent,
		ExplorerBreadcrumbComponent,
		ValueCellComponent,
		ValueTreeComponent,
	],
	providers: [CollectionStore],
	templateUrl: "./explorer-collection.page.html",
	styleUrl: "./explorer-collection.page.scss",
})
export class ExplorerCollectionPage {
	private readonly router = inject(Router);
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
	protected readonly view = signal<CollectionView>("table");
	protected readonly json = computed(() =>
		this.view() === "json" ? JSON.stringify(documentsToReadableJson(this.store.documents()), null, 2) : "",
	);

	constructor() {
		effect(() => {
			const database = this.database();
			const collectionPath = this.collectionPath();
			untracked(() => void this.store.open(database, collectionPath));
		});
	}

	protected fieldsOf(document: FirestoreDocument): FirestoreMapValue {
		return { type: "map", value: document.fields };
	}

	protected openDocument(documentPath: string): void {
		void this.router.navigate(documentRoute(this.database(), documentPath));
	}
}
