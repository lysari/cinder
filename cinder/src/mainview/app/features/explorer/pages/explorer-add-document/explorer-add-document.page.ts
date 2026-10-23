import { Component, computed, inject, input } from "@angular/core";
import { Router, RouterLink } from "@angular/router";
import type { DatabaseTarget } from "../../../../../../shared/interfaces/account.interface";
import { AccountsStore } from "../../../../core/stores/accounts.store";
import { ValueEditorComponent } from "../../../../shared/components/value-editor/value-editor.component";
import type { ValueDraft } from "../../../../shared/interfaces/value-draft.interface";
import { collectionRoute, documentRoute } from "../../../../shared/utils/explorer-route";
import { ExplorerBreadcrumbComponent } from "../../components/explorer-breadcrumb/explorer-breadcrumb.component";
import { AddDocumentStore } from "../../stores/add-document.store";

@Component({
	selector: "app-explorer-add-document-page",
	imports: [RouterLink, ExplorerBreadcrumbComponent, ValueEditorComponent],
	providers: [AddDocumentStore],
	templateUrl: "./explorer-add-document.page.html",
	styleUrl: "./explorer-add-document.page.scss",
})
export class ExplorerAddDocumentPage {
	private readonly router = inject(Router);
	private readonly accounts = inject(AccountsStore);
	protected readonly store = inject(AddDocumentStore);
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
	protected readonly collectionLink = computed(() => collectionRoute(this.database(), this.collectionPath()));
	protected readonly rootDraft = computed<ValueDraft>(() => ({ type: "map", fields: this.store.fieldDrafts() }));

	protected setAutoId(isAutoId: boolean): void {
		this.store.isAutoId.set(isAutoId);
	}

	protected setDocumentId(event: Event): void {
		this.store.documentId.set((event.target as HTMLInputElement).value);
	}

	protected updateFields(draft: ValueDraft): void {
		if (draft.type === "map") {
			this.store.fieldDrafts.set(draft.fields);
		}
	}

	protected async create(event: Event): Promise<void> {
		event.preventDefault();
		const document = await this.store.create(this.database(), this.collectionPath());
		if (document) {
			await this.router.navigate(documentRoute(this.database(), document.path));
		}
	}
}
