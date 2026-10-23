import { Injectable, inject, signal } from "@angular/core";
import type { ExportTaskRequest } from "../../../../../shared/interfaces/export.interface";
import { TasksStore } from "../../../core/stores/tasks.store";
import { errorMessage } from "../../../shared/utils/error-message";
import { TransferApiService } from "../services/transfer-api.service";

type ExportDraft = Omit<ExportTaskRequest, "type" | "folderPath" | "isOverwriting">;

@Injectable()
export class ExportStore {
	private readonly api = inject(TransferApiService);
	private readonly tasks = inject(TasksStore);
	readonly folderPath = signal<string | null>(null);
	readonly replacedFilePath = signal<string | null>(null);
	readonly isStarting = signal(false);
	readonly error = signal<string | null>(null);

	async loadDefaultFolder(): Promise<void> {
		try {
			this.folderPath.set(await this.api.getDefaultExportFolder());
		} catch (error) {
			this.error.set(errorMessage(error));
		}
	}

	async chooseFolder(): Promise<void> {
		try {
			const folderPath = await this.api.chooseExportFolder();
			if (folderPath) {
				this.folderPath.set(folderPath);
				this.replacedFilePath.set(null);
			}
		} catch (error) {
			this.error.set(errorMessage(error));
		}
	}

	cancelReplace(): void {
		this.replacedFilePath.set(null);
	}

	async start(draft: ExportDraft, description: string, isReplaceConfirmed: boolean): Promise<string | null> {
		const folderPath = this.folderPath();
		if (folderPath === null || this.isStarting()) {
			return null;
		}
		this.isStarting.set(true);
		this.error.set(null);
		try {
			const { filePath, isExisting } = await this.api.checkExportFile({ folderPath, fileName: draft.fileName, format: draft.format });
			if (isExisting && !isReplaceConfirmed) {
				this.replacedFilePath.set(filePath);
				return null;
			}
			this.replacedFilePath.set(null);
			return await this.tasks.start({ type: "export", ...draft, folderPath, isOverwriting: isExisting }, description);
		} catch (error) {
			this.error.set(errorMessage(error));
			return null;
		} finally {
			this.isStarting.set(false);
		}
	}
}
