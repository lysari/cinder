import {
	CSV_COLUMN_TYPES,
	CSV_DELIMITERS,
	EXPORT_FORMATS,
	IMPORT_FORMATS,
	WRITE_MODES,
	type WriteMode,
} from "../shared/constants/data-transfer";
import type { BulkUpdateOperation, BulkUpdateTaskRequest } from "../shared/interfaces/bulk-update.interface";
import type { CopySource, CopyTaskRequest } from "../shared/interfaces/copy.interface";
import type { CsvColumnMapping, LoadCsvTaskRequest } from "../shared/interfaces/csv.interface";
import type { DeleteSource } from "../shared/interfaces/delete-collection.interface";
import type { ExportSource, ExportTaskRequest } from "../shared/interfaces/export.interface";
import type { ImportTarget, ImportTaskRequest } from "../shared/interfaces/import.interface";
import type { TaskRequest } from "../shared/interfaces/task.interface";
import { validateBulkUpdate } from "../shared/utils/bulk-update-validation";
import { copyRequestError } from "../shared/utils/copy-validation";
import { isSupportedTimeZone } from "../shared/utils/csv-values";
import { exportFileNameError } from "../shared/utils/export-file-name";
import { isValidFieldName, isValidId } from "../shared/utils/firestore-validation";
import { parseValue } from "../shared/utils/firestore-value-parser";
import { isObject } from "../shared/utils/type-guards";
import { parseDatabaseTarget } from "./account-request-parser";
import { parseCollectionPath, parseDocumentPath, parseValidQuery, requireObject } from "./browse-request-parser";
import type { FileAccess } from "./services/file-access";

export function parseTaskRequest(value: unknown, fileAccess: FileAccess): TaskRequest {
	if (!isObject(value)) {
		throw new Error("Unknown task type.");
	}
	switch (value.type) {
		case "run-script":
			if (typeof value.script !== "string") {
				throw new Error("A run-script task needs a script.");
			}
			return { type: "run-script", database: parseDatabaseTarget(value.database), script: value.script };
		case "export":
			return parseExportRequest(value, fileAccess);
		case "import":
			return parseImportRequest(value, fileAccess);
		case "analyze-csv":
			return { type: "analyze-csv", database: parseDatabaseTarget(value.database), filePath: fileAccess.requireFile(value.filePath) };
		case "load-csv":
			return parseLoadCsvRequest(value, fileAccess);
		case "bulk-update":
			return parseBulkUpdateRequest(value);
		case "copy":
			return parseCopyRequest(value);
		case "delete-collection":
			return { type: "delete-collection", database: parseDatabaseTarget(value.database), source: parseDeleteSource(value.source) };
		default:
			throw new Error("Unknown task type.");
	}
}

function parseExportRequest(value: Record<string, unknown>, fileAccess: FileAccess): ExportTaskRequest {
	const format = EXPORT_FORMATS.find((candidate) => candidate === value.format);
	if (!format) {
		throw new Error("Choose an export format.");
	}
	if (typeof value.fileName !== "string") {
		throw new Error("The export needs a file name.");
	}
	const nameError = exportFileNameError(value.fileName, format);
	if (nameError) {
		throw new Error(nameError);
	}
	if (typeof value.isOverwriting !== "boolean") {
		throw new Error("The export must say whether it may replace an existing file.");
	}
	return {
		type: "export",
		database: parseDatabaseTarget(value.database),
		source: parseExportSource(value.source),
		format,
		folderPath: fileAccess.requireFolder(value.folderPath),
		fileName: value.fileName,
		isOverwriting: value.isOverwriting,
	};
}

function parseExportSource(value: unknown): ExportSource {
	const source = requireObject(value);
	switch (source.type) {
		case "collection":
			return { type: "collection", collectionPath: parseCollectionPath(source.collectionPath), isRecursive: parseIsRecursive(source) };
		case "collection-group":
			if (typeof source.collectionId !== "string" || !isValidId(source.collectionId)) {
				throw new Error("A collection group needs a collection id without /.");
			}
			return { type: "collection-group", collectionId: source.collectionId };
		case "query":
			return { type: "query", query: parseValidQuery(source.query) };
		case "document":
			return { type: "document", documentPath: parseDocumentPath(source.documentPath), isRecursive: parseIsRecursive(source) };
		default:
			throw new Error("The export source must be a collection, collection group, query or document.");
	}
}

