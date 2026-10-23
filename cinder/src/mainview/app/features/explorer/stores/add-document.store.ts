import { Injectable, computed, inject, signal } from "@angular/core";
import type { DatabaseTarget } from "../../../../../shared/interfaces/account.interface";
import type { FirestoreDocument } from "../../../../../shared/interfaces/firestore-value.interface";
import { isValidId } from "../../../../../shared/utils/firestore-validation";
import type { FieldDraft } from "../../../shared/interfaces/value-draft.interface";
import { createAutoId } from "../../../shared/utils/auto-id";
import { errorMessage } from "../../../shared/utils/error-message";
import { fieldsFromDrafts, hasFieldDraftError } from "../../../shared/utils/value-draft";
import { ExplorerApiService } from "../services/explorer-api.service";

@Injectable()
export class AddDocumentStore {
	private readonly api = inject(ExplorerApiService);
	readonly autoId = createAutoId();
	readonly isAutoId = signal(true);
	readonly documentId = signal("");
	readonly fieldDrafts = signal<FieldDraft[]>([]);
	readonly isCreating = signal(false);
	readonly error = signal<string | null>(null);
	readonly documentIdError = computed(() =>
		this.isAutoId() || isValidId(this.documentId())
			? null
			: "Enter an id of up to 1500 bytes without a slash; . and .. and ids like __id__ are reserved.",
	);
	readonly canCreate = computed(
		() => !this.isCreating() && this.documentIdError() === null && !hasFieldDraftError(this.fieldDrafts()),
	);

	async create(database: DatabaseTarget, collectionPath: string): Promise<FirestoreDocument | null> {
		if (!this.canCreate()) {
			return null;
		}
		this.isCreating.set(true);
		this.error.set(null);
		try {
			return await this.api.createDocument({
				database,
				collectionPath,
				documentId: this.isAutoId() ? this.autoId : this.documentId(),
				fields: fieldsFromDrafts(this.fieldDrafts()),
			});
		} catch (error) {
			this.error.set(errorMessage(error));
			return null;
		} finally {
			this.isCreating.set(false);
		}
	}
}
