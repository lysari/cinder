import { Injectable, computed, inject, signal } from "@angular/core";
import type { DatabaseTarget } from "../../../../../shared/interfaces/account.interface";
import type { LoadCsvTaskRequest } from "../../../../../shared/interfaces/csv.interface";
import type { ImportFileSummary, ImportTaskRequest } from "../../../../../shared/interfaces/import.interface";
import { TasksStore } from "../../../core/stores/tasks.store";
import { errorMessage } from "../../../shared/utils/error-message";
import { TransferApiService } from "../services/transfer-api.service";

@Injectable()
export class ImportStore {
	private readonly api = inject(TransferApiService);
	private readonly tasks = inject(TasksStore);
	private readonly analysisTaskId = signal<string | null>(null);
	readonly file = signal<ImportFileSummary | null>(null);
	readonly analysisTask = computed(() => {
		const taskId = this.analysisTaskId();
		return taskId === null ? undefined : this.tasks.taskOf(taskId);
	});
	readonly analysis = computed(() => {
		const result = this.analysisTask()?.result;
		return result?.kind === "csv-analysis" ? result : null;
	});
	readonly isChoosing = signal(false);
	readonly isStarting = signal(false);
	readonly error = signal<string | null>(null);

	async chooseFile(database: DatabaseTarget): Promise<void> {
		this.isChoosing.set(true);
		this.error.set(null);
		try {
			const file = await this.api.chooseImportFile();
			if (!file) {
				return;
			}
			this.file.set(file);
			this.analysisTaskId.set(null);
			if (file.format === "csv") {
				this.analysisTaskId.set(await this.tasks.start({ type: "analyze-csv", database, filePath: file.filePath }, `Analyze ${file.fileName}`));
			}
		} catch (error) {
			this.error.set(errorMessage(error));
		} finally {
			this.isChoosing.set(false);
		}
	}

	async start(request: ImportTaskRequest | LoadCsvTaskRequest, description: string): Promise<string | null> {
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