function parseIsRecursive(source: Record<string, unknown>): boolean {
	if (typeof source.isRecursive !== "boolean") {
		throw new Error("The export must say whether to include subcollections.");
	}
	return source.isRecursive;
}

function parseImportRequest(value: Record<string, unknown>, fileAccess: FileAccess): ImportTaskRequest {
	const format = IMPORT_FORMATS.find((candidate) => candidate === value.format);
	if (!format) {
		throw new Error("The import format must be Cinder JSON, NDJSON or JSON.");
	}
	const target = parseImportTarget(value.target);
	if (format === "json" && target.type !== "collection") {
		throw new Error("A plain JSON file is imported into a collection.");
	}
	return {
		type: "import",
		database: parseDatabaseTarget(value.database),
		filePath: fileAccess.requireFile(value.filePath),
		format,
		target,
		writeMode: parseWriteMode(value.writeMode),
	};
}

function parseImportTarget(value: unknown): ImportTarget {
	const target = requireObject(value);
	if (target.type === "original-paths") {
		return { type: "original-paths" };
	}
	if (target.type === "collection") {
		return { type: "collection", collectionPath: parseCollectionPath(target.collectionPath) };
	}
	throw new Error("The import target must be the original paths or a collection.");
}

function parseLoadCsvRequest(value: Record<string, unknown>, fileAccess: FileAccess): LoadCsvTaskRequest {
	const delimiter = CSV_DELIMITERS.find((candidate) => candidate === value.delimiter);
	if (!delimiter) {
		throw new Error("The CSV delimiter must be a comma, semicolon, tab or bar.");
	}
	if (!Array.isArray(value.columns)) {
		throw new Error("The CSV load needs its column mapping.");
	}
	const columns = value.columns.map(parseColumnMapping);
	const idColumnIndex = parseIdColumnIndex(value.idColumnIndex, columns.length);
	requireDistinctFieldNames(columns.filter((column) => column.isIncluded));
	if (typeof value.timeZone !== "string" || !isSupportedTimeZone(value.timeZone)) {
		throw new Error("Choose a known time zone.");
	}
	return {
		type: "load-csv",
		database: parseDatabaseTarget(value.database),
		filePath: fileAccess.requireFile(value.filePath),
		delimiter,
		collectionPath: parseCollectionPath(value.collectionPath),
		idColumnIndex,
		columns,
		timeZone: value.timeZone,
		writeMode: parseWriteMode(value.writeMode),
	};
}

function parseColumnMapping(value: unknown, index: number): CsvColumnMapping {
	const column = requireObject(value);
	const type = CSV_COLUMN_TYPES.find((candidate) => candidate === column.type);
	if (column.index !== index || typeof column.isIncluded !== "boolean" || typeof column.fieldName !== "string" || !type) {
		throw new Error(`Column ${index + 1} needs its index, whether it is included, a field name and a type.`);
	}
	if (column.isIncluded && !column.fieldName.split(".").every(isValidFieldName)) {
		throw new Error(`"${column.fieldName}" is not a valid field name; separate nested names with dots.`);
	}
	return { index, isIncluded: column.isIncluded, fieldName: column.fieldName, type };
}

function parseIdColumnIndex(value: unknown, columnCount: number): number | null {
	if (value === null) {
		return null;
	}
	if (typeof value !== "number" || !Number.isInteger(value) || value < 0 || value >= columnCount) {
		throw new Error("The id column must be one of the CSV columns, or null for generated ids.");
	}
	return value;
}

function requireDistinctFieldNames(columns: CsvColumnMapping[]): void {
	const names = columns.map((column) => column.fieldName);
	for (const name of names) {
		if (names.filter((other) => other === name).length > 1) {
			throw new Error(`Two columns write the field "${name}".`);
		}
		if (names.some((other) => other.startsWith(`${name}.`))) {
			throw new Error(`"${name}" cannot be both a value and a map of nested fields.`);
		}
	}
}

