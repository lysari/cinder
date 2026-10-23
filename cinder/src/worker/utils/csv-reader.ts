import { type Options, parse as parseStream } from "csv-parse";
import { parse as parseSync } from "csv-parse/sync";
import { Readable } from "node:stream";
import { CSV_DELIMITERS, type CsvDelimiter } from "../../shared/constants/data-transfer";
import type { CsvCell } from "../../shared/interfaces/csv.interface";

const DETECTION_RECORDS = 20;
const DEFAULT_DELIMITER: CsvDelimiter = ",";
const QUOTE = '"';
const RECORD_DELIMITERS = ["\r\n", "\n", "\r"];

interface CsvRecord {
	cells: CsvCell[];
	rowNumber: number;
	hasQuotes: boolean;
}

/** Picks the delimiter whose first records split into the same number of columns (more than one), preferring more columns; comma when none fits. Pass the file's first bytes as text. */
export function detectCsvDelimiter(sample: string): CsvDelimiter {
	const completeLines = sample.slice(0, Math.max(sample.lastIndexOf("\n"), 0)) || sample;
	let best: { delimiter: CsvDelimiter; columnCount: number } | null = null;
	for (const delimiter of CSV_DELIMITERS) {
		const columnCount = consistentColumnCount(completeLines, delimiter);
		if (columnCount > 1 && (best === null || columnCount > best.columnCount)) {
			best = { delimiter, columnCount };
		}
	}
	return best?.delimiter ?? DEFAULT_DELIMITER;
}

/** Parses CSV byte chunks into records of cells (null for an unquoted empty cell), numbered as rows with the header as row 1. Quotes follow RFC 4180; a BOM is skipped. */
export async function* readCsvRecords(chunks: AsyncIterable<Uint8Array>, delimiter: CsvDelimiter): AsyncGenerator<CsvRecord> {
	const records = Readable.from(chunks).pipe(parseStream(csvOptions(delimiter)));
	for await (const { record, raw, info } of records as AsyncIterable<{ record: CsvCell[]; raw: string; info: { records: number } }>) {
		yield { cells: record, rowNumber: info.records, hasQuotes: raw.includes(QUOTE) };
	}
}

function consistentColumnCount(text: string, delimiter: CsvDelimiter): number {
	try {
		const records: string[][] = parseSync(text, { ...csvOptions(delimiter), info: false, raw: false, to: DETECTION_RECORDS });
		const columnCount = records[0]?.length ?? 0;
		return records.every((record) => record.length === columnCount) ? columnCount : 0;
	} catch {
		return 0;
	}
}

function csvOptions(delimiter: CsvDelimiter): Options {
	return {
		delimiter,
		bom: true,
		record_delimiter: RECORD_DELIMITERS,
		info: true,
		raw: true,
		relax_column_count: true,
		relax_quotes: true,
		skip_empty_lines: true,
		cast: (value, context) => (context.quoting || value !== "" ? value : null),
	};
}
