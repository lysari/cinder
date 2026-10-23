import { Injectable, inject, signal } from "@angular/core";
import type { CopyTaskRequest } from "../../../../../shared/interfaces/copy.interface";
import { TasksStore } from "../../../core/stores/tasks.store";
import { errorMessage } from "../../../shared/utils/error-message";

@Injectable()
export class CopyStore {
	private readonly tasks = inject(TasksStore);
	readonly isStarting = signal(false);
	readonly error = signal<string | null>(null);

	async start(request: CopyTaskRequest, description: string): Promise<string | null> {
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
