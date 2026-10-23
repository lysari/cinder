import type { BulkUpdateIssue, BulkUpdateOperation, BulkUpdateOperationType } from "../../../../shared/interfaces/bulk-update.interface";
import type { FirestoreDoubleValue, FirestoreIntegerValue, FirestoreValue } from "../../../../shared/interfaces/firestore-value.interface";
import { validateBulkUpdate } from "../../../../shared/utils/bulk-update-validation";
import type { BulkUpdateFormResult, BulkUpdateOperationForm } from "../interfaces/bulk-update-form.interface";
import type { ValueDraft } from "../interfaces/value-draft.interface";
import { hasDraftError, valueFromDraft } from "./value-draft";

const PLACEHOLDER_VALUE: FirestoreValue = { type: "null" };
const PLACEHOLDER_DELTA: FirestoreIntegerValue = { type: "integer", value: "0" };

/** Creates the value an operation row starts with when its type is chosen: 1 for an increment, a list with one empty string for array operations, an empty string otherwise. */
export function initialOperationValue(type: BulkUpdateOperationType): ValueDraft {
	switch (type) {
		case "increment":
			return { type: "integer", text: "1" };
		case "array-union":
		case "array-remove":
			return { type: "array", items: [{ type: "string", text: "" }] };
		default:
			return { type: "string", text: "" };
	}
}

/** Reads the bulk update form rows. Returns the operations with every issue tied to its row, or null operations while a typed value cannot be read. */
export function readBulkUpdateForm(rows: BulkUpdateOperationForm[]): BulkUpdateFormResult {
	const valueIssues: BulkUpdateIssue[] = [];
	const operations = rows.map((row, index) => {
		const { operation, issue } = readOperation(row);
		if (issue) {
			valueIssues.push({ index, message: issue });
		}
		return operation;
	});
	const issues = [...valueIssues, ...validateBulkUpdate(operations)];
	return { operations: valueIssues.length === 0 ? operations : null, issues };
}

function readOperation({ type, fieldPath, newFieldPath, isOverwriting, value }: BulkUpdateOperationForm): {
	operation: BulkUpdateOperation;
	issue: string | null;
} {
	switch (type) {
		case "set":
			return hasDraftError(value)
				? { operation: { type, fieldPath, value: PLACEHOLDER_VALUE }, issue: "Fix the value." }
				: { operation: { type, fieldPath, value: valueFromDraft(value) }, issue: null };
		case "delete":
		case "server-timestamp":
			return { operation: { type, fieldPath }, issue: null };
		case "rename":
			return { operation: { type, fieldPath, newFieldPath, isOverwriting }, issue: null };
		case "increment": {
			if ((value.type !== "integer" && value.type !== "double") || hasDraftError(value)) {
				return { operation: { type, fieldPath, value: PLACEHOLDER_DELTA }, issue: "Increment by an integer or a double." };
			}
			return { operation: { type, fieldPath, value: valueFromDraft(value) as FirestoreIntegerValue | FirestoreDoubleValue }, issue: null };
		}
		case "array-union":
		case "array-remove":
			if (value.type !== "array" || hasDraftError(value)) {
				return { operation: { type, fieldPath, values: [PLACEHOLDER_VALUE] }, issue: "Enter a list of valid values." };
			}
			return { operation: { type, fieldPath, values: value.items.map(valueFromDraft) }, issue: null };
	}
}
