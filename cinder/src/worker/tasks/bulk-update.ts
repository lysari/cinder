import { FieldValue, type Firestore } from "@google-cloud/firestore";
import { types } from "node:util";
import { BULK_UPDATE_PREVIEW_DOCUMENTS } from "../../shared/constants/bulk-update";
import { READ_PAGE_SIZE } from "../../shared/constants/data-transfer";
import { MAX_INTEGER, MIN_INTEGER } from "../../shared/constants/firestore-limits";
import type {
	BulkUpdateFieldChange,
	BulkUpdateOperation,
	BulkUpdatePreviewDocument,
	BulkUpdatePreviewResult,
	BulkUpdateTaskRequest,
} from "../../shared/interfaces/bulk-update.interface";
import type {
	FirestoreDoubleValue,
	FirestoreIntegerValue,
	FirestoreValue,
} from "../../shared/interfaces/firestore-value.interface";
import type { TaskContext, WriteTaskResult } from "../../shared/interfaces/task.interface";
import { DocumentWriter } from "../utils/document-writer";
import { buildQuery, countDocuments, readQueryPages } from "../utils/firestore-query";
import { decodeValue } from "../utils/firestore-value-decoder";
import { encodeBigIntDocument } from "../utils/firestore-value-encoder";

type Fields = Record<string, FirestoreValue>;

interface UpdatedDocument {
	fields: Fields;
	touchedPaths: Set<string>;
	serverTimestampPaths: Set<string>;
}

type UpdateOutcome = { isApplied: true; document: UpdatedDocument } | { isApplied: false; problem: string };

export function bulkUpdate(db: Firestore, request: BulkUpdateTaskRequest, context: TaskContext): Promise<WriteTaskResult | BulkUpdatePreviewResult> {
	return request.isDryRun ? previewBulkUpdate(db, request, context) : runBulkUpdate(db, request, context);
}

async function previewBulkUpdate(db: Firestore, { query, operations }: BulkUpdateTaskRequest, context: TaskContext): Promise<BulkUpdatePreviewResult> {
	const limit = Math.min(query.limit ?? BULK_UPDATE_PREVIEW_DOCUMENTS, BULK_UPDATE_PREVIEW_DOCUMENTS);
	const documents: BulkUpdatePreviewDocument[] = [];
	for await (const page of readQueryPages(buildQuery(db, query), limit, limit)) {
		context.progress.reads += page.length;
		for (const snapshot of page) {
			const fields = encodeBigIntDocument(snapshot).fields;
			const outcome = applyOperations(fields, operations);
			documents.push(
				outcome.isApplied
					? { path: snapshot.ref.path, changes: changesOf(fields, outcome.document), problem: null }
					: { path: snapshot.ref.path, changes: [], problem: outcome.problem },
			);
		}
	}
	context.log("info", `Previewed ${documents.length} documents; nothing was written.`);
	return { kind: "bulk-update-preview", documents };
}

async function runBulkUpdate(db: Firestore, { query, operations }: BulkUpdateTaskRequest, context: TaskContext): Promise<WriteTaskResult> {
	const { progress } = context;
	const sdkQuery = buildQuery(db, query);
	void countDocuments(sdkQuery, query.limit).then(
		(count) => {
			progress.totalDocuments = count;
		},
		(error: unknown) => context.log("info", `The number of documents is not known: ${describeError(error)}`),
	);
	const writer = new DocumentWriter(context);
	const updatedPaths = new Set<string>();
	try {
		for await (const page of readQueryPages(sdkQuery, query.limit, READ_PAGE_SIZE)) {
			for (const snapshot of page) {
				const documentPath = snapshot.ref.path;
				if (updatedPaths.has(documentPath)) {
					continue;
				}
				progress.reads += 1;
				const fields = encodeBigIntDocument(snapshot).fields;
				const outcome = applyOperations(fields, operations);
				if (!outcome.isApplied) {
					writer.fail({ documentPath, rowNumber: null, message: outcome.problem });
					continue;
				}
				const changedPaths = writtenPathsOf(changesOf(fields, outcome.document));
				if (changedPaths.length === 0) {
					progress.skips += 1;
					continue;
				}
				updatedPaths.add(documentPath);
				await writer.update(snapshot, updateDataOf(outcome.document, changedPaths, db));
			}
		}
	} catch (error) {
		await writer.close();
		throw new Error(`${describeError(error)} ${progress.writes} documents were updated before this error and stay updated.`);
	}
	return writer.close();
}

