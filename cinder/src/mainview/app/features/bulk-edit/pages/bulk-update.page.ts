import { Component, computed, inject, input } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { FormArray, FormControl, FormGroup, ReactiveFormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { LucideAngularModule } from "lucide-angular";
import { map } from "rxjs";
import type { DatabaseTarget } from "../../../../../shared/interfaces/account.interface";
import type { BulkUpdateOperationType } from "../../../../../shared/interfaces/bulk-update.interface";
import type { StructuredQuery } from "../../../../../shared/interfaces/query.interface";
import { AccountsStore } from "../../../core/stores/accounts.store";
import { ValueEditorComponent } from "../../../shared/components/value-editor.component";
import { initialOperationValue, readBulkUpdateForm } from "../../../shared/utils/bulk-update-form";
import { describeQuery, parseRouteQuery } from "../../../shared/utils/route-query";
import type { ValueDraft } from "../../../shared/interfaces/value-draft.interface";
import { BulkUpdatePreviewComponent } from "../components/bulk-update-preview.component";
import { BulkUpdateStore } from "../stores/bulk-update.store";

type BulkUpdateOperationControls = FormGroup<{
	type: FormControl<BulkUpdateOperationType>;
	fieldPath: FormControl<string>;
	newFieldPath: FormControl<string>;
	isOverwriting: FormControl<boolean>;
	value: FormControl<ValueDraft>;
}>;

@Component({
	selector: "app-bulk-update-page",
	imports: [ReactiveFormsModule, LucideAngularModule, ValueEditorComponent, BulkUpdatePreviewComponent],
	providers: [BulkUpdateStore],
	templateUrl: "./bulk-update.page.html",
	styleUrl: "./bulk-update.page.scss",
})
export class BulkUpdatePage {
	private readonly router = inject(Router);
	private readonly accounts = inject(AccountsStore);
	protected readonly store = inject(BulkUpdateStore);
	readonly accountId = input.required<string>();
	readonly projectId = input.required<string>();
	readonly databaseId = input.required<string>();
	readonly collectionPath = input<string>();
	readonly query = input<string>();
	protected readonly form = new FormGroup({ operations: new FormArray([createOperationControls("set")]) });
	private readonly rows = toSignal(this.form.valueChanges.pipe(map(() => this.form.controls.operations.getRawValue())), {
		initialValue: this.form.controls.operations.getRawValue(),
	});
	protected readonly formResult = computed(() => readBulkUpdateForm(this.rows()));
	protected readonly listIssues = computed(() => this.formResult().issues.filter((issue) => issue.index === null));
	protected readonly database = computed<DatabaseTarget>(() => ({
		accountId: this.accountId(),
		projectId: this.projectId(),
		databaseId: this.databaseId(),
	}));
	protected readonly accountLabel = computed(() => this.accounts.labelOf(this.accountId()));
	protected readonly source = computed<StructuredQuery | null>(() => {
		const collectionPath = this.collectionPath();
		if (collectionPath) {
			return { target: { type: "collection", collectionPath }, filters: [], orders: [], limit: null };
		}
		const queryText = this.query();
		return queryText ? parseRouteQuery(queryText) : null;
	});
	protected readonly sourceSummary = computed(() => {
		const source = this.source();
		if (!source) {
			return "";
		}
		const isWholeTarget = source.filters.length === 0 && source.orders.length === 0 && source.limit === null;
		if (!isWholeTarget) {
			return `Every document of the ${describeQuery(source)}`;
		}
		return source.target.type === "collection"
			? `Every document of the collection ${source.target.collectionPath} (not its subcollections)`
			: `Every document of every collection with the id ${source.target.collectionId}`;
	});
	protected readonly previewDocuments = computed(() => {
		const result = this.store.previewTask()?.result;
		return result?.kind === "bulk-update-preview" ? result.documents : null;
	});
	protected readonly isPreviewStale = computed(() => {
		const previewed = this.store.previewedOperations();
		return previewed !== null && JSON.stringify(previewed) !== JSON.stringify(this.formResult().operations);
	});

	protected issuesOf(index: number): string[] {
		return this.formResult()
			.issues.filter((issue) => issue.index === index)
			.map((issue) => issue.message);
	}

	protected addOperation(): void {
		this.form.controls.operations.push(createOperationControls("set"));
	}

	protected removeOperation(index: number): void {
		this.form.controls.operations.removeAt(index);
	}

	protected resetValue(row: BulkUpdateOperationControls, event: Event): void {
		row.controls.value.setValue(initialOperationValue((event.target as HTMLSelectElement).value as BulkUpdateOperationType));
	}

	protected async preview(): Promise<void> {
		const draft = this.readDraft();
		if (draft) {
			await this.store.preview(draft, `Preview bulk update: ${this.sourceSummary()}`);
		}
	}

	protected async askToRun(): Promise<void> {
		const draft = this.readDraft();
		if (draft) {
			await this.store.askToRun(draft);
		}
	}

	protected async run(): Promise<void> {
		const draft = this.readDraft();
		if (!draft) {
			return;
		}
		const operationCount = draft.operations.length === 1 ? "1 operation" : `${draft.operations.length} operations`;
		const taskId = await this.store.run(draft, `Bulk update (${operationCount}): ${this.sourceSummary()}`);
		if (taskId) {
			await this.router.navigate(["/tasks"], { queryParams: { task: taskId } });
		}
	}

	private readDraft() {
		const query = this.source();
		const { operations, issues } = this.formResult();
		this.form.markAllAsTouched();
		if (!query || !operations || issues.length > 0) {
			return null;
		}
		return { database: this.database(), query, operations };
	}
}

function createOperationControls(type: BulkUpdateOperationType): BulkUpdateOperationControls {
	return new FormGroup({
		type: new FormControl(type, { nonNullable: true }),
		fieldPath: new FormControl("", { nonNullable: true }),
		newFieldPath: new FormControl("", { nonNullable: true }),
		isOverwriting: new FormControl(false, { nonNullable: true }),
		value: new FormControl(initialOperationValue(type), { nonNullable: true }),
	});
}
