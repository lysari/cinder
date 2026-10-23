# src/shared/utils/query-script.ts

`generateQueryScript` writes a `StructuredQuery` as the run-script program the JavaScript mode runs:

```js
async function run() {
  const query = await db.collection("users")
    .where("age", ">=", 18)
    .orderBy("age", "desc")
    .limit(20)
    .get();
  return query;
}
```

- `db.collectionGroup("<id>")` for a collection group. All filters, then all orders, then the limit (left out when null), then `.get();`. Two-space indent, one clause per line, a trailing newline.
- Every text (path, field path, operator, direction, string value) is written with `JSON.stringify`, so quotes, backslashes, line breaks, U+2028 and lone surrogates are escaped and a field name can never end the string. Tests run hostile names through `node:vm` to prove the SDK receives them unchanged.

## Value literals

| Value | Written as |
|---|---|
| string | JSON string |
| integer within ±2^53 | digits, e.g. `-42` |
| integer beyond | BigInt literal, e.g. `9007199254740993n`, so the script context keeps every digit |
| double | `String(value)`, with `.0` added to a whole number (`2.0`), `-0.0` for negative zero; `NaN`, `Infinity`, `-Infinity` |
| boolean, null | `true` / `false`, `null` |
| timestamp with whole milliseconds | `admin.firestore.Timestamp.fromMillis(<ms>)` |
| timestamp with sub-millisecond nanos | `new admin.firestore.Timestamp(<seconds>, <nanos>)`, because `fromMillis` would round them through a float |
| list | `[a, b, …]` of the above |

The double form matters for the round trip: the parser reads a number with `.` or an exponent as a double and one without as an integer. In the script itself a whole double such as `2.0` is still a JavaScript number, so the SDK sends it as an integer; Firestore compares integers and doubles by value, so the query matches the same documents.
