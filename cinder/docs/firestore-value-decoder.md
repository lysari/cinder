# src/worker/utils/firestore-value-decoder.ts

Turns tagged values from the webview into SDK values for writes. Its inverse is the encoder (`firestore-value-encoder.md`).

| Tag | SDK value |
|---|---|
| `null`, `boolean`, `string` | the same JavaScript value |
| `integer` | `BigInt(value)` |
| `double` | `Number(value)`; `"NaN"`, `"Infinity"`, `"-Infinity"` become those numbers; a whole number becomes a `WholeDouble` marker (below) |
| `bytes` | `Buffer` from base64 |
| `timestamp` | `new Timestamp(seconds, nanos)` |
| `geopoint` | `new GeoPoint(latitude, longitude)` |
| `reference` | `db.doc(path)` of the session's own client |
| `vector` | `FieldValue.vector(values)` |
| `array`, `map` | decoded item by item |

## Number types

What the SDK (`@google-cloud/firestore` 9.4) does, from its serializer:

- Writing: a `bigint` is always stored as an integer. A JavaScript `number` that is a safe integer (and not `-0`) is stored as an **integer**; any other number is stored as a double.
- The SDK's validator accepts, and its serializer writes through `_toProto()`, any object whose `_protoValueType` is `"ProtoValue"` (the hook its pipeline expressions use). The decoder wraps a whole-number double in such an object (`WholeDouble`) that returns `{ doubleValue }`, so `2.0` is stored as a double in `set`, `update`, merges, `BulkWriter` and query filters. The import round-trip tests check it against the emulator; a newer SDK that drops the hook would fail them.
- Reading with the default settings: integers and doubles both arrive as `number`, so `2` and `2.0` cannot be told apart.
- Reading with `useBigInt: true` (a public setting): every integer arrives as `bigint` and every double as `number`, so the type is exact. Browse sessions use it; task scripts do not, because user scripts expect plain numbers.

What Cinder therefore preserves:

- Reads in the explorer show the stored type exactly, including a whole-number double such as `2.0` (shown as `2.0 dbl`) and integers beyond 2^53.
- Integers are written as `bigint`, so every digit of a 64-bit integer survives.
- Doubles keep their type when written, whole or not, so the editor and Cinder JSON/NDJSON imports write exactly what was read.
- Task results (`run-script`) still use the encoder's guess: a whole number shows as an integer.
