# src/worker/tasks/load-csv.ts

The `load-csv` task streams a CSV file (`csv-reader.md`) with the user's mapping and writes one document per row through `DocumentWriter` (`document-writer.md`).

- The header row is skipped. The id comes from the chosen column (trimmed) or is generated; an invalid id fails the row.
- Each included column is converted with `parseCsvCell` (`csv-values.md`) in the request's time zone; a dotted field name builds nested maps (`address.city`). The main process already refused duplicate names and a name that is both a value and a map.
- A conversion error fails the row as "`<field>`: `<reason>`" with its row number (header = row 1); the load continues. Only the first 100 failures are stored and logged; the rest are counted.
- A file that cannot be parsed ends the task with the reason and how many documents were written; those stay.