function parseWriteMode(value: unknown): WriteMode {
	const writeMode = WRITE_MODES.find((candidate) => candidate === value);
	if (!writeMode) {
		throw new Error("The write mode must be overwrite, merge or skip.");
	}
	return writeMode;
}

function parseBulkUpdateRequest(value: Record<string, unknown>): BulkUpdateTaskRequest {
	if (!Array.isArray(value.operations)) {
		throw new Error("The bulk update needs a list of operations.");
	}
	if (typeof value.isDryRun !== "boolean") {
		throw new Error("The bulk update must say whether it is a preview.");
	}
	const operations = value.operations.map(parseBulkUpdateOperation);
	const [firstIssue] = validateBulkUpdate(operations);
	if (firstIssue) {
		throw new Error(firstIssue.index === null ? firstIssue.message : `Operation ${firstIssue.index + 1}: ${firstIssue.message}`);
	}
	return {
		type: "bulk-update",
		database: parseDatabaseTarget(value.database),
		query: parseValidQuery(value.query),
		operations,
		isDryRun: value.isDryRun,
	};
}

function parseBulkUpdateOperation(value: unknown, index: number): BulkUpdateOperation {
	const operation = requireObject(value);
	const { fieldPath } = operation;
	const name = `Operation ${index + 1}`;
	if (typeof fieldPath !== "string") {
		throw new Error(`${name} needs a field path.`);
	}
	switch (operation.type) {
		case "set":
			return { type: "set", fieldPath, value: parseValue(operation.value, 1) };
		case "delete":
			return { type: "delete", fieldPath };
		case "server-timestamp":
			return { type: "server-timestamp", fieldPath };
		case "rename":
			if (typeof operation.newFieldPath !== "string" || typeof operation.isOverwriting !== "boolean") {
				throw new Error(`${name}: a rename needs the new field path and whether it may overwrite an existing field.`);
			}
			return { type: "rename", fieldPath, newFieldPath: operation.newFieldPath, isOverwriting: operation.isOverwriting };
		case "increment": {
			const delta = parseValue(operation.value, 1);
			if (delta.type !== "integer" && delta.type !== "double") {
				throw new Error(`${name}: increment by an integer or a double.`);
			}
			return { type: "increment", fieldPath, value: delta };
		}
		case "array-union":
		case "array-remove":
			if (!Array.isArray(operation.values)) {
				throw new Error(`${name} needs a list of values.`);
			}
			return { type: operation.type, fieldPath, values: operation.values.map((item) => parseValue(item, 2)) };
		default:
			throw new Error(`${name} has an unknown type.`);
	}
}

function parseCopyRequest(value: Record<string, unknown>): CopyTaskRequest {
	const destination = requireObject(value.destination);
	const { isMove, isRecursive, isRewritingReferences } = value;
	if (typeof destination.path !== "string") {
		throw new Error("The copy needs a destination path.");
	}
	if (typeof isMove !== "boolean" || typeof isRecursive !== "boolean" || typeof isRewritingReferences !== "boolean") {
		throw new Error("The copy must say whether it moves, includes subcollections and rewrites references.");
	}
	const request: CopyTaskRequest = {
		type: "copy",
		database: parseDatabaseTarget(value.database),
		source: parseCopySource(value.source),
		destination: { database: parseDatabaseTarget(destination.database), path: destination.path },
		isMove,
		isRecursive,
		writeMode: parseWriteMode(value.writeMode),
		isRewritingReferences,
	};
	const error = copyRequestError(request);
	if (error) {
		throw new Error(error);
	}
	return request;
}

function parseCopySource(value: unknown): CopySource {
	const source = requireObject(value);
	switch (source.type) {
		case "collection":
			return { type: "collection", collectionPath: parseCollectionPath(source.collectionPath) };
		case "document":
			return { type: "document", documentPath: parseDocumentPath(source.documentPath) };
		default:
			throw new Error("The copy source must be a collection or a document.");
	}
}

function parseDeleteSource(value: unknown): DeleteSource {
	const source = requireObject(value);
	switch (source.type) {
		case "collection":
			return { type: "collection", collectionPath: parseCollectionPath(source.collectionPath) };
		case "query":
			return { type: "query", query: parseValidQuery(source.query) };
		default:
			throw new Error("The delete source must be a collection or a query.");
	}
}
