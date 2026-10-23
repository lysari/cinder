import { CSV_PREVIEW_ROWS, CSV_SAMPLE_ROWS, CSV_SAMPLE_VALUES, IMPORT_FILE_HEAD_BYTES } from "../../shared/constants/data-transfer";
import type { AnalyzeCsvTaskRequest, CsvAnalysisResult, CsvCell, CsvColumnAnalysis } from "../../shared/interfaces/csv.interface";
import type { TaskContext } from "../../shared/interfaces/task.interface";
import { inferCsvColumnType } from "../../shared/utils/csv-values";
import { detectCsvDelimiter, readCsvRecords } from "../utils/csv-reader";
import { readFileChunks } from "../utils/file-reader";

export async function analyzeCsv({ filePath }: AnalyzeCsvTaskRequest, context: TaskContext): Promise<CsvAnalysisResult> {
	const delimiter = detectCsvDelimiter(await Bun.file(filePath).slice(0, IMPORT_FILE_HEAD_BYTES).text());
	let header: CsvCell[] | null = null;
	const sampleRows: CsvCell[][] = [];
	let rowCount = 0;
	let hasQuotedFields = false;
	for await (const { cells, hasQuotes } of readCsvRecords(readFileChunks(filePath, context.progress), delimiter)) {
		hasQuotedFields ||= hasQuotes;
		if (header === null) {
			header = cells;
			continue;
		}
		rowCount += 1;
		if (sampleRows.length < CSV_SAMPLE_ROWS) {
			sampleRows.push(cells);
		}
	}
	if (header === null) {
		throw new Error("The CSV file is empty.");
	}
	const columnCount = sampleRows.reduce((count, row) => Math.max(count, row.length), header.length);
	const headerCells = header;
	const columns = Array.from({ length: columnCount }, (_, index) => analyzeColumn(index, headerCells[index] ?? null, sampleRows));
	context.log("info", `Read ${rowCount} rows in ${columnCount} columns.`);
	return { kind: "csv-analysis", delimiter, hasQuotedFields, rowCount, columns, previewRows: sampleRows.slice(0, CSV_PREVIEW_ROWS) };
}

function analyzeColumn(index: number, headerCell: CsvCell, sampleRows: CsvCell[][]): CsvColumnAnalysis {
	const cells = sampleRows.map((row) => row[index] ?? null);
	const sampleValues = cells.filter((cell): cell is string => cell !== null && cell.trim().length > 0).slice(0, CSV_SAMPLE_VALUES);
	const name = headerCell?.trim() || `column_${index + 1}`;
	return { index, name, type: inferCsvColumnType(cells), sampleValues };
}
