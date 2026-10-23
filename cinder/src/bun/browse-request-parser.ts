import { LISTENER_ID_PATTERN, MAX_LIVE_DOCUMENTS, MAX_PAGE_SIZE } from "../shared/constants/browse-session";
import type {
	CreateDocumentParams,
	DeleteDocumentParams,
	DocumentParams,
	ListCollectionsParams,
	ListDocumentsParams,
	SetDocumentParams,
	UpdateDocumentParams,
} from "../shared/interfaces/browse.interface";
import type { LiveQueryParams, StopLiveParams } from "../shared/interfaces/live.interface";
import type { CountQueryParams, QueryCursor, RunQueryParams, StructuredQuery } from "../shared/interfaces/query.interface";
import { isCollectionPath, isDocumentPath, isValidFieldName, isValidId } from "../shared/utils/firestore-validation";
import { parseFields } from "../shared/utils/firestore-value-parser";
import { validateQuery } from "../shared/utils/query-validation";
import { parseStructuredQuery } from "../shared/utils/structured-query-parser";
import { isObject } from "../shared/utils/type-guards";
import { parseDatabaseTarget } from "./account-request-parser";

export function parseListCollectionsParams(value: unknown): ListCollectionsParams {
	const params = requireObject(value);
	const documentPath = params.documentPath === null ? null : parseDocumentPath(params.documentPath);
	return { database: parseDatabaseTarget(params.database), documentPath };
}

export function parseListDocumentsParams(value: unknown): ListDocumentsParams {
	const params = requireObject(value);
	const { startAfterId } = params;
	const pageSize = parsePageSize(params.pageSize);
	if (startAfterId !== null && (typeof startAfterId !== "string" || !isValidId(startAfterId))) {
		throw new Error("The page cursor must be a document id.");
	}
	return {
		database: parseDatabaseTarget(params.database),
		collectionPath: parseCollectionPath(params.collectionPath),
		pageSize,
		startAfterId,
	};
}

export function parseDocumentParams(value: unknown): DocumentParams {
	const params = requireObject(value);
	return { database: parseDatabaseTarget(params.database), documentPath: parseDocumentPath(params.documentPath) };
}

export function parseCreateDocumentParams(value: unknown): CreateDocumentParams {
	const params = requireObject(value);
	const { documentId } = params;
	if (documentId !== null && (typeof documentId !== "string" || !isValidId(documentId))) {
		throw new Error("A document id is 1 to 1500 bytes long, has no slash, and is not . or .. or __name__.");
	}
	return {
		database: parseDatabaseTarget(params.database),
		collectionPath: parseCollectionPath(params.collectionPath),
		documentId,
		fields: parseFields(params.fields, 1),
	};
}

export function parseUpdateDocumentParams(value: unknown): UpdateDocumentParams {
	const params = requireObject(value);
	const changedFields = parseFields(params.changedFields, 1);
	const { deletedFieldNames } = params;
	if (!Array.isArray(deletedFieldNames) || !deletedFieldNames.every(isFieldName)) {
		throw new Error("The deleted field names must be a list of field names.");
	}
	if (Object.keys(changedFields).length === 0 && deletedFieldNames.length === 0) {
		throw new Error("The update changes no field.");
	}
	if (deletedFieldNames.some((name) => Object.hasOwn(changedFields, name))) {
		throw new Error("A field cannot be changed and deleted in the same update.");
	}
	return {
		database: parseDatabaseTarget(params.database),
		documentPath: parseDocumentPath(params.documentPath),
		changedFields,
		deletedFieldNames,
	};
}

export function parseSetDocumentParams(value: unknown): SetDocumentParams {
	const params = requireObject(value);
	return {
		database: parseDatabaseTarget(params.database),
		documentPath: parseDocumentPath(params.documentPath),
		fields: parseFields(params.fields, 1),
	};
}

export function parseDeleteDocumentParams(value: unknown): DeleteDocumentParams {
	const params = requireObject(value);
	if (typeof params.isRecursive !== "boolean") {
		throw new Error("The delete request must say whether to delete subcollections.");
	}
	return {
		database: parseDatabaseTarget(params.database),
		documentPath: parseDocumentPath(params.documentPath),
		isRecursive: params.isRecursive,
	};
}

export function parseRunQueryParams(value: unknown): RunQueryParams {
	const params = requireObject(value);
	return {
		database: parseDatabaseTarget(params.database),
		query: parseValidQuery(params.query),
		pageSize: parsePageSize(params.pageSize),
		startAfter: params.startAfter === null ? null : parseQueryCursor(params.startAfter),
	};
}

export function parseCountQueryParams(value: unknown): CountQueryParams {
	const params = requireObject(value);
	return { database: parseDatabaseTarget(params.database), query: parseValidQuery(params.query) };
}

export function parseLiveQueryParams(value: unknown): LiveQueryParams {
	const params = requireObject(value);
	const { limit } = params;
	if (typeof limit !== "number" || !Number.isInteger(limit) || limit < 1 || limit > MAX_LIVE_DOCUMENTS) {
		throw new Error(`Live updates follow 1 to ${MAX_LIVE_DOCUMENTS} documents.`);
	}
	return {
		listenerId: parseListenerId(params.listenerId),
		database: parseDatabaseTarget(params.database),
		query: parseValidQuery(params.query),
		limit,
	};
}

export function parseStopLiveParams(value: unknown): StopLiveParams {
	return { listenerId: parseListenerId(requireObject(value).listenerId) };
}

export function parseValidQuery(value: unknown): StructuredQuery {
	const query = parseStructuredQuery(value);
	const [firstIssue] = validateQuery(query);
	if (firstIssue) {
		throw new Error(`The query cannot run: ${firstIssue.message}`);
	}
	return query;
}

function parseQueryCursor(value: unknown): QueryCursor {
	if (
		!isObject(value) ||
		typeof value.documentPath !== "string" ||
		!isDocumentPath(value.documentPath) ||
		!Number.isInteger(value.documentCount) ||
		(value.documentCount as number) < 1
	) {
		throw new Error("The query cursor needs the last loaded document path and how many documents are loaded.");
	}
	return { documentPath: value.documentPath, documentCount: value.documentCount as number };
}

function parseListenerId(value: unknown): string {
	if (typeof value !== "string" || !LISTENER_ID_PATTERN.test(value)) {
		throw new Error("The live view needs an id of 1 to 64 letters, digits or dashes.");
	}
	return value;
}

function parsePageSize(value: unknown): number {
	if (typeof value !== "number" || !Number.isInteger(value) || value < 1 || value > MAX_PAGE_SIZE) {
		throw new Error(`The page size must be a whole number from 1 to ${MAX_PAGE_SIZE}.`);
	}
	return value;
}

export function requireObject(value: unknown): Record<string, unknown> {
	if (!isObject(value)) {
		throw new Error("The request has no parameters.");
	}
	return value;
}

export function parseCollectionPath(value: unknown): string {
	if (typeof value !== "string" || !isCollectionPath(value)) {
		throw new Error("The collection path must be an odd number of ids joined by /.");
	}
	return value;
}

export function parseDocumentPath(value: unknown): string {
	if (typeof value !== "string" || !isDocumentPath(value)) {
		throw new Error("The document path must be an even number of ids joined by /.");
	}
	return value;
}

function isFieldName(value: unknown): value is string {
	return typeof value === "string" && isValidFieldName(value);
}

