import { Injectable, inject } from "@angular/core";
import type { CountQueryParams } from "../../../../../shared/interfaces/query.interface";
import { RpcService } from "../../../core/services/rpc.service";

@Injectable()
export class BulkEditApiService {
	private readonly rpc = inject(RpcService);

	countQuery(params: CountQueryParams): Promise<number> {
		return this.rpc.request.countQuery(params);
	}
}
