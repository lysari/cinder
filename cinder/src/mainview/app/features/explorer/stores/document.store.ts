import { Injectable, computed, inject, signal } from "@angular/core";
import type { DatabaseTarget } from "../../../../../shared/interfaces/account.interface";
import type { FirestoreDocument } from "../../../../../shared/interfaces/firestore-value.interface";
import type { Loadable } from "../../../shared/interfaces/loadable.interface";
import type { FieldDraft } from "../../../shared/interfaces/value-draft.interface";
import { errorMessage } from "../../../shared/utils/error-message";
import { load } from "../../../shared/utils/load";
import { diffFields, fieldDraftsFromFields, fieldsFromDrafts, hasFieldDraftError } from "../../../shared/utils/value-draft";
import { ExplorerApiService } from "../services/explorer-api.service";

@Injectable()
export class DocumentStore {
	private readonly api = inject(ExplorerApiService);
	private database: DatabaseTarget | null = null;
	private documentPath = "";
	private requestVersion = 0;
	readonly document = signal<Loadable<FirestoreDocument | null>>({ status: "loading" });
	readonly subcollections = signal<Loadable<string[]>>({ status: "loading" });
	readonly fieldDrafts = signal<FieldDraft[]>([]);
	readonly isSaving = signal(false);
	readonly saveError = signal<string | null>(null);
	readonly isDeleting = signal(false);
	readonly deleteError = signal<string | null>(null);
	readonly hasErrors = computed(() => hasFieldDraftError(this.fieldDrafts()));
	readonly changes = computed(() => {
		const document = this.document();
		if (document.status !== "loaded" || !document.value || this.hasErrors()) {
			return null;
		}
		const changes = diffFields(document.value.fields, fieldsFromDrafts(this.fieldDrafts()));
		return Object.keys(changes.changedFields).length > 0 || changes.deletedFieldNames.length > 0 ? changes : null;
	});
	readonly isEdited = computed(() => this.hasErrors() || this.changes() !== null);

	open(database: DatabaseTarget, documentPath: string): Promise<void> {
		this.database = database;
		this.documentPath = documentPath;
		return this.refresh();
	}

	async refresh(): Promise<void> {
		if (!this.database) {
			return;
		}
		const { database, documentPath } = this;
		const version = ++this.requestVersion;
		this.document.set({ status: "loading" });
		this.subcollections.set({ status: "loading" });
		this.saveError.set(null);
		this.deleteError.set(null);
		const [document, subcollections] = await Promise.all([
			load(() => this.api.getDocument(database, documentPath)),
			load(() => this.api.listSubcollections(database, documentPath)),
		]);
		if (version !== this.requestVersion) {
			return;
		}
		this.document.set(document);
		this.subcollections.set(subcollections);
		this.fieldDrafts.set(document.status === "loaded" && document.value ? fieldDraftsFromFields(document.value.fields) : []);
	}

	revert(): void {
		const document = this.document();
		this.saveError.set(null);
		this.fieldDrafts.set(document.status === "loaded" && document.value ? fieldDraftsFromFields(document.value.fields) : []);
	}

	async save(): Promise<void> {
		const changes = this.changes();
		if (!this.database || !changes || this.isSaving()) {
			return;
		}
		this.isSaving.set(true);
		this.saveError.set(null);
		try {
			const document = await this.api.updateDocument(this.database, this.documentPath, changes);
			this.document.set({ status: "loaded", value: document });
			this.fieldDrafts.set(fieldDraftsFromFields(document.fields));
		} catch (error) {
			this.saveError.set(errorMessage(error));
		} finally {
			this.isSaving.set(false);
		}
	}

	async delete(isRecursive: boolean): Promise<boolean> {
		if (!this.database || this.isDeleting()) {
			return false;
		}
		this.isDeleting.set(true);
		this.deleteError.set(null);
		try {
			await this.api.deleteDocument(this.database, this.documentPath, isRecursive);
			return true;
		} catch (error) {
			this.deleteError.set(errorMessage(error));
			return false;
		} finally {
			this.isDeleting.set(false);
		}
	}
}
