import type { Firestore } from "@google-cloud/firestore";
import { JSONParser } from "@streamparser/json";
import { types } from "node:util";
import { CINDER_JSON_FORMAT, CINDER_NDJSON_FORMAT } from "../../shared/constants/data-transfer";
import type { CinderHeaderSummary, ImportTarget, ImportTaskRequest } from "../../shared/interfaces/import.interface";
import type { TaskContext, WriteTaskResult } from "../../shared/interfaces/task.interface";
import { parseCinderDocument, parseCinderHeader } from "../../shared/utils/cinder-json";
import { isValidId } from "../../shared/utils/firestore-validation";
import { fieldsFromPlainJson } from "../../shared/utils/firestore-value-json";
import { isObject } from "../../shared/utils/type-guards";
import { DocumentWriter } from "../utils/document-writer";
import { readFileChunks, readTextLines } from "../utils/file-reader";
import { decodeFields } from "../utils/firestore-value-decoder";

const CINDER_HEADER_PATHS = ["$.format", "$.version", "$.rootPath", "$.exportedAt"];
const CINDER_DOCUMENT_PATH = "$.documents.*";
const PLAIN_ITEM_PATH = "$.*";
const PLAIN_ID_KEY = "__id";
const PLAIN_PATH_KEY = "__path";

interface JsonItem {
	key: string | number | undefined;
	value: unknown;
}

export async function importDocuments(db: Firestore, request: ImportTaskRequest, context: TaskContext): Promise<WriteTaskResult> {
	const writer = new DocumentWriter(context);
	const chunks = readFileChunks(request.filePath, context.progress);
	try {
		switch (request.format) {
			case "cinder-json":
				await importCinderJson(chunks, (value, header) => writeCinderDocument(db, writer, value, request, header));
				break;
			case "ndjson":
				await importCinderNdjson(chunks, (value, header) => writeCinderDocument(db, writer, value, request, header));
				break;
			case "json":
				await importPlainJson(chunks, (item) => writePlainItem(db, writer, item, request));
				break;
		}
	} catch (error) {
		await writer.close();
		throw new Error(`${describeError(error)} ${context.progress.writes} documents were written before this error and stay.`);
	}
	return writer.close();
}

async function importCinderJson(
	chunks: AsyncIterable<Uint8Array>,
	writeDocument: (value: unknown, header: CinderHeaderSummary) => Promise<void>,
): Promise<void> {
	const headerFields: Record<string, unknown> = {};
	let header: CinderHeaderSummary | null = null;
	await readJsonItems(chunks, [...CINDER_HEADER_PATHS, CINDER_DOCUMENT_PATH], async ({ key, value }) => {
		if (typeof key === "string") {
			headerFields[key] = value;
			return;
		}
		header ??= parseCinderHeader(headerFields, CINDER_JSON_FORMAT);
		await writeDocument(value, header);
	});
	header ??= parseCinderHeader(headerFields, CINDER_JSON_FORMAT);
}

async function importCinderNdjson(
	chunks: AsyncIterable<Uint8Array>,
	writeDocument: (value: unknown, header: CinderHeaderSummary) => Promise<void>,
): Promise<void> {
	let header: CinderHeaderSummary | null = null;
	for await (const { text, lineNumber } of readTextLines(chunks)) {
		if (text.trim().length === 0) {
			continue;
		}
		const value = parseJsonLine(text, lineNumber);
		if (header === null) {
			header = parseCinderHeader(value, CINDER_NDJSON_FORMAT);
		} else {
			await writeDocument(value, header);
		}
	}
	if (header === null) {
		throw new Error("The file is empty.");
	}
}

async function importPlainJson(chunks: AsyncIterable<Uint8Array>, writeItem: (item: JsonItem) => Promise<void>): Promise<void> {
	await readJsonItems(chunks, [PLAIN_ITEM_PATH], writeItem);
}

async function readJsonItems(chunks: AsyncIterable<Uint8Array>, paths: string[], handleItem: (item: JsonItem) => Promise<void>): Promise<void> {
	const parser = new JSONParser({ paths, keepStack: false });
	const items: JsonItem[] = [];
	parser.onValue = ({ key, value }) => items.push({ key, value });
	for await (const chunk of chunks) {
		writeJson(parser, chunk);
		for (const item of items.splice(0)) {
			await handleItem(item);
		}
	}
	if (!parser.isEnded) {
		writeJson(parser, null);
	}
}

function writeJson(parser: JSONParser, chunk: Uint8Array | null): void {
	try {
		if (chunk === null) {
			parser.end();
		} else {
			parser.write(chunk);
		}
	} catch (error) {
		throw new Error(`The file is not valid JSON: ${describeError(error)}`);
	}
}

function parseJsonLine(text: string, lineNumber: number): unknown {
	try {
		return JSON.parse(text);
	} catch {
		throw new Error(`Line ${lineNumber} is not valid JSON.`);
	}
}

async function writeCinderDocument(
	db: Firestore,
	writer: DocumentWriter,
	value: unknown,
	{ target, writeMode }: ImportTaskRequest,
	header: CinderHeaderSummary,
): Promise<void> {
	try {
		const document = parseCinderDocument(value);
		const reference = db.doc(targetPathOf(target, header)(document.path));
		await writer.write({ reference, data: decodeFields(document.fields, db), writeMode, rowNumber: null, onWritten: null });
	} catch (error) {
		const documentPath = isObject(value) && typeof value.path === "string" ? value.path : null;
		writer.fail({ documentPath, rowNumber: null, message: describeError(error) });
	}
}

async function writePlainItem(db: Firestore, writer: DocumentWriter, { key, value }: JsonItem, { target, writeMode }: ImportTaskRequest): Promise<void> {
	const collectionPath = target.type === "collection" ? target.collectionPath : "";
	const id = plainItemId(db, collectionPath, { key, value });
	const documentPath = `${collectionPath}/${id}`;
	try {
		if (!isObject(value) || Array.isArray(value)) {
			throw new Error(`Item ${String(key)} is not a JSON object.`);
		}
		if (!isValidId(id)) {
			throw new Error(`"${id}" cannot be a document id.`);
		}
		const { [PLAIN_ID_KEY]: _id, [PLAIN_PATH_KEY]: _path, ...fields } = value;
		const data = decodeFields(fieldsFromPlainJson(fields), db);
		await writer.write({ reference: db.doc(documentPath), data, writeMode, rowNumber: null, onWritten: null });
	} catch (error) {
		writer.fail({ documentPath, rowNumber: null, message: describeError(error) });
	}
}

function plainItemId(db: Firestore, collectionPath: string, { key, value }: JsonItem): string {
	if (typeof key === "string") {
		return key;
	}
	if (isObject(value) && typeof value[PLAIN_ID_KEY] === "string") {
		return value[PLAIN_ID_KEY];
	}
	return db.collection(collectionPath).doc().id;
}

function targetPathOf(target: ImportTarget, header: CinderHeaderSummary): (path: string) => string {
	if (target.type === "original-paths") {
		return (path) => path;
	}
	const { rootPath } = header;
	return (path) => {
		if (rootPath !== null && path.startsWith(`${rootPath}/`)) {
			return `${target.collectionPath}${path.slice(rootPath.length)}`;
		}
		return `${target.collectionPath}/${path.slice(path.lastIndexOf("/") + 1)}`;
	};
}

function describeError(error: unknown): string {
	return types.isNativeError(error) ? error.message : String(error);
}
