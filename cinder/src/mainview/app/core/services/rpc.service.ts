import { Injectable } from "@angular/core";
import { Electroview } from "electrobun/view";
import type { AppRpcSchema } from "../../../../shared/interfaces/rpc.interface";

const REQUEST_TIMEOUT_MS = 60_000;

@Injectable({ providedIn: "root" })
export class RpcService {
	private readonly rpc = Electroview.defineRPC<AppRpcSchema>({ maxRequestTime: REQUEST_TIMEOUT_MS, handlers: {} });
	readonly request = this.rpc.request;

	constructor() {
		new Electroview({ rpc: this.rpc });
	}
}
