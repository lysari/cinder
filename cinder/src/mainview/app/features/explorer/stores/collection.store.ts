import { Injectable, computed, inject, signal } from "@angular/core";
import { DEFAULT_PAGE_SIZE } from "../../../../../shared/constants/browse-session";
import type { DatabaseTarget } from "../../../../../shared/interfaces/account.interface";
import type { FirestoreDocument } from "../../../../../shared/interfaces/firestore-value.interface";
import { errorMessage } from "../../../shared/utils/error-message";
import { ExplorerApiService } from "../services/explorer-api.service";

@Injectable()
export class CollectionStore {
	private readonly api = inject(ExplorerApiService);
	private database: DatabaseTarget | null = null;
	private collectionPath = "";
	private requestVersion = 0;
	readonly documents = signal<FirestoreDocument[]>([]);
	readonly status = signal<"loading" | "loaded" | "failed">("loading");
	readonly error = signal<string | null>(null);
	readonly hasMore = signal(false);
	readonly isLoadingMore = signal(false);
	readonly loadMoreError = signal<string | null>(null);
	readonly fieldNames = computed(() =>
		[...new Set(this.documents().flatMap((document) => Object.keys(document.fields)))].sort(),
	);

	open(database: DatabaseTarget, collectionPath: string): Promise<void> {
		this.database = database;
		this.collectionPath = collectionPath;
		return this.loadFirstPage();
	}

	refresh(): Promise<void> {
		return this.loadFirstPage();
	}

	async loadMore(): Promise<void> {
		if (!this.database || !this.hasMore() || this.isLoadingMore()) {
			return;
		}
		const version = this.requestVersion;
		this.isLoadingMore.set(true);
		this.loadMoreError.set(null);
		try {
			const page = await this.api.listDocuments({
				database: this.database,
				collectionPath: this.collectionPath,
				pageSize: DEFAULT_PAGE_SIZE,
				startAfterId: this.documents().at(-1)?.id ?? null,
			});
			if (version === this.requestVersion) {
				this.documents.update((documents) => [...documents, ...page.documents]);
				this.hasMore.set(page.hasMore);
			}
		} catch (error) {
			if (version === this.requestVersion) {
				this.loadMoreError.set(errorMessage(error));
			}
		} finally {
			if (version === this.requestVersion) {
				this.isLoadingMore.set(false);
			}
		}
	}

	private async loadFirstPage(): Promise<void> {
		if (!this.database) {
			return;
		}
		const version = ++this.requestVersion;
		this.status.set("loading");
		this.error.set(null);
		this.isLoadingMore.set(false);
		this.loadMoreError.set(null);
		try {
			const page = await this.api.listDocuments({
				database: this.database,
				collectionPath: this.collectionPath,
				pageSize: DEFAULT_PAGE_SIZE,
				startAfterId: null,
			});
			if (version === this.requestVersion) {
				this.documents.set(page.documents);
				this.hasMore.set(page.hasMore);
				this.status.set("loaded");
			}
		} catch (error) {
			if (version === this.requestVersion) {
				this.documents.set([]);
				this.error.set(errorMessage(error));
				this.status.set("failed");
			}
		}
	}
}
