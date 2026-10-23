import { type DocumentSnapshot, FieldPath, type Firestore } from "@google-cloud/firestore";
import { rename, rm } from "node:fs/promises";
import { join } from "node:path";
import { types } from "node:util";
import {
	CINDER_FORMAT_VERSION,
	CINDER_JSON_FORMAT,
	CINDER_NDJSON_FORMAT,
	READ_PAGE_SIZE,
} from "../../shared/constants/data-transfer";
import type { CsvCell } from "../../shared/interfaces/csv.interface";
import type { CinderExportHeader, ExportSource, ExportTaskRequest, ExportTaskResult } from "../../shared/interfaces/export.interface";
import type { FirestoreDocument } from "../../shared/interfaces/firestore-value.interface";
import type { TaskContext, TaskProgress } from "../../shared/interfaces/task.interface";
import { cinderDocumentText, cinderJsonClosing, cinderJsonOpening } from "../../shared/utils/cinder-json";
import { flattenFieldsForCsv } from "../../shared/utils/csv-values";
import { exportPartialFileName, exportSpoolFileName } from "../../shared/utils/export-file-name";
import { parentPath } from "../../shared/utils/firestore-path";
import { fieldsToReadableJson } from "../../shared/utils/firestore-value-json";
import { readCollection, readSubcollections } from "../utils/collection-reader";
import { buildQuery, countDocuments, readQueryPages } from "../utils/firestore-query";
import { readTextLines } from "../utils/file-reader";
import { encodeBigIntDocument } from "../utils/firestore-value-encoder";

