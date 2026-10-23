import { JSONParser } from "@streamparser/json";
import { basename, extname } from "node:path";
import { CINDER_JSON_FORMAT, CINDER_NDJSON_FORMAT, IMPORT_FILE_HEAD_BYTES } from "../../shared/constants/data-transfer";
import type { ImportFileSummary } from "../../shared/interfaces/import.interface";
import { parseCinderHeader } from "../../shared/utils/cinder-json";

const CSV_EXTENSIONS = [".csv", ".tsv"];
const NDJSON_EXTENSIONS = [".ndjson", ".jsonl"];
const JSON_START_PATTERN = /^﻿?\s*[[{]/;
const HEADER_PATHS = ["$.format", "$.version", "$.rootPath", "$.exportedAt"];

export async function summarizeImportFile(filePath: string): Promise<ImportFileSummary> {
	const file = Bun.file(filePath);
	const extension = extname(filePath).toLowerCase();
	const summary = { filePath, fileName: basename(filePath), byteCount: file.size, rootPath: null, exportedAt: null };
	if (CSV_EXTENSIONS.includes(extension)) {
		return { ...summary, format: "csv" };
	}
	const head = await file.slice(0, IMPORT_FILE_HEAD_BYTES).bytes();
	if (NDJSON_EXTENSIONS.includes(extension)) {
		return { ...summary, format: "ndjson", ...parseNdjsonHeader(head) };
	}
	if (!JSON_START_PATTERN.test(new TextDecoder().decode(head))) {
		throw new Error("The file is not JSON, NDJSON or CSV.");
	}
	const headerFields = readJsonHeaderFields(head);
	if (headerFields.format === CINDER_JSON_FORMAT) {
		return { ...summary, format: "cinder-json", ...parseCinderHeader(headerFields, CINDER_JSON_FORMAT) };
	}
	return { ...summary, format: "json" };
}

function parseNdjsonHeader(head: Uint8Array): { rootPath: string | null; exportedAt: string | null } {
	const firstLine = new TextDecoder().decode(head).split("\n", 1)[0] ?? "";
	let header: unknown;
	try {
		header = JSON.parse(firstLine);
	} catch {
		throw new Error("The file does not start with a Cinder NDJSON header line.");
	}
	return parseCinderHeader(header, CINDER_NDJSON_FORMAT);
}

function readJsonHeaderFields(head: Uint8Array): Record<string, unknown> {
	const fields: Record<string, unknown> = {};
	const parser = new JSONParser({ paths: HEADER_PATHS, keepStack: false });
	parser.onValue = ({ key, value }) => {
		if (typeof key === "string") {
			fields[key] = value;
		}
	};
	parser.onError = () => undefined;
	parser.write(head);
	return fields;
}
