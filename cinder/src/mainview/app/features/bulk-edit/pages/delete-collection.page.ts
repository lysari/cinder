import { Component, computed, effect, inject, input, untracked } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { LucideAngularModule } from "lucide-angular";
import type { DatabaseTarget } from "../../../../../shared/interfaces/account.interface";
import type { DeleteSource } from "../../../../../shared/interfaces/delete-collection.interface";
import type { StructuredQuery } from "../../../../../shared/interfaces/query.interface";
import { AccountsStore } from "../../../core/stores/accounts.store";
import { describeQuery, parseRouteQuery } from "../../../shared/utils/route-query";
import { DeleteCollectionStore } from "../stores/delete-collection.store";

@Component({
	selector: "app-delete-collection-page",
	imports: [ReactiveFormsModule, LucideAngularModule],
	providers: [DeleteCollectionStore],
	templateUrl: "./delete-collection.page.html",
	styleUrl: "./delete-collection.page.scss",
})
export class DeleteCollectionPage {
	private readonly router = inject(Router);
	private readonly accounts = inject(AccountsStore);
	protected readonly store = inject(DeleteCollectionStore);
	readonly accountId = input.required<string>();
	readonly projectId = input.required<string>();
	readonly databaseId = input.required<string>();
	readonly collectionPath = input<string>();
	readonly query = input<string>();
	protected readonly typedText = new FormControl("", { nonNullable: true });
	private readonly typedValue = toSignal(this.typedText.valueChanges, { initialValue: "" });
	protected readonly database = computed<DatabaseTarget>(() => ({
		accountId: this.accountId(),
		projectId: this.projectId(),
		databaseId: this.databaseId(),
	}));
	protected readonly accountLabel = computed(() => this.accounts.labelOf(this.accountId()));
	protected readonly source = computed<DeleteSource | null>(() => {
		const collectionPath = this.collectionPath();
		if (collectionPath) {
			return { type: "collection", collectionPath };
		}
		const queryText = this.query();
		const query = queryText ? parseRouteQuery(queryText) : null;
		return query ? { type: "query", query } : null;
	});
	protected readonly confirmationText = computed(() => {
		const source = this.source();
		if (!source) {
			return "";
		}
		if (source.type === "collection") {
			return source.collectionPath;
		}
		const { target } = source.query;
		return target.type === "collection" ? target.collectionPath : target.collectionId;
	});
	protected readonly isConfirmed = computed(() => this.typedValue() === this.confirmationText());
	protected readonly queryDescription = computed(() => {
		const source = this.source();
		return source?.type === "query" ? describeQuery(source.query) : null;
	});

	constructor() {
		effect(() => {
			const source = this.source();
			const database = this.database();
			if (source) {
				untracked(() => void this.store.count({ database, query: countedQuery(source) }));
			}
		});
	}

	protected async delete(): Promise<void> {
		const source = this.source();
		if (!source || !this.isConfirmed()) {
			return;
		}
		const description = source.type === "collection" ? `Delete collection ${source.collectionPath} with subcollections` : `Delete documents of the ${describeQuery(source.query)}`;
		const taskId = await this.store.start({ type: "delete-collection", database: this.database(), source }, description);
		if (taskId) {
			await this.router.navigate(["/tasks"], { queryParams: { task: taskId } });
		}
	}
}

function countedQuery(source: DeleteSource): StructuredQuery {
	return source.type === "query" ? source.query : { target: { type: "collection", collectionPath: source.collectionPath }, filters: [], orders: [], limit: null };
}
