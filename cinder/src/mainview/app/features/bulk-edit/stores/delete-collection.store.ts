import { Injectable, inject, signal } from "@angular/core";
import type { CountQueryParams } from "../../../../../shared/interfaces/query.interface";
import type { DeleteCollectionTaskRequest } from "../../../../../shared/interfaces/delete-collection.interface";
import { TasksStore } from "../../../core/stores/tasks.store";
import type { Loadable } from "../../../shared/interfaces/loadable.interface";
import { errorMessage } from "../../../shared/utils/error-message";
import { load } from "../../../shared/utils/load";
import { BulkEditApiService } from "../services/bulk-edit-api.service";

@Injectable()
export class DeleteCollectionStore {
	private readonly api = inject(BulkEditApiService);
	private readonly tasks = inject(TasksStore);
	readonly documentCount = signal<Loadable<number>>({ status: "loading" });
	readonly isStarting = signal(false);
	readonly error = signal<string | null>(null);

	async count(params: CountQueryParams): Promise<void> {
		this.documentCount.set({ status: "loading" });
		this.documentCount.set(await load(() => this.api.countQuery(params)));
	}

	async start(request: DeleteCollectionTaskRequest, description: string): Promise<string | null> {
		if (this.isStarting()) {
			return null;
		}
		this.isStarting.set(true);
		this.error.set(null);
		try {
			return await this.tasks.start(request, description);
		} catch (error) {
			this.error.set(errorMessage(error));
			return null;
		} finally {
			this.isStarting.set(false);
		}
	}
}