function applyOperations(fields: Fields, operations: BulkUpdateOperation[]): UpdateOutcome {
	const document: UpdatedDocument = { fields: structuredClone(fields), touchedPaths: new Set(), serverTimestampPaths: new Set() };
	for (const operation of operations) {
		const problem = applyOperation(document, operation);
		if (problem !== null) {
			return { isApplied: false, problem };
		}
	}
	return { isApplied: true, document };
}

function applyOperation({ fields, touchedPaths, serverTimestampPaths }: UpdatedDocument, operation: BulkUpdateOperation): string | null {
	const { fieldPath } = operation;
	const current = valueAt(fields, fieldPath);
	touchedPaths.add(fieldPath);
	switch (operation.type) {
		case "set":
			setValueAt(fields, fieldPath, operation.value);
			return null;
		case "delete":
			deleteValueAt(fields, fieldPath);
			return null;
		case "rename":
			if (current === undefined) {
				return null;
			}
			if (valueAt(fields, operation.newFieldPath) !== undefined && !operation.isOverwriting) {
				return `The field ${operation.newFieldPath} already exists, so ${fieldPath} was not renamed. Allow overwriting to replace it.`;
			}
			touchedPaths.add(operation.newFieldPath);
			deleteValueAt(fields, fieldPath);
			setValueAt(fields, operation.newFieldPath, current);
			return null;
		case "increment": {
			const value = incremented(current, operation.value);
			if (value === null) {
				return `Incrementing ${fieldPath} would go beyond the 64-bit integer range.`;
			}
			setValueAt(fields, fieldPath, value);
			return null;
		}
		case "array-union": {
			const items = current?.type === "array" ? [...current.value] : [];
			for (const value of operation.values) {
				if (!items.some((item) => isSameValue(item, value))) {
					items.push(value);
				}
			}
			setValueAt(fields, fieldPath, { type: "array", value: items });
			return null;
		}
		case "array-remove": {
			const items = current?.type === "array" ? current.value : [];
			const remaining = items.filter((item) => !operation.values.some((value) => isSameValue(item, value)));
			setValueAt(fields, fieldPath, { type: "array", value: remaining });
			return null;
		}
		case "server-timestamp":
			setValueAt(fields, fieldPath, { type: "null" });
			deleteValueAt(fields, fieldPath);
			serverTimestampPaths.add(fieldPath);
			return null;
	}
}

function incremented(current: FirestoreValue | undefined, delta: FirestoreIntegerValue | FirestoreDoubleValue): FirestoreValue | null {
	if (current?.type === "integer" && delta.type === "integer") {
		const sum = BigInt(current.value) + BigInt(delta.value);
		return sum < MIN_INTEGER || sum > MAX_INTEGER ? null : { type: "integer", value: sum.toString() };
	}
	if (current?.type === "integer" || current?.type === "double") {
		return doubleValue(Number(current.value) + Number(delta.value));
	}
	return delta;
}

function changesOf(original: Fields, { fields, touchedPaths, serverTimestampPaths }: UpdatedDocument): BulkUpdateFieldChange[] {
	return [...touchedPaths].flatMap((fieldPath) => {
		const before = valueAt(original, fieldPath) ?? null;
		const after = valueAt(fields, fieldPath) ?? null;
		const isServerTimestamp = serverTimestampPaths.has(fieldPath);
		return isServerTimestamp || !isSameValue(before, after) ? [{ fieldPath, before, after, isServerTimestamp }] : [];
	});
}

