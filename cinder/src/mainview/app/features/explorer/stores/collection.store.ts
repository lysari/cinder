import { DestroyRef, Injectable, inject, signal } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { DEFAULT_PAGE_SIZE } from "../../../../../shared/constants/browse-session";
import type { DatabaseTarget } from "../../../../../shared/interfaces/account.interface";
import type { FirestoreDocument } from "../../../../../shared/interfaces/firestore-value.interface";
import type { LiveStatus, LiveUpdate } from "../../../../../shared/interfaces/live.interface";
import { errorMessage } from "../../../shared/utils/error-message";
import { LIVE_HIGHLIGHT_MS, applyLiveChanges, changedDocumentPaths, liveWindowSize } from "../../../shared/utils/live-changes";
import { ExplorerApiService } from "../services/explorer-api.service";

@Injectable()
export class CollectionStore {
	private readonly api = inject(ExplorerApiService);
	private database: DatabaseTarget | null = null;
	private collectionPath = "";
	private requestVersion = 0;
	private listenerId: string | null = null;
	private highlightTimer: ReturnType<typeof setTimeout> | null = null;
	readonly documents = signal<FirestoreDocument[]>([]);
	readonly status = signal<"loading" | "loaded" | "failed">("loading");
	readonly error = signal<string | null>(null);
	readonly hasMore = signal(false);
	readonly isLoadingMore = signal(false);
	readonly loadMoreError = signal<string | null>(null);
	readonly liveStatus = signal<LiveStatus>("off");
	readonly liveError = signal<string | null>(null);
	readonly changedPaths = signal<ReadonlySet<string>>(new Set());

	constructor() {
		this.api.liveUpdates.pipe(takeUntilDestroyed()).subscribe((update) => this.applyLiveUpdate(update));
		inject(DestroyRef).onDestroy(() => {
			this.stopLive();
			this.clearHighlight();
		});
	}

	open(database: DatabaseTarget, collectionPath: string): Promise<void> {
		this.stopLive();
		this.liveError.set(null);
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

	async startLive(): Promise<void> {
		if (!this.database || this.listenerId !== null || this.status() !== "loaded") {
			return;
		}
		const listenerId = crypto.randomUUID();
		this.listenerId = listenerId;
		this.liveStatus.set("starting");
		this.liveError.set(null);
		try {
			await this.api.startLive({
				listenerId,
				database: this.database,
				query: { target: { type: "collection", collectionPath: this.collectionPath }, filters: [], orders: [], limit: null },
				limit: liveWindowSize(this.documents().length, this.hasMore(), null),
			});
		} catch (error) {
			if (this.listenerId === listenerId) {
				this.listenerId = null;
				this.liveStatus.set("off");
				this.liveError.set(errorMessage(error));
			}
		}
	}

	stopLive(): void {
		const listenerId = this.listenerId;
		if (listenerId === null) {
			return;
		}
		this.listenerId = null;
		this.liveStatus.set("off");
		this.api.stopLive(listenerId).catch((error: unknown) => this.liveError.set(errorMessage(error)));
	}

	private applyLiveUpdate(update: LiveUpdate): void {
		if (update.listenerId !== this.listenerId) {
			return;
		}
		if (update.kind === "stopped") {
			this.listenerId = null;
			this.liveStatus.set("off");
			this.liveError.set(update.reason);
			return;
		}
		this.liveStatus.set("on");
		this.documents.update((documents) => applyLiveChanges(documents, update));
		const paths = changedDocumentPaths(update);
		if (paths.length > 0) {
			this.changedPaths.update((changedPaths) => new Set([...changedPaths, ...paths]));
			this.clearHighlight();
			this.highlightTimer = setTimeout(() => this.changedPaths.set(new Set()), LIVE_HIGHLIGHT_MS);
		}
	}

	private clearHighlight(): void {
		if (this.highlightTimer !== null) {
			clearTimeout(this.highlightTimer);
			this.highlightTimer = null;
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
