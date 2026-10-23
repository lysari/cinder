import { MAX_BULK_UPDATE_OPERATIONS } from "../constants/bulk-update";
import type { BulkUpdateIssue, BulkUpdateOperation } from "../interfaces/bulk-update.interface";
import { fieldPathError } from "./query-validation";

/** Lists what keeps a list of bulk update operations from running, each tied to its operation's index (null for the whole list). An empty list means it can run. */
export function validateBulkUpdate(operations: BulkUpdateOperation[]): BulkUpdateIssue[] {
	if (operations.length === 0) {
		return [{ index: null, message: "Add at least one operation." }];
	}
	if (operations.length > MAX_BULK_UPDATE_OPERATIONS) {
		return [{ index: null, message: `A bulk update can have at most ${MAX_BULK_UPDATE_OPERATIONS} operations.` }];
	}
	return operations.flatMap((operation, index) =>
		operationErrors(operation, operations.slice(0, index)).map((message) => ({ index, message })),
	);
}

/** Checks whether two dotted field paths name the same field or one lies inside the other, e.g. "a" and "a.b". */
export function fieldPathsOverlap(first: string, second: string): boolean {
	return first === second || first.startsWith(`${second}.`) || second.startsWith(`${first}.`);
}

function operationErrors(operation: BulkUpdateOperation, earlierOperations: BulkUpdateOperation[]): string[] {
	const errors: string[] = [];
	const pathError = fieldPathError(operation.fieldPath);
	if (pathError) {
		errors.push(pathError);
	}
	switch (operation.type) {
		case "rename": {
			const newPathError = fieldPathError(operation.newFieldPath);
			if (newPathError) {
				errors.push(`New name: ${newPathError}`);
			} else if (fieldPathsOverlap(operation.fieldPath, operation.newFieldPath)) {
				errors.push("The new field path cannot be the field itself or lie inside it.");
			}
			break;
		}
		case "increment":
			if (operation.value.type === "double" && typeof operation.value.value !== "number") {
				errors.push("Increment by a finite number.");
			}
			break;
		case "array-union":
		case "array-remove":
			if (operation.values.length === 0) {
				errors.push("Add at least one value.");
			}
			if (operation.values.some((value) => value.type === "array")) {
				errors.push("A value cannot be an array; an array cannot hold another array.");
			}
			break;
	}
	const timestampIndex = earlierOperations.findIndex(
		(earlier) => earlier.type === "server-timestamp" && touchedPaths(operation).some((path) => fieldPathsOverlap(path, earlier.fieldPath)),
	);
	if (timestampIndex >= 0) {
		errors.push(`Operation ${timestampIndex + 1} sets this field to the server time; put this operation before it.`);
	}
	return errors;
}

function touchedPaths(operation: BulkUpdateOperation): string[] {
	return operation.type === "rename" ? [operation.fieldPath, operation.newFieldPath] : [operation.fieldPath];
}
