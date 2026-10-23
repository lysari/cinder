# src/shared/utils/csv-values.ts

The value rules of CSV export (`flattenFieldsForCsv`) and CSV import (`inferCsvColumnType`, `parseCsvCell`, `parseCsvTimestamp`).

## Export: flattening

| Value | Cell |
|---|---|
| map with fields | one column per nested field, named with dots: `address.city`, `address.geo.zip` |
| empty map | `{}` |
| array, geopoint, vector | JSON text of the readable mapping (`firestore-value-json.md`), e.g. `["a","b"]`, `{"latitude":1,"longitude":2}` |
| timestamp | UTC ISO 8601 with 0, 3, 6 or 9 fraction digits |
| integer | its digits (every digit of a 64-bit value) |
| double | `String(number)`, so `2.0` is written `2`; `NaN`, `Infinity`, `-Infinity` |
| boolean | `true` / `false` |
| string, bytes (base64), reference (path) | the text |
| null | an empty cell |

A field name that contains a dot cannot be told apart from a nested field in the column name; on import a dotted name always nests.

## Import: inference

`inferCsvColumnType` looks at the non-empty sample cells of a column (the first 1,000 rows, `CSV_SAMPLE_ROWS`) and picks the first type every one of them fits: boolean (`true`/`false`, any case), integer (`[+-]digits` in the 64-bit range), double (decimal or exponent, `NaN`, `Infinity`), timestamp, JSON (text that starts with `[` or `{` and parses, without an array directly inside an array), otherwise string. A column with no non-empty sample is `null`. Inference reads timestamps in UTC; it only decides whether the text is a date.

## Import: cells

- An empty cell is null for every type. A quoted empty cell (`""`) in a string column stays an empty string; CSV export writes an empty string that way and null as nothing, so both survive.
- Integer and double cells are trimmed; a whole number is canonicalised (`+5` → `5`); `1e999` is refused instead of becoming Infinity.
- JSON cells are mapped with `valueFromPlainJson`: safe whole numbers become integers, other numbers doubles.
- A cell that does not fit its type throws a message naming the text, which the load task reports with the row number.

## Timestamps

Accepted forms, with an optional fraction of up to 9 digits:

- ISO 8601: `2026-10-23`, `2026-10-23T09:30`, `2026-10-23 09:30:00.123`, with `Z` or an offset `+07:00` / `+0700`;
- year first with slashes: `2026/10/23`, `2026/1/2 08:00`;
- day first with dots: `23.10.2026`, `23.10.2026 09:30`.

`10/23/2026` and `23/10/2026` are ambiguous and are not read as dates. A value with `Z` or an offset keeps it; any other value is a wall time in the chosen IANA time zone. The conversion asks `Intl.DateTimeFormat` for the zone's offset at the wall time and once more at the corrected instant, so daylight saving time is followed; a wall time inside a spring-forward gap moves by the gap. Years 1 to 9999 are allowed; `Date` objects are built with `setUTCFullYear`, because `Date.UTC` maps years below 100 to 19xx.