const PATH_COLUMN = "__path";
const ID_COLUMN = "__id";
const CSV_RECORD_DELIMITER = "\r\n";
const CSV_QUOTED_PATTERN = /^$|^\s|\s$|[",\r\n]/;

interface ExportFile {
	write(text: string): void;
	flush(): Promise<void>;
	end(): Promise<void>;
}

interface JoinedFileParts {
	opening: string;
	separator: string;
	documentText: (document: FirestoreDocument) => string;
	closing: (documentCount: number) => string;
}

interface ExportWriter {
	writeDocument(document: FirestoreDocument): void;
	flush(): Promise<void>;
	finish(documentCount: number): Promise<void>;
}

export async function exportDocuments(db: Firestore, request: ExportTaskRequest, context: TaskContext): Promise<ExportTaskResult> {
	const { folderPath, fileName } = request;
	const filePath = join(folderPath, fileName);
	const partialPath = join(folderPath, exportPartialFileName(fileName, context.taskId));
	const spoolPath = join(folderPath, exportSpoolFileName(fileName, context.taskId));
	const { progress } = context;
	void countSourceDocuments(db, request.source).then(
		(count) => {
			progress.totalDocuments = count;
		},
		(error: unknown) => context.log("info", `The number of documents is not known: ${describeError(error)}`),
	);
	try {
		const writer = createExportWriter(request, partialPath, spoolPath, progress);
		for await (const snapshots of readSourcePages(db, request.source)) {
			for (const snapshot of snapshots) {
				writer.writeDocument(encodeBigIntDocument(snapshot));
			}
			progress.reads += snapshots.length;
			await writer.flush();
		}
		await writer.finish(progress.reads);
		await rename(partialPath, filePath);
	} catch (error) {
		await rm(partialPath, { force: true });
		await rm(spoolPath, { force: true });
		throw error;
	}
	context.log("info", `Exported ${progress.reads} documents to ${filePath}.`);
	return { kind: "export", filePath, documentCount: progress.reads, byteCount: progress.bytes };
}

async function* readSourcePages(db: Firestore, source: ExportSource): AsyncGenerator<DocumentSnapshot[]> {
	switch (source.type) {
		case "collection":
			yield* readCollection(db.collection(source.collectionPath), source.isRecursive);
			return;
		case "collection-group":
			yield* readQueryPages(db.collectionGroup(source.collectionId).orderBy(FieldPath.documentId()), null, READ_PAGE_SIZE);
			return;
		case "query":
			yield* readQueryPages(buildQuery(db, source.query), source.query.limit, READ_PAGE_SIZE);
			return;
		case "document": {
			const reference = db.doc(source.documentPath);
			const snapshot = await reference.get();
			if (snapshot.exists) {
				yield [snapshot];
			}
			if (source.isRecursive) {
				yield* readSubcollections([reference]);
			}
		}
	}
}

async function countSourceDocuments(db: Firestore, source: ExportSource): Promise<number | null> {
	switch (source.type) {
		case "collection":
			return source.isRecursive ? null : countDocuments(db.collection(source.collectionPath), null);
		case "collection-group":
			return countDocuments(db.collectionGroup(source.collectionId), null);
		case "query":
			return countDocuments(buildQuery(db, source.query), source.query.limit);
		case "document":
			return source.isRecursive ? null : 1;
	}
}

function createExportWriter(request: ExportTaskRequest, partialPath: string, spoolPath: string, progress: TaskProgress): ExportWriter {
	const sink = Bun.file(partialPath).writer();
	const file: ExportFile = {
		write: (text) => {
			sink.write(text);
			progress.bytes += Buffer.byteLength(text);
		},
		flush: async () => {
			await sink.flush();
		},
		end: async () => {
			await sink.end();
		},
	};
	switch (request.format) {
		case "cinder-json":
			return createJoinedWriter(file, {
				opening: cinderJsonOpening(exportHeader(request, CINDER_JSON_FORMAT)),
				separator: ",\n",
				documentText: (document) => `\t\t${cinderDocumentText(document)}`,
				closing: cinderJsonClosing,
			});
		case "ndjson":
			return createJoinedWriter(file, {
				opening: `${JSON.stringify(exportHeader(request, CINDER_NDJSON_FORMAT))}\n`,
				separator: "",
				documentText: (document) => `${cinderDocumentText(document)}\n`,
				closing: () => "",
			});
		case "readable-json":
			return createJoinedWriter(file, {
				opening: "[\n",
				separator: ",\n",
				documentText: (document) => `\t${JSON.stringify(readableDocument(document))}`,
				closing: () => "\n]\n",
			});
		case "csv":
			return createCsvWriter(file, spoolPath);
	}
}

function createJoinedWriter(file: ExportFile, parts: JoinedFileParts): ExportWriter {
	let isFirst = true;
	file.write(parts.opening);
	return {
		writeDocument: (document) => {
			file.write(isFirst ? parts.documentText(document) : `${parts.separator}${parts.documentText(document)}`);
			isFirst = false;
		},
		flush: file.flush,
		finish: async (documentCount) => {
			file.write(parts.closing(documentCount));
			await file.end();
		},
	};
}

function createCsvWriter(file: ExportFile, spoolPath: string): ExportWriter {
	const spool = Bun.file(spoolPath).writer();
	const columns = new Set<string>();
	return {
		writeDocument: (document) => {
			const cells: Record<string, CsvCell> = { ...flattenFieldsForCsv(document.fields), [PATH_COLUMN]: document.path, [ID_COLUMN]: document.id };
			for (const column of Object.keys(cells)) {
				columns.add(column);
			}
			spool.write(`${JSON.stringify(cells)}\n`);
		},
		flush: async () => {
			await spool.flush();
		},
		finish: async () => {
			await spool.end();
			const fieldColumns = [...columns].filter((column) => column !== PATH_COLUMN && column !== ID_COLUMN).sort();
			const header = [PATH_COLUMN, ID_COLUMN, ...fieldColumns];
			file.write(csvRow(header));
			for await (const { text } of readTextLines(Bun.file(spoolPath).stream())) {
				const cells = JSON.parse(text) as Record<string, CsvCell>;
				file.write(csvRow(header.map((column) => cells[column] ?? null)));
			}
			await file.end();
			await rm(spoolPath, { force: true });
		},
	};
}

function csvRow(cells: CsvCell[]): string {
	const texts = cells.map((cell) => {
		if (cell === null) {
			return "";
		}
		return CSV_QUOTED_PATTERN.test(cell) ? `"${cell.replaceAll('"', '""')}"` : cell;
	});
	return `${texts.join(",")}${CSV_RECORD_DELIMITER}`;
}

function readableDocument({ path, id, fields }: FirestoreDocument): Record<string, unknown> {
	return Object.assign({ [PATH_COLUMN]: path, [ID_COLUMN]: id }, fieldsToReadableJson(fields), { [PATH_COLUMN]: path, [ID_COLUMN]: id });
}

function exportHeader({ database, source }: ExportTaskRequest, format: string): CinderExportHeader {
	return {
		format,
		version: CINDER_FORMAT_VERSION,
		exportedAt: new Date().toISOString(),
		projectId: database.projectId,
		databaseId: database.databaseId,
		source,
		rootPath: rootPathOf(source),
	};
}

function rootPathOf(source: ExportSource): string | null {
	switch (source.type) {
		case "collection":
			return source.collectionPath;
		case "document":
			return parentPath(source.documentPath);
		case "query":
			return source.query.target.type === "collection" ? source.query.target.collectionPath : null;
		case "collection-group":
			return null;
	}
}

function describeError(error: unknown): string {
	return types.isNativeError(error) ? error.message : String(error);
}
