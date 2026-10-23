# Import page

Routes: `#/transfer/import/<accountId>/<projectId>/<databaseId>` ("Import" on the explorer database page) and `…/c/<collectionPath>` ("Import" on the explorer collection toolbar, which preselects that collection as the target).

## Choosing a file

"Choose file…" asks the main process for the native open dialog (`.json`, `.ndjson`, `.jsonl`, `.csv`, `.tsv`). The main process reads the first 64 KB and answers an `ImportFileSummary` (`import-file.md`): Cinder JSON, Cinder NDJSON, plain JSON or CSV, the size, and for Cinder exports the root path and export time. The page shows them above the form.

## JSON and NDJSON (`JsonImportFormComponent`)

- **Target**: "Original paths" (Cinder exports only) or "Into a collection" with a collection path. It starts on the route's collection, else on original paths with the file's root path filled in. When the chosen collection differs from the file's root path the form says how paths move: `users/<id>/…` becomes `<collection>/<id>/…`; for an export without a single root (collection group) every document goes to `<collection>/<its id>`.
- Plain JSON is always imported into a collection; the hint explains the mapping (`firestore-value-json.md`).
- **Existing documents**: Overwrite (`set`), Merge (`set` with merge), Skip (`create`, existing documents are counted as skipped).

## CSV (`CsvLoadFormComponent`)

Choosing a CSV file starts an `analyze-csv` task at once; the page shows its progress and then the mapping form built from the analysis (`analyze-csv.md`):

- a summary line (rows, columns, delimiter, quoting);
- **Collection path**, **Document ids** (generated, or from one column), **Time zone** (every IANA zone `Intl` knows, UTC first, this computer's zone preselected) for dates without an offset;
- **Columns**: a `FormArray` built from the analyzed columns (runtime data), one row per CSV column with include, field name (dots nest), type (string, integer, double, boolean, timestamp, JSON, null; preselected from inference) and sample values. A group validator checks the field name only while the column is included;
- **Preview**: the first 10 rows as parsed, empty cells shaded;
- **Existing documents**: the same three write modes.

"Start load" sends `load-csv`. The main process rejects two columns writing the same field and a name that is both a value and a map (`a` and `a.b`).

Both forms say that canceling stops the task and that documents already written stay. After a start the tasks page opens on the new task. `ImportStore` (provided by the page) holds the file summary, the analysis task id (the analysis itself is read from `TasksStore`), the starting state and the error.
