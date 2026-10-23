import { Injectable, NgZone, inject } from "@angular/core";
import { Electroview } from "electrobun/view";
import { Subject } from "rxjs";
import type { MenuAction } from "../../../../shared/constants/menu";
import type { LiveUpdate } from "../../../../shared/interfaces/live.interface";
import type { AppRpcSchema } from "../../../../shared/interfaces/rpc.interface";
import type { TaskUpdate } from "../../../../shared/interfaces/task.interface";

const REQUEST_TIMEOUT_MS = 60_000;

@Injectable({ providedIn: "root" })
export class RpcService {
	private readonly zone = inject(NgZone);
	readonly taskUpdates = new Subject<TaskUpdate>();
	readonly liveUpdates = new Subject<LiveUpdate>();
	readonly menuActions = new Subject<MenuAction>();
	readonly tabOpenRequests = new Subject<string>();
	private readonly rpc = Electroview.defineRPC<AppRpcSchema>({
		maxRequestTime: REQUEST_TIMEOUT_MS,
		handlers: {
			messages: {
				taskUpdated: (update) => this.zone.run(() => this.taskUpdates.next(update)),
				liveUpdated: (update) => this.zone.run(() => this.liveUpdates.next(update)),
				menuActionInvoked: (action) => this.zone.run(() => this.menuActions.next(action)),
				tabOpenRequested: (url) => this.zone.run(() => this.tabOpenRequests.next(url)),
			},
		},
	});
	readonly request = this.rpc.request;
	readonly send = this.rpc.send;

	constructor() {
		new Electroview({ rpc: this.rpc });
	}
}
