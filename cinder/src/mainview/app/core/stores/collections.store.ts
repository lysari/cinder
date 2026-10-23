import { Injectable, inject, signal } from "@angular/core";
import type { DatabaseTarget } from "../../../../shared/interfaces/account.interface";
import type { Loadable } from "../../shared/interfaces/loadable.interface";
import { load } from "../../shared/utils/load";
import { RpcService } from "../services/rpc.service";

@Injectable({ providedIn: "root" })
export class CollectionsStore {
	private readonly rpc = inject(RpcService);
	private readonly rootCollections = signal<Record<string, Loadable<string[]>>>({});

	rootCollectionsOf(database: DatabaseTarget): Loadable<string[]> | undefined {
		return this.rootCollections()[databaseKey(database)];
	}

	async loadRootCollections(database: DatabaseTarget): Promise<void> {
		const status = this.rootCollectionsOf(database)?.status;
		if (status === "loaded" || status === "loading") {
			return;
		}
		await this.refreshRootCollections(database);
	}

	async refreshRootCollections(database: DatabaseTarget): Promise<void> {
		const key = databaseKey(database);
		this.rootCollections.update((collections) => ({ ...collections, [key]: { status: "loading" } }));
		const collections = await load(() => this.rpc.request.listCollections({ database, documentPath: null }));
		this.rootCollections.update((current) => ({ ...current, [key]: collections }));
	}
}

function databaseKey({ accountId, projectId, databaseId }: DatabaseTarget): string {
	return JSON.stringify([accountId, projectId, databaseId]);
}
