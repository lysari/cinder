# src/worker/utils/firestore-value-encoder.ts

Turns Firestore SDK values and script return values into the JSON-safe tagged values in `src/shared/interfaces/firestore-value.interface.ts`. It lives in the worker because it checks SDK classes. The inverse is `firestore-value-decoder.ts` (see `firestore-value-decoder.md`).

## Hidden constraints

- With default client settings the SDK reads both Firestore integers and doubles as JavaScript numbers, so `encodeValue` and `encodeResult` tag a whole number as `integer` and any other number as `double`. A stored double such as `2.0` therefore shows as the integer `2` in task results. Integers are sent as decimal strings so a `bigint` keeps every digit.
- `encodeBigIntDocument` is for snapshots read by a client created with `useBigInt: true` (browse sessions): there every integer is a `bigint` and every `number` is a double, so it tags each number as `double`, whole or not.
- `NaN`, `Infinity` and `-Infinity` are sent as strings because JSON has no such numbers.
- Objects a script creates come from the vm context's realm. Dates and byte arrays are detected with `node:util` `types`, and a plain object is any object whose prototype is a realm's `Object.prototype` (or `null`), never an `instanceof` check against this realm.
- A snapshot nested inside a returned object becomes a map of its fields (`null` when missing); a nested query snapshot becomes an array of those maps.
- An object of any other class (`Map`, `Set`, a custom class) is sent as its `String()` text.
- `undefined` becomes `null`.
