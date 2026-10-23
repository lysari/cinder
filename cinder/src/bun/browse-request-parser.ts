import { MAX_PAGE_SIZE } from "../shared/constants/browse-session";
import {
	MAX_LATITUDE,
	MAX_LONGITUDE,
	MAX_NANOS,
	MAX_TIMESTAMP_SECONDS,
	MAX_VALUE_DEPTH,
	MIN_LATITUDE,
	MIN_LONGITUDE,
	MIN_TIMESTAMP_SECONDS,
} from "../shared/constants/firestore-limits";
import type {
	CreateDocumentParams,
	DeleteDocumentParams,
	DocumentParams,
	ListCollectionsParams,
	ListDocumentsParams,
	SetDocumentParams,
	UpdateDocumentParams,
} from "../shared/interfaces/browse.interface";
import type { FirestoreValue, NonFiniteDouble } from "../shared/interfaces/firestore-value.interface";
import {
	isBase64Text,
	isCollectionPath,
	isDocumentPath,
	isIntegerText,
	isValidFieldName,
	isValidId,
} from "../shared/utils/firestore-validation";
import { isObject } from "../shared/utils/type-guards";
import { parseDatabaseTarget } from "./account-request-parser";

const NON_FINITE_DOUBLES: NonFiniteDouble[] = ["NaN", "Infinity", "-Infinity"];

export function parseListCollectionsParams(value: unknown): ListCollectionsParams {
	const params = requireObject(value);
	const documentPath = params.documentPath === null ? null : parseDocumentPath(params.documentPath);
	return { database: parseDatabaseTarget(params.database), documentPath };
}

export function parseListDocumentsParams(value: unknown): ListDocumentsParams {
	const params = requireObject(value);
	const { pageSize, startAfterId } = params;
	if (typeof pageSize !== "number" || !Number.isInteger(pageSize) || pageSize < 1 || pageSize > MAX_PAGE_SIZE) {
		throw new Error(`The page size must be a whole number from 1 to ${MAX_PAGE_SIZE}.`);
	}
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

function requireObject(value: unknown): Record<string, unknown> {
	if (!isObject(value)) {
		throw new Error("The request has no parameters.");
	}
	return value;
}

function parseCollectionPath(value: unknown): string {
	if (typeof value !== "string" || !isCollectionPath(value)) {
		throw new Error("The collection path must be an odd number of ids joined by /.");
	}
	return value;
}

function parseDocumentPath(value: unknown): string {
	if (typeof value !== "string" || !isDocumentPath(value)) {
		throw new Error("The document path must be an even number of ids joined by /.");
	}
	return value;
}

function isFieldName(value: unknown): value is string {
	return typeof value === "string" && isValidFieldName(value);
}

function parseFields(value: unknown, depth: number): Record<string, FirestoreValue> {
	if (!isObject(value) || Array.isArray(value)) {
		throw new Error("Fields must be an object of tagged values.");
	}
	return Object.fromEntries(
		Object.entries(value).map(([name, field]) => {
			if (!isValidFieldName(name)) {
				throw new Error(`"${name}" is not a valid field name.`);
			}
			return [name, parseValue(field, depth)];
		}),
	);
}

function parseValue(value: unknown, depth: number): FirestoreValue {
	if (depth > MAX_VALUE_DEPTH) {
		throw new Error(`Values may nest at most ${MAX_VALUE_DEPTH} levels deep.`);
	}
	if (!isObject(value)) {
		throw new Error("Each value must be a tagged value.");
	}
	switch (value.type) {
		case "null":
			return { type: "null" };
		case "boolean":
			if (typeof value.value !== "boolean") {
				throw new Error("A boolean value must be true or false.");
			}
			return { type: "boolean", value: value.value };
		case "integer":
			if (typeof value.value !== "string" || !isIntegerText(value.value)) {
				throw new Error("An integer must be a whole number in the 64-bit range.");
			}
			return { type: "integer", value: value.value };
		case "double":
			return { type: "double", value: parseDouble(value.value) };
		case "string":
			if (typeof value.value !== "string") {
				throw new Error("A string value must be text.");
			}
			return { type: "string", value: value.value };
		case "bytes":
			if (typeof value.value !== "string" || !isBase64Text(value.value)) {
				throw new Error("A bytes value must be base64 text.");
			}
			return { type: "bytes", value: value.value };
		case "timestamp":
			return { type: "timestamp", value: parseTimestamp(value.value) };
		case "geopoint":
			return { type: "geopoint", value: parseGeoPoint(value.value) };
		case "reference":
			if (typeof value.value !== "string" || !isDocumentPath(value.value)) {
				throw new Error("A reference must be a document path.");
			}
			return { type: "reference", value: value.value };
		case "vector":
			if (!Array.isArray(value.value) || value.value.length === 0 || !value.value.every(isFiniteNumber)) {
				throw new Error("A vector must be a non-empty list of finite numbers.");
			}
			return { type: "vector", value: value.value };
		case "array":
			return { type: "array", value: parseArray(value.value, depth) };
		case "map":
			return { type: "map", value: parseFields(value.value, depth + 1) };
		default:
			throw new Error("Unknown value type.");
	}
}

function parseDouble(value: unknown): number | NonFiniteDouble {
	if (isFiniteNumber(value)) {
		return value;
	}
	const nonFinite = NON_FINITE_DOUBLES.find((text) => text === value);
	if (!nonFinite) {
		throw new Error("A double must be a number, NaN, Infinity or -Infinity.");
	}
	return nonFinite;
}

function parseTimestamp(value: unknown): { seconds: number; nanos: number } {
	if (
		!isObject(value) ||
		!Number.isInteger(value.seconds) ||
		!Number.isInteger(value.nanos) ||
		(value.seconds as number) < MIN_TIMESTAMP_SECONDS ||
		(value.seconds as number) > MAX_TIMESTAMP_SECONDS ||
		(value.nanos as number) < 0 ||
		(value.nanos as number) > MAX_NANOS
	) {
		throw new Error("A timestamp must lie between the years 1 and 9999.");
	}
	return { seconds: value.seconds as number, nanos: value.nanos as number };
}

function parseGeoPoint(value: unknown): { latitude: number; longitude: number } {
	if (
		!isObject(value) ||
		!isFiniteNumber(value.latitude) ||
		!isFiniteNumber(value.longitude) ||
		value.latitude < MIN_LATITUDE ||
		value.latitude > MAX_LATITUDE ||
		value.longitude < MIN_LONGITUDE ||
		value.longitude > MAX_LONGITUDE
	) {
		throw new Error("A geopoint needs a latitude from -90 to 90 and a longitude from -180 to 180.");
	}
	return { latitude: value.latitude, longitude: value.longitude };
}

function parseArray(value: unknown, depth: number): FirestoreValue[] {
	if (!Array.isArray(value)) {
		throw new Error("An array value must be a list of tagged values.");
	}
	return value.map((item) => {
		const parsed = parseValue(item, depth + 1);
		if (parsed.type === "array") {
			throw new Error("An array cannot hold another array directly; wrap it in a map.");
		}
		return parsed;
	});
}

function isFiniteNumber(value: unknown): value is number {
	return typeof value === "number" && Number.isFinite(value);
}
