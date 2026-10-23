# src/worker/tasks/run-script.ts

Runs a user script with `node:vm` inside the task process.

## Script contract

- The script must define `async function run()`. Its awaited return value is the task result: a `DocumentSnapshot` becomes a document result, a `QuerySnapshot` a document list, anything else a tagged value (see `firestore-value-encoder.md`).
- The context exposes `db` (the Firestore client), `admin.firestore.{FieldValue, Timestamp, GeoPoint, FieldPath}`, the timer functions, and a `console` whose `log`, `info`, `warn` and `error` write formatted lines (printf-style, like `console.log`) to the task log.
- The script runs as written under the file name `script.js`, so error line numbers match the editor.

## Errors

A failing script ends the task with `Name: message` followed only by the stack frames inside `script.js`, e.g.

```text
TypeError: null is not an object (evaluating 'null.x')
    at helper (script.js:5:7)
    at run (script.js:2:9)
```

A syntax error reports `script.js:<line>` the same way. A thrown non-error value is reported as its text.

## Hidden constraints

- Values and errors created inside the script come from the context's own realm, so `instanceof Error` is false for them. The file uses `types.isNativeError` instead.
- `node:vm` is not a security boundary: a script can reach the worker's globals. The worker process is the isolation; cancel kills it.
