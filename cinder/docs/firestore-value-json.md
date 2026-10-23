# src/mainview/app/shared/utils/firestore-value-json.ts

The readable JSON the collection page's JSON view shows. It is for reading only and is not reversible: the type tags are dropped.

| Tag | JSON |
|---|---|
| null, boolean, string | the same value |
| integer | a number when it is a safe integer, otherwise its digits as a string |
| double | the number; `NaN`, `Infinity`, `-Infinity` as those strings |
| timestamp | UTC ISO 8601 string with 0, 3, 6 or 9 fraction digits, e.g. `2026-10-22T02:00:00.123Z` |
| geopoint | `{ "latitude": …, "longitude": … }` |
| reference | the document path |
| bytes | the base64 text |
| vector | an array of numbers |
| array, map | converted item by item |

`documentsToReadableJson` returns one object keyed by document id, each holding that document's fields.
