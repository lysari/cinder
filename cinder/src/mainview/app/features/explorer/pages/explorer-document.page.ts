import { Component, DestroyRef, computed, effect, inject, input, signal, untracked } from "@angular/core";
import { Router, RouterLink } from "@angular/router";
import { LucideAngularModule } from "lucide-angular";
import type { DatabaseTarget } from "../../../../../shared/interfaces/account.interface";
import { parentPath } from "../../../../../shared/utils/firestore-path";
import { formatTimestampUtc } from "../../../../../shared/utils/firestore-timestamp";
import { AccountsStore } from "../../../core/stores/accounts.store";
import { ValueEditorComponent } from "../../../shared/components/value-editor.component";
import type { ValueDraft } from "../../../shared/interfaces/value-draft.interface";
import { collectionRoute } from "../../../shared/utils/explorer-route";
import { formatTimestampLocal } from "../../../shared/utils/firestore-value-format";
import { copyRoute, exportDocumentRoute } from "../../../shared/utils/transfer-route";
import { ExplorerBreadcrumbComponent } from "../components/explorer-breadcrumb.component";
import { DocumentStore } from "../stores/document.store";

const COPIED_NOTICE_MS = 1500;

@Component({
	selector: "app-explorer-document-page",
	imports: [RouterLink, LucideAngularModule, ExplorerBreadcrumbComponent, ValueEditorComponent],
	providers: [DocumentStore],
	templateUrl: "./explorer-document.page.html",
	styleUrl: "./explorer-document.page.scss",
})
export class ExplorerDocumentPage {
	private readonly router = inject(Router);
	private readonly accounts = inject(AccountsStore);
	private copiedTimer: ReturnType<typeof setTimeout> | undefined;
	protected readonly store = inject(DocumentStore);
	readonly accountId = input.required<string>();
	readonly projectId = input.required<string>();
	readonly databaseId = input.required<string>();
	readonly documentPath = input.required<string>();
	protected readonly database = computed<DatabaseTarget>(() => ({
		accountId: this.accountId(),
		projectId: this.projectId(),
		databaseId: this.databaseId(),
	}));
	protected readonly accountLabel = computed(() => this.accounts.labelOf(this.accountId()));
	protected readonly exportLink = computed(() => exportDocumentRoute(this.database(), this.documentPath()));
	protected readonly duplicateLink = computed(() => copyRoute(this.database(), { type: "document", documentPath: this.documentPath() }, "duplicate"));
	protected readonly copyLink = computed(() => copyRoute(this.database(), { type: "document", documentPath: this.documentPath() }, "copy"));
	protected readonly rootDraft = computed<ValueDraft>(() => ({ type: "map", fields: this.store.fieldDrafts() }));
	protected readonly times = computed(() => {
		const document = this.store.document();
		if (document.status !== "loaded" || !document.value) {
			return null;
		}
		const { createTime, updateTime } = document.value;
		return {
			created: formatTimestampLocal(createTime),
			createdUtc: formatTimestampUtc(createTime),
			updated: formatTimestampLocal(updateTime),
			updatedUtc: formatTimestampUtc(updateTime),
		};
	});
	protected readonly isConfirmingDelete = signal(false);
	protected readonly isRecursiveDelete = signal(false);
	protected readonly copyState = signal<"idle" | "copied" | "failed">("idle");

	constructor() {
		effect(() => {
			const database = this.database();
			const documentPath = this.documentPath();
			untracked(() => {
				this.isConfirmingDelete.set(false);
				void this.store.open(database, documentPath);
			});
		});
		inject(DestroyRef).onDestroy(() => clearTimeout(this.copiedTimer));
	}

	protected subcollectionLink(collectionId: string): string[] {
		return collectionRoute(this.database(), `${this.documentPath()}/${collectionId}`);
	}

	protected updateFields(draft: ValueDraft): void {
		if (draft.type === "map") {
			this.store.fieldDrafts.set(draft.fields);
		}
	}

	protected async copyPath(): Promise<void> {
		clearTimeout(this.copiedTimer);
		try {
			await navigator.clipboard.writeText(this.documentPath());
			this.copyState.set("copied");
		} catch {
			this.copyState.set("failed");
		}
		this.copiedTimer = setTimeout(() => this.copyState.set("idle"), COPIED_NOTICE_MS);
	}

	protected askToDelete(): void {
		this.isRecursiveDelete.set(false);
		this.isConfirmingDelete.set(true);
	}

	protected setRecursiveDelete(event: Event): void {
		this.isRecursiveDelete.set((event.target as HTMLInputElement).checked);
	}

	protected async deleteDocument(): Promise<void> {
		if (await this.store.delete(this.isRecursiveDelete())) {
			await this.router.navigate(collectionRoute(this.database(), parentPath(this.documentPath()) ?? ""));
		}
	}
}
