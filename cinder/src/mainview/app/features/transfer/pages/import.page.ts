import { DatePipe } from "@angular/common";
import { Component, computed, inject, input } from "@angular/core";
import { Router } from "@angular/router";
import { LucideAngularModule } from "lucide-angular";
import type { DatabaseTarget } from "../../../../../shared/interfaces/account.interface";
import type { ImportFileSummary } from "../../../../../shared/interfaces/import.interface";
import { AccountsStore } from "../../../core/stores/accounts.store";
import { formatByteCount, taskProgressRatio } from "../../../core/utils/task-progress";
import { CsvLoadFormComponent } from "../components/csv-load-form.component";
import { JsonImportFormComponent } from "../components/json-import-form.component";
import type { CsvLoadForm, JsonImportForm } from "../interfaces/import-form.interface";
import { ImportStore } from "../stores/import.store";

const FORMAT_LABELS: Record<ImportFileSummary["format"], string> = {
	"cinder-json": "Cinder JSON export",
	ndjson: "Cinder NDJSON export",
	json: "Plain JSON",
	csv: "CSV",
};

@Component({
	selector: "app-import-page",
	imports: [DatePipe, LucideAngularModule, CsvLoadFormComponent, JsonImportFormComponent],
	providers: [ImportStore],
	templateUrl: "./import.page.html",
	styleUrl: "./import.page.scss",
})
export class ImportPage {
	private readonly router = inject(Router);
	private readonly accounts = inject(AccountsStore);
	protected readonly store = inject(ImportStore);
	readonly accountId = input.required<string>();
	readonly projectId = input.required<string>();
	readonly databaseId = input.required<string>();
	readonly collectionPath = input<string>();
	protected readonly formatLabels = FORMAT_LABELS;
	protected readonly database = computed<DatabaseTarget>(() => ({
		accountId: this.accountId(),
		projectId: this.projectId(),
		databaseId: this.databaseId(),
	}));
	protected readonly accountLabel = computed(() => this.accounts.labelOf(this.accountId()));
	protected readonly targetCollectionPath = computed(() => this.collectionPath() ?? null);
	protected readonly fileSize = computed(() => {
		const file = this.store.file();
		return file ? formatByteCount(file.byteCount) : "";
	});
	protected readonly analysisPercent = computed(() => {
		const task = this.store.analysisTask();
		const ratio = task ? taskProgressRatio(task) : null;
		return ratio === null ? null : Math.round(ratio * 100);
	});

	protected async importJson(file: ImportFileSummary, { target, writeMode }: JsonImportForm): Promise<void> {
		if (file.format === "csv") {
			return;
		}
		const targetText = target.type === "collection" ? target.collectionPath : "the original paths";
		const taskId = await this.store.start(
			{ type: "import", database: this.database(), filePath: file.filePath, format: file.format, target, writeMode },
			`Import ${file.fileName} into ${targetText}`,
		);
		await this.showTask(taskId);
	}

	protected async loadCsv(file: ImportFileSummary, form: CsvLoadForm): Promise<void> {
		const taskId = await this.store.start(
			{ type: "load-csv", database: this.database(), filePath: file.filePath, ...form },
			`Load ${file.fileName} into ${form.collectionPath}`,
		);
		await this.showTask(taskId);
	}

	private async showTask(taskId: string | null): Promise<void> {
		if (taskId) {
			await this.router.navigate(["/tasks"], { queryParams: { task: taskId } });
		}
	}
}
