import type { Firestore } from "@google-cloud/firestore";
import { types } from "node:util";
import type { CsvCell, CsvColumnMapping, LoadCsvTaskRequest } from "../../shared/interfaces/csv.interface";
import type { FirestoreMapValue, FirestoreValue } from "../../shared/interfaces/firestore-value.interface";
import type { TaskContext, WriteTaskResult } from "../../shared/interfaces/task.interface";
import { parseCsvCell } from "../../shared/utils/csv-values";
import { isValidId } from "../../shared/utils/firestore-validation";
import { readCsvRecords } from "../utils/csv-reader";
import { DocumentWriter } from "../utils/document-writer";
import { readFileChunks } from "../utils/file-reader";
import { decodeFields } from "../utils/firestore-value-decoder";

export async function loadCsv(db: Firestore, request: LoadCsvTaskRequest, context: TaskContext): Promise<WriteTaskResult> {
	const writer = new DocumentWriter(context);
	const includedColumns = request.columns.filter((column) => column.isIncluded);
	let isHeader = true;
	try {
		for await (const { cells, rowNumber } of readCsvRecords(readFileChunks(request.filePath, context.progress), request.delimiter)) {
			if (isHeader) {
				isHeader = false;
				continue;
			}
			const documentId = documentIdOf(db, request, cells);
			const documentPath = `${request.collectionPath}/${documentId}`;
			try {
				if (!isValidId(documentId)) {
					throw new Error(`"${documentId}" in the id column cannot be a document id.`);
				}
				const fields = fieldsOf(cells, includedColumns, request.timeZone);
				const data = decodeFields(fields, db);
				await writer.write({ reference: db.doc(documentPath), data, writeMode: request.writeMode, rowNumber, onWritten: null });
			} catch (error) {
				writer.fail({ documentPath, rowNumber, message: describeError(error) });
			}
		}
	} catch (error) {
		await writer.close();
		throw new Error(`${describeError(error)} ${context.progress.writes} documents were written before this error and stay.`);
	}
	return writer.close();
}

function documentIdOf(db: Firestore, { collectionPath, idColumnIndex }: LoadCsvTaskRequest, cells: CsvCell[]): string {
	return idColumnIndex === null ? db.collection(collectionPath).doc().id : (cells[idColumnIndex]?.trim() ?? "");
}

function fieldsOf(cells: CsvCell[], columns: CsvColumnMapping[], timeZone: string): Record<string, FirestoreValue> {
	const fields: Record<string, FirestoreValue> = {};
	for (const column of columns) {
		let value: FirestoreValue;
		try {
			value = parseCsvCell(cells[column.index] ?? null, column.type, timeZone);
		} catch (error) {
			throw new Error(`${column.fieldName}: ${describeError(error)}`);
		}
		setNestedField(fields, column.fieldName.split("."), value);
	}
	return fields;
}

function setNestedField(fields: Record<string, FirestoreValue>, names: string[], value: FirestoreValue): void {
	const [name, ...rest] = names as [string, ...string[]];
	if (rest.length === 0) {
		fields[name] = value;
		return;
	}
	const existing = fields[name];
	const map: FirestoreMapValue = existing?.type === "map" ? existing : { type: "map", value: {} };
	fields[name] = map;
	setNestedField(map.value, rest, value);
}

function describeError(error: unknown): string {
	return types.isNativeError(error) ? error.message : String(error);
}
