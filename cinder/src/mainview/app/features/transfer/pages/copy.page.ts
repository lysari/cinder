import { Component, computed, effect, inject, input, untracked } from "@angular/core";
import { takeUntilDestroyed, toSignal } from "@angular/core/rxjs-interop";
import { FormControl, FormGroup, ReactiveFormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { LucideAngularModule } from "lucide-angular";
import { map } from "rxjs";
import type { WriteMode } from "../../../../../shared/constants/data-transfer";
import type { DatabaseTarget } from "../../../../../shared/interfaces/account.interface";
import type { CopySource, CopyTaskRequest } from "../../../../../shared/interfaces/copy.interface";
import { copyRequestError, isSameDatabase } from "../../../../../shared/utils/copy-validation";
import { parentPath } from "../../../../../shared/utils/firestore-path";
import { isValidId } from "../../../../../shared/utils/firestore-validation";
import { AccountsStore } from "../../../core/stores/accounts.store";
import { createAutoId } from "../../../shared/utils/auto-id";
import { COPY_OPERATIONS, type CopyOperation } from "../../../shared/utils/transfer-route";
import { CopyStore } from "../stores/copy.store";

const WRITE_MODE_SENTENCES: Record<WriteMode, string> = {
	overwrite: "Documents that already exist there are replaced.",
	merge: "Documents that already exist there are merged field by field.",
	skip: "Documents that already exist there are left as they are and skipped.",
};

@Component({
	selector: "app-copy-page",
	imports: [ReactiveFormsModule, LucideAngularModule],
	providers: [CopyStore],
	templateUrl: "./copy.page.html",
	styleUrl: "./copy.page.scss",
})
export class CopyPage {
	private readonly router = inject(Router);
	protected readonly accounts = inject(AccountsStore);
	protected readonly store = inject(CopyStore);
	readonly accountId = input.required<string>();
	readonly projectId = input.required<string>();
	readonly databaseId = input.required<string>();
	readonly collectionPath = input<string>();
	readonly documentPath = input<string>();
	readonly operation = input.required<string>();
	protected readonly autoId = createAutoId();
	protected readonly form = new FormGroup({
		operation: new FormControl<CopyOperation>("copy", { nonNullable: true }),
		accountId: new FormControl("", { nonNullable: true }),
		projectId: new FormControl("", { nonNullable: true }),
		databaseId: new FormControl("", { nonNullable: true }),
		path: new FormControl("", { nonNullable: true }),
		isAutoId: new FormControl(true, { nonNullable: true }),
		documentId: new FormControl("", { nonNullable: true }),
		writeMode: new FormControl<WriteMode>("overwrite", { nonNullable: true }),
		isRecursive: new FormControl(true, { nonNullable: true }),
		isRewritingReferences: new FormControl(false, { nonNullable: true }),
	});
	private readonly formValue = toSignal(this.form.valueChanges.pipe(map(() => this.form.getRawValue())), {
		initialValue: this.form.getRawValue(),
	});
	protected readonly database = computed<DatabaseTarget>(() => ({
		accountId: this.accountId(),
		projectId: this.projectId(),
		databaseId: this.databaseId(),
	}));
	protected readonly source = computed<CopySource | null>(() => {
		const collectionPath = this.collectionPath();
		const documentPath = this.documentPath();
		if (collectionPath) {
			return { type: "collection", collectionPath };
		}
		return documentPath ? { type: "document", documentPath } : null;
	});
	protected readonly sourcePath = computed(() => {
		const source = this.source();
		return source?.type === "collection" ? source.collectionPath : (source?.documentPath ?? "");
	});
	protected readonly sourceLabel = computed(() => `${this.accounts.labelOf(this.accountId())} / ${this.projectId()} / ${this.databaseId()}`);
	protected readonly selectedOperation = computed(() => this.formValue().operation);
	protected readonly projects = computed(() => {
		const accountId = this.formValue().accountId;
		return accountId ? this.accounts.projectsOf(accountId) : undefined;
	});
	protected readonly databases = computed(() => {
		const { accountId, projectId } = this.formValue();
		return accountId && projectId ? this.accounts.databasesOf(accountId, projectId) : undefined;
	});
	protected readonly request = computed<CopyTaskRequest | null>(() => {
		const source = this.source();
		const value = this.formValue();
		if (!source) {
			return null;
		}
		const parent = parentPath(this.sourcePath()) ?? "";
		const destination =
			value.operation === "copy" || value.operation === "move"
				? { database: { accountId: value.accountId, projectId: value.projectId, databaseId: value.databaseId }, path: value.path }
				: { database: this.database(), path: value.operation === "rename" ? value.path : `${parent}/${value.isAutoId ? this.autoId : value.documentId}` };
		return {
			type: "copy",
			database: this.database(),
			source,
			destination,
			isMove: value.operation === "move" || value.operation === "rename",
			isRecursive: value.isRecursive,
			writeMode: value.writeMode,
			isRewritingReferences: value.isRewritingReferences,
		};
	});
	protected readonly requestError = computed(() => {
		const request = this.request();
		const { operation, isAutoId, documentId } = this.formValue();
		if (!request) {
			return null;
		}
		if (operation === "duplicate" && !isAutoId && !isValidId(documentId)) {
			return "Enter an id of up to 1500 bytes without a slash; . and .. and ids like __id__ are reserved.";
		}
		const { accountId, projectId, databaseId } = request.destination.database;
		if (!accountId || !projectId || !databaseId) {
			return "Choose the destination account, project and database.";
		}
		return copyRequestError(request);
	});
	protected readonly summary = computed(() => {
		const request = this.request();
		return request && this.requestError() === null ? this.describe(request) : null;
	});

	constructor() {
		effect(() => {
			const operation = COPY_OPERATIONS.find((candidate) => candidate === this.operation()) ?? "copy";
			const { accountId, projectId, databaseId } = this.database();
			untracked(() => {
				this.form.patchValue({ operation, accountId, projectId, databaseId }, { emitEvent: false });
				this.form.controls.path.setValue(this.initialPath(operation));
				void this.accounts.loadProjects(accountId);
				void this.accounts.loadDatabases(accountId, projectId);
			});
		});
		this.form.controls.operation.valueChanges.pipe(takeUntilDestroyed()).subscribe((operation) => {
			const { accountId, projectId, databaseId } = this.database();
			if (operation !== "copy" && operation !== "move") {
				this.form.patchValue({ accountId, projectId, databaseId }, { emitEvent: false });
			}
			this.form.controls.path.setValue(this.initialPath(operation));
		});
		this.form.controls.accountId.valueChanges.pipe(takeUntilDestroyed()).subscribe((accountId) => {
			this.form.patchValue({ projectId: "", databaseId: "" });
			if (accountId) {
				void this.accounts.loadProjects(accountId);
			}
		});
		this.form.controls.projectId.valueChanges.pipe(takeUntilDestroyed()).subscribe((projectId) => {
			this.form.controls.databaseId.setValue("");
			const { accountId } = this.form.getRawValue();
			if (accountId && projectId) {
				void this.accounts.loadDatabases(accountId, projectId);
			}
		});
	}

	protected isOperationAllowed(operation: CopyOperation): boolean {
		const type = this.source()?.type;
		return (operation !== "duplicate" || type === "document") && (operation !== "rename" || type === "collection");
	}

	protected async start(): Promise<void> {
		const request = this.request();
		const summary = this.summary();
		if (!request || summary === null) {
			return;
		}
		const taskId = await this.store.start(request, summary);
		if (taskId) {
			await this.router.navigate(["/tasks"], { queryParams: { task: taskId } });
		}
	}

	private initialPath(operation: CopyOperation): string {
		const sourcePath = this.sourcePath();
		return operation === "copy" ? `${sourcePath}-copy` : sourcePath;
	}

	private describe({ source, destination, isMove, isRecursive, writeMode, isRewritingReferences }: CopyTaskRequest): string {
		const operation = this.selectedOperation();
		const verb = operation === "duplicate" ? "Duplicates" : isMove ? "Moves" : "Copies";
		const what = source.type === "collection" ? `the documents of the collection ${source.collectionPath}` : `the document ${source.documentPath}`;
		const subcollections = isRecursive ? "with all of its subcollections" : "without its subcollections";
		const place = isSameDatabase(this.database(), destination.database)
			? "in the same database"
			: `in ${this.accounts.labelOf(destination.database.accountId)} / ${destination.database.projectId} / ${destination.database.databaseId}`;
		const sentences = [
			`${verb} ${what} ${subcollections} to ${destination.path} ${place}.`,
			WRITE_MODE_SENTENCES[writeMode],
			isRewritingReferences
				? "References to copied documents are changed to point at their copies; other references stay."
				: "References are copied unchanged.",
		];
		if (isMove) {
			sentences.push("Each source document is deleted only after its copy is written; a document that fails stays at the source.");
		}
		return sentences.join(" ");
	}
}
