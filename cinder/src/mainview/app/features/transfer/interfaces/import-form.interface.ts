import type { CsvDelimiter, WriteMode } from "../../../../../shared/constants/data-transfer";
import type { CsvColumnMapping } from "../../../../../shared/interfaces/csv.interface";
import type { ImportTarget } from "../../../../../shared/interfaces/import.interface";

export interface JsonImportForm {
	target: ImportTarget;
	writeMode: WriteMode;
}

export interface CsvLoadForm {
	delimiter: CsvDelimiter;
	collectionPath: string;
	idColumnIndex: number | null;
	columns: CsvColumnMapping[];
	timeZone: string;
	writeMode: WriteMode;
}