function writtenPathsOf(changes: BulkUpdateFieldChange[]): string[] {
	const paths = changes.map((change) => change.fieldPath);
	return paths.filter((path) => !paths.some((other) => path.startsWith(`${other}.`)));
}

function updateDataOf({ fields, serverTimestampPaths }: UpdatedDocument, paths: string[], db: Firestore): Record<string, unknown> {
	return Object.fromEntries(
		paths.map((path) => {
			if (serverTimestampPaths.has(path)) {
				return [path, FieldValue.serverTimestamp()];
			}
			const value = valueAt(fields, path);
			if (value === undefined) {
				return [path, FieldValue.delete()];
			}
			const decoded = decodeValue(value, db);
			for (const timestampPath of serverTimestampPaths) {
				if (timestampPath.startsWith(`${path}.`)) {
					setNestedObjectValue(decoded as Record<string, unknown>, timestampPath.slice(path.length + 1).split("."), FieldValue.serverTimestamp());
				}
			}
			return [path, decoded];
		}),
	);
}

function setNestedObjectValue(target: Record<string, unknown>, segments: string[], value: unknown): void {
	const [segment, ...rest] = segments as [string, ...string[]];
	if (rest.length === 0) {
		target[segment] = value;
		return;
	}
	if (!Object.hasOwn(target, segment)) {
		target[segment] = {};
	}
	setNestedObjectValue(target[segment] as Record<string, unknown>, rest, value);
}

function valueAt(fields: Fields, fieldPath: string): FirestoreValue | undefined {
	const segments = fieldPath.split(".");
	const parent = mapAt(fields, segments.slice(0, -1));
	const name = segments[segments.length - 1] as string;
	return parent && Object.hasOwn(parent, name) ? parent[name] : undefined;
}

function mapAt(fields: Fields, segments: string[]): Fields | undefined {
	let current: Fields = fields;
	for (const segment of segments) {
		const next = Object.hasOwn(current, segment) ? current[segment] : undefined;
		if (next?.type !== "map") {
			return undefined;
		}
		current = next.value;
	}
	return current;
}

function setValueAt(fields: Fields, fieldPath: string, value: FirestoreValue): void {
	const segments = fieldPath.split(".");
	let current = fields;
	for (const segment of segments.slice(0, -1)) {
		const next = Object.hasOwn(current, segment) ? current[segment] : undefined;
		if (next?.type === "map") {
			current = next.value;
		} else {
			const created: Fields = {};
			current[segment] = { type: "map", value: created };
			current = created;
		}
	}
	current[segments[segments.length - 1] as string] = value;
}

function deleteValueAt(fields: Fields, fieldPath: string): void {
	const segments = fieldPath.split(".");
	const parent = mapAt(fields, segments.slice(0, -1));
	if (parent) {
		delete parent[segments[segments.length - 1] as string];
	}
}

function doubleValue(value: number): FirestoreDoubleValue {
	if (Number.isNaN(value)) {
		return { type: "double", value: "NaN" };
	}
	if (!Number.isFinite(value)) {
		return { type: "double", value: value > 0 ? "Infinity" : "-Infinity" };
	}
	return { type: "double", value };
}

function isSameValue(first: FirestoreValue | null, second: FirestoreValue | null): boolean {
	return canonicalJson(first) === canonicalJson(second);
}

function canonicalJson(value: unknown): string {
	return JSON.stringify(value, (_key, nested: unknown) =>
		nested && typeof nested === "object" && !Array.isArray(nested)
			? Object.fromEntries(Object.entries(nested).sort(([first], [second]) => (first < second ? -1 : first > second ? 1 : 0)))
			: nested,
	);
}

function describeError(error: unknown): string {
	return types.isNativeError(error) ? error.message : String(error);
}
