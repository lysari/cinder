import { Component, computed, effect, inject, input, untracked } from "@angular/core";
import { takeUntilDestroyed, toSignal } from "@angular/core/rxjs-interop";
import { FormControl, FormGroup, ReactiveFormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { LucideAngularModule } from "lucide-angular";
import { EXPORT_FILE_EXTENSIONS, type ExportFormat } from "../../../../../../shared/constants/data-transfer";
import type { DatabaseTarget } from "../../../../../../shared/interfaces/account.interface";
import type { ExportSource } from "../../../../../../shared/interfaces/export.interface";
import { exportFileNameError } from "../../../../../../shared/utils/export-file-name";
import { AccountsStore } from "../../../../core/stores/accounts.store";
import { describeQuery, parseRouteQuery } from "../../../../shared/utils/route-query";
import { ExportStore } from "../../stores/export.store";

const DEFAULT_FORMAT: ExportFormat = "cinder-json";

@Component({
	selector: "app-export-page",
	imports: [ReactiveFormsModule, LucideAngularModule],
	providers: [ExportStore],
	templateUrl: "./export.page.html",
	styleUrl: "./export.page.scss",
})
export class ExportPage {
	private readonly router = inject(Router);
	private readonly accounts = inject(AccountsStore);
	protected readonly store = inject(ExportStore);
	readonly accountId = input.required<string>();
	readonly projectId = input.required<string>();
	readonly databaseId = input.required<string>();
	readonly collectionPath = input<string>();
	readonly documentPath = input<string>();
	readonly query = input<string>();
	protected readonly form = new FormGroup({
		format: new FormControl<ExportFormat>(DEFAULT_FORMAT, { nonNullable: true }),
		isRecursive: new FormControl(false, { nonNullable: true }),
		fileName: new FormControl("", { nonNullable: true }),
	});
	private readonly formValue = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });
	protected readonly database = computed<DatabaseTarget>(() => ({
		accountId: this.accountId(),
		projectId: this.projectId(),
		databaseId: this.databaseId(),
	}));
	protected readonly accountLabel = computed(() => this.accounts.labelOf(this.accountId()));
	protected readonly source = computed(() => sourceOf(this.collectionPath(), this.documentPath(), this.query()));
	protected readonly sourceSummary = computed(() => {
		const source = this.source();
		return source ? describeSource(source) : null;
	});
	protected readonly canIncludeSubcollections = computed(() => {
		const type = this.source()?.type;
		return type === "collection" || type === "document";
	});
	protected readonly fileNameError = computed(() => {
		const { fileName, format } = this.formValue();
		return exportFileNameError(fileName ?? "", format ?? DEFAULT_FORMAT);
	});

	constructor() {
		void this.store.loadDefaultFolder();
		effect(() => {
			const source = this.source();
			untracked(() => this.form.controls.fileName.setValue(`${source ? sourceName(source) : "export"}${EXPORT_FILE_EXTENSIONS[DEFAULT_FORMAT][0]}`));
		});
		this.form.controls.format.valueChanges.pipe(takeUntilDestroyed()).subscribe((format) => this.swapExtension(format));
	}

	protected async start(isReplaceConfirmed: boolean): Promise<void> {
		const source = this.source();
		const { format, isRecursive, fileName } = this.form.getRawValue();
		this.form.markAllAsTouched();
		if (!source || this.fileNameError() !== null) {
			return;
		}
		const exportedSource: ExportSource =
			source.type === "collection" || source.type === "document" ? { ...source, isRecursive } : source;
		const description = `Export ${describeSource(exportedSource)} to ${fileName}`;
		const taskId = await this.store.start({ database: this.database(), source: exportedSource, format, fileName }, description, isReplaceConfirmed);
		if (taskId) {
			await this.router.navigate(["/tasks"], { queryParams: { task: taskId } });
		}
	}

	private swapExtension(format: ExportFormat): void {
		const control = this.form.controls.fileName;
		const extensions = EXPORT_FILE_EXTENSIONS[format];
		if (extensions.some((extension) => control.value.toLowerCase().endsWith(extension))) {
			return;
		}
		const dotIndex = control.value.lastIndexOf(".");
		const baseName = dotIndex > 0 ? control.value.slice(0, dotIndex) : control.value;
		control.setValue(`${baseName}${extensions[0]}`);
	}
}

function sourceOf(collectionPath: string | undefined, documentPath: string | undefined, queryText: string | undefined): ExportSource | null {
	if (collectionPath) {
		return { type: "collection", collectionPath, isRecursive: false };
	}
	if (documentPath) {
		return { type: "document", documentPath, isRecursive: false };
	}
	const query = queryText ? parseRouteQuery(queryText) : null;
	if (!query) {
		return null;
	}
	const isWholeTarget = query.filters.length === 0 && query.orders.length === 0 && query.limit === null;
	if (isWholeTarget && query.target.type === "collection") {
		return { type: "collection", collectionPath: query.target.collectionPath, isRecursive: false };
	}
	if (isWholeTarget && query.target.type === "collection-group") {
		return { type: "collection-group", collectionId: query.target.collectionId };
	}
	return { type: "query", query };
}

function sourceName(source: ExportSource): string {
	switch (source.type) {
		case "collection":
			return lastSegment(source.collectionPath);
		case "document":
			return lastSegment(source.documentPath);
		case "collection-group":
			return source.collectionId;
		case "query":
			return `${source.query.target.type === "collection" ? lastSegment(source.query.target.collectionPath) : source.query.target.collectionId}-query`;
	}
}

function describeSource(source: ExportSource): string {
	switch (source.type) {
		case "collection":
			return `collection ${source.collectionPath}${source.isRecursive ? " with subcollections" : ""}`;
		case "document":
			return `document ${source.documentPath}${source.isRecursive ? " with subcollections" : ""}`;
		case "collection-group":
			return `collection group ${source.collectionId}`;
		case "query":
			return describeQuery(source.query);
	}
}

function lastSegment(path: string): string {
	return path.slice(path.lastIndexOf("/") + 1);
}
