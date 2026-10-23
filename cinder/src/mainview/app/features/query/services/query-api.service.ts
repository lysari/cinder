import { Injectable, inject } from "@angular/core";
import type { DocumentPage } from "../../../../../shared/interfaces/browse.interface";
import type { LiveQueryParams } from "../../../../../shared/interfaces/live.interface";
import type { RunQueryParams } from "../../../../../shared/interfaces/query.interface";
import { RpcService } from "../../../core/services/rpc.service";

@Injectable()
export class QueryApiService {
	private readonly rpc = inject(RpcService);
	readonly liveUpdates = this.rpc.liveUpdates.asObservable();

	runQuery(params: RunQueryParams): Promise<DocumentPage> {
		return this.rpc.request.runQuery(params);
	}

	startLive(params: LiveQueryParams): Promise<void> {
		return this.rpc.request.startLive(params);
	}

	stopLive(listenerId: string): Promise<void> {
		return this.rpc.request.stopLive({ listenerId });
	}
}
