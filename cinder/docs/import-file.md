# src/bun/services/import-file.ts

`summarizeImportFile` tells the import page what the user picked, reading only the first 64 KB:

- `.csv` and `.tsv` are CSV.
- `.ndjson` and `.jsonl` must start with a Cinder NDJSON header line.
- Other files must start (after an optional BOM and whitespace) with `[` or `{`. The head is fed to `@streamparser/json` on the header paths; a `format` of `cinder-json` makes it a Cinder JSON export, anything else plain JSON. Parse errors in the cut-off head are ignored on purpose: the head ends mid-file, and the import task reports a truly invalid file with its reason.
