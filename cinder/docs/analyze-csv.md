# src/worker/tasks/analyze-csv.ts

The `analyze-csv` task reads a CSV file once and returns a `CsvAnalysisResult` for the mapping form (`import.md`):

- the delimiter, detected from the first 64 KB (`csv-reader.md`), and whether any record holds quotes;
- the row count (every row after the header, the whole file is streamed);
- one entry per column, as many as the widest of the header and the first 1,000 rows: the header name (trimmed; `column_<n>` when empty), the inferred type (`csv-values.md`) and up to 3 non-empty sample values;
- the first 10 rows as parsed (`CSV_PREVIEW_ROWS`), with `null` for unquoted empty cells.

Only the first 1,000 rows are kept for inference, so memory stays bounded for any file size. It needs no Firestore access; the request still names a database because every task runs for one.
