# src/shared/utils/firestore-value-json.ts

Plain JSON in both directions. It lives in `src/shared/utils/` because the webview (JSON views) and the worker (readable JSON export, plain JSON import, CSV cells) both use it.

## Readable mapping (`toReadableJson`, `fieldsToReadableJson`)

What the JSON views of the collection and query pages show and what the readable JSON export writes. It is for reading and is not reversible: the type tags are dropped.

| Tag | JSON |
|---|---|
| null, boolean, string | the same value |
| integer | a number when it is a safe integer, otherwise its digits as a string |
| double | the number (a whole double reads like an integer, `-0` as `0`); `NaN`, `Infinity`, `-Infinity` as those strings |
| timestamp | UTC ISO 8601 string with 0, 3, 6 or 9 fraction digits, e.g. `2026-10-22T02:00:00.123Z` |
| geopoint | `{ "latitude": …, "longitude": … }` |
| reference | the document path |
| bytes | the base64 text |
| vector | an array of numbers |
| array, map | converted item by item |

`documentsToReadableJson` returns one object keyed by document id, each holding that document's fields (the JSON views).

## Plain JSON import (`valueFromPlainJson`, `fieldsFromPlainJson`)

| JSON | Firestore |
|---|---|
| null, boolean, string | the same type; strings stay strings, ISO dates are not turned into timestamps |
| number that is a safe integer (not `-0`) | integer |
| any other number | double; a whole number above 2^53 has already lost digits in `JSON.parse` |
| array | array; an array directly inside an array throws, Firestore cannot store it |
| object | map |

JSON has no way to say "double 2.0": `2.0` and `2` parse to the same number and both become integers.
