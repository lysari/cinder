import type { CsvColumnType, CsvDelimiter, WriteMode } from "../constants/data-transfer";
import type { DatabaseTarget } from "./account.interface";

export type CsvCell = string | null;

export interface AnalyzeCsvTaskRequest {
	type: "analyze-csv";
	database: DatabaseTarget;
	filePath: string;
}

export interface CsvColumnMapping {
	index: number;
	isIncluded: boolean;
	fieldName: string;
	type: CsvColumnType;
}

export interface LoadCsvTaskRequest {
	type: "load-csv";
	database: DatabaseTarget;
	filePath: string;
	delimiter: CsvDelimiter;
	collectionPath: string;
	idColumnIndex: number | null;
	columns: CsvColumnMapping[];
	timeZone: string;
	writeMode: WriteMode;
}

export interface CsvColumnAnalysis {
	index: number;
	name: string;
	type: CsvColumnType;
	sampleValues: string[];
}

export interface CsvAnalysisResult {
	kind: "csv-analysis";
	delimiter: CsvDelimiter;
	hasQuotedFields: boolean;
	rowCount: number;
	columns: CsvColumnAnalysis[];
	previewRows: CsvCell[][];
}
