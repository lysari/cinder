import { CINDER_FORMAT_VERSION } from "../constants/data-transfer";
import type { CinderExportHeader } from "../interfaces/export.interface";
import type { FirestoreDocument } from "../interfaces/firestore-value.interface";
import type { CinderDocument, CinderHeaderSummary } from "../interfaces/import.interface";
import { isCollectionPath, isDocumentPath } from "./firestore-validation";
import { parseFields } from "./firestore-value-parser";
import { isObject } from "./type-guards";

/** Writes a value as JSON text like `JSON.stringify`, but keeps a negative zero as `-0`. Pass plain JSON data. */
export function toJsonText(value: unknown): string {
	if (typeof value === "number") {
		return Object.is(value, -0) ? "-0" : JSON.stringify(value);
	}
	if (Array.isArray(value)) {
		return `[${value.map(toJsonText).join(",")}]`;
	}
	if (isObject(value)) {
		const members = Object.entries(value).map(([key, member]) => `${JSON.stringify(key)}:${toJsonText(member)}`);
		return `{${members.join(",")}}`;
	}
	return JSON.stringify(value);
}

/** Writes one exported document as a single line of Cinder JSON or NDJSON: its path, times and tagged fields. */
export function cinderDocumentText({ path, createTime, updateTime, fields }: FirestoreDocument): string {
	return toJsonText({ path, createTime, updateTime, fields });
}

/** Writes the start of a Cinder JSON file, up to the opening of its `documents` array. Pass the export's header. */
export function cinderJsonOpening(header: CinderExportHeader): string {
	const headerLines = Object.entries(header).map(([key, value]) => `\t${JSON.stringify(key)}: ${JSON.stringify(value)},`);
	return `{\n${headerLines.join("\n")}\n\t"documents": [\n`;
}

/** Writes the end of a Cinder JSON file after the last document. Pass how many documents it holds. */
export function cinderJsonClosing(documentCount: number): string {
	return `\n\t],\n\t"documentCount": ${documentCount}\n}\n`;
}

/** Reads the header of a Cinder JSON or NDJSON file. Pass the parsed header object and the format it must name; throws when it does not match. */
export function parseCinderHeader(value: unknown, format: string): CinderHeaderSummary {
	if (!isObject(value) || value.format !== format) {
		throw new Error(`The file is not a ${format} export.`);
	}
	if (typeof value.version !== "number" || value.version < 1 || value.version > CINDER_FORMAT_VERSION) {
		throw new Error(`The file has format version ${String(value.version)}; this Cinder reads version ${CINDER_FORMAT_VERSION}.`);
	}
	const { rootPath, exportedAt } = value;
	if (rootPath !== undefined && rootPath !== null && (typeof rootPath !== "string" || !isCollectionPath(rootPath))) {
		throw new Error("The file's rootPath is not a collection path.");
	}
	return { rootPath: rootPath ?? null, exportedAt: typeof exportedAt === "string" ? exportedAt : null };
}

/** Reads one document of a Cinder export and checks its path and tagged fields. Throws with the reason when it is not valid. */
export function parseCinderDocument(value: unknown): CinderDocument {
	if (!isObject(value) || typeof value.path !== "string" || !isDocumentPath(value.path)) {
		throw new Error("The document has no valid path.");
	}
	return { path: value.path, fields: parseFields(value.fields, 1) };
}
