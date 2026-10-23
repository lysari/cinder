import type {
	BulkUpdateIssue,
	BulkUpdateOperation,
	BulkUpdateOperationType,
} from "../../../../shared/interfaces/bulk-update.interface";
import type { ValueDraft } from "./value-draft.interface";

export interface BulkUpdateOperationForm {
	type: BulkUpdateOperationType;
	fieldPath: string;
	newFieldPath: string;
	isOverwriting: boolean;
	value: ValueDraft;
}

export interface BulkUpdateFormResult {
	operations: BulkUpdateOperation[] | null;
	issues: BulkUpdateIssue[];
}
