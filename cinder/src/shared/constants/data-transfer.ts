export const EXPORT_FORMATS = ["cinder-json", "ndjson", "readable-json", "csv"] as const;
export type ExportFormat = (typeof EXPORT_FORMATS)[number];

export const EXPORT_FILE_EXTENSIONS: Record<ExportFormat, readonly string[]> = {
	"cinder-json": [".json"],
	ndjson: [".ndjson", ".jsonl"],
	"readable-json": [".json"],
	csv: [".csv"],
};

export const IMPORT_FORMATS = ["cinder-json", "ndjson", "json"] as const;
export type ImportFormat = (typeof IMPORT_FORMATS)[number];

export const IMPORT_FILE_EXTENSIONS = ["json", "ndjson", "jsonl", "csv", "tsv"] as const;

export const WRITE_MODES = ["overwrite", "merge", "skip"] as const;
export type WriteMode = (typeof WRITE_MODES)[number];

export const CSV_COLUMN_TYPES = ["string", "integer", "double", "boolean", "timestamp", "json", "null"] as const;
export type CsvColumnType = (typeof CSV_COLUMN_TYPES)[number];

export const CSV_DELIMITERS = [",", ";", "\t", "|"] as const;
export type CsvDelimiter = (typeof CSV_DELIMITERS)[number];

export const CINDER_JSON_FORMAT = "cinder-json";
export const CINDER_NDJSON_FORMAT = "cinder-ndjson";
export const CINDER_FORMAT_VERSION = 1;
export const READ_PAGE_SIZE = 500;
export const MAX_STORED_FAILURES = 100;
export const CSV_PREVIEW_ROWS = 10;
export const CSV_SAMPLE_ROWS = 1000;
export const CSV_SAMPLE_VALUES = 3;
export const MAX_FILE_NAME_BYTES = 200;
export const IMPORT_FILE_HEAD_BYTES = 64 * 1024;
export const UTC_TIME_ZONE = "UTC";
