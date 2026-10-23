# src/worker/utils/csv-reader.ts

CSV parsing for the analyze-csv and load-csv tasks, on `csv-parse` 7 (streaming through Node's `Readable.from` and the `csv-parse` Transform; `csv-parse/sync` for delimiter detection). Both tasks use the same options, so a file is read the same way when it is analyzed and when it is loaded.

## Options

- RFC 4180 quoting with `"` and doubled `""` inside quoted fields; quoted fields may hold delimiters and line breaks.
- `bom: true` skips a UTF-8 byte order mark. Record delimiters are `\r\n`, `\n` and `\r`, mixed in one file if need be.
- `relax_quotes`: a quote inside an unquoted field is kept as a character. `relax_column_count`: rows may have fewer or more cells than the header; missing cells read as empty.
- `skip_empty_lines`: blank lines are not rows.
- An unquoted empty cell becomes `null`, a quoted empty cell `""` (the `cast` option's `quoting` flag).
- A malformed file (an unclosed quote) ends the task with csv-parse's message and line number.

## Row numbers

`rowNumber` is csv-parse's record count: the header is row 1 and the first data row row 2, as in a spreadsheet. A record with a line break inside a quoted cell is one row, so row numbers can be lower than line numbers.

## Delimiter detection

`detectCsvDelimiter` parses the first 64 KB (cut at the last line break) with each of `,` `;` tab `|`, reads up to 20 records, and keeps the delimiters that give every record the same number of columns, more than one. The one with the most columns wins; comma is the fallback.
