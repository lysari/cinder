import { Injectable, computed, inject, signal } from "@angular/core";
import type { BulkUpdateOperation, BulkUpdateTaskRequest } from "../../../../../shared/interfaces/bulk-update.interface";
import { TasksStore } from "../../../core/stores/tasks.store";
import { errorMessage } from "../../../shared/utils/error-message";
import { BulkEditApiService } from "../services/bulk-edit-api.service";

type BulkUpdateDraft = Omit<BulkUpdateTaskRequest, "type" | "isDryRun">;

@Injectable()
export class BulkUpdateStore {
	private readonly api = inject(BulkEditApiService);
	private readonly tasks = inject(TasksStore);
	private readonly previewTaskId = signal<string | null>(null);
	readonly previewedOperations = signal<BulkUpdateOperation[] | null>(null);
	readonly previewTask = computed(() => {
		const taskId = this.previewTaskId();
		return taskId === null ? undefined : this.tasks.taskOf(taskId);
	});
	readonly matchCount = signal<number | null>(null);
	readonly isBusy = signal(false);
	readonly error = signal<string | null>(null);

	async preview(draft: BulkUpdateDraft, description: string): Promise<void> {
		const taskId = await this.whileBusy(() => this.tasks.start({ type: "bulk-update", ...draft, isDryRun: true }, description));
		if (taskId !== null) {
			this.previewTaskId.set(taskId);
			this.previewedOperations.set(draft.operations);
		}
	}

	async askToRun({ database, query }: BulkUpdateDraft): Promise<void> {
		this.matchCount.set(await this.whileBusy(() => this.api.countQuery({ database, query })));
	}

	cancelRun(): void {
		this.matchCount.set(null);
	}

	async run(draft: BulkUpdateDraft, description: string): Promise<string | null> {
		const taskId = await this.whileBusy(() => this.tasks.start({ type: "bulk-update", ...draft, isDryRun: false }, description));
		if (taskId !== null) {
			this.matchCount.set(null);
		}
		return taskId;
	}

	private async whileBusy<T>(request: () => Promise<T>): Promise<T | null> {
		if (this.isBusy()) {
			return null;
		}
		this.isBusy.set(true);
		this.error.set(null);
		try {
			return await request();
		} catch (error) {
			this.error.set(errorMessage(error));
			return null;
		} finally {
			this.isBusy.set(false);
		}
	}
}
