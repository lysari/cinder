# src/shared/utils/query-validation.ts

`validateQuery` is shared by the builder (live issues under each row) and the main process (`parseRunQueryParams` rejects the first issue as "The query cannot run: …"). Each `QueryIssue` names its section (`target`, `filter`, `order`, `limit`) and row index.

## Rules checked

- Target: a valid collection path, or a collection id without `/`.
- Field paths (filters and orders): not empty, no empty segment between dots, none of `~ * / [ ]`, at most 1500 bytes. This is what the Node SDK accepts as a dotted path string.
- in and array-contains-any take a list of 1 to 30 values, not-in 1 to 10; the other operators take one value.
- null and NaN only with `==` and `!=` (the SDK turns those into is-null / is-nan filters and rejects other operators).
- At most one array-contains or array-contains-any filter; at most one not-in; not-in cannot be combined with `!=`, in or array-contains-any.
- A field may be ordered once.
- Limit: null, or a whole number from 1 to 2147483647 (Firestore's int32).
- Values not made by the builder: integers in the 64-bit range, timestamps in years 1 to 9999.

## Rules left to Firestore

Inequality and order-by interplay is not checked: Firestore now allows inequality filters on several fields and orders by them implicitly, and the exact rules differ between the emulator and production. Missing composite indexes are reported by Firestore at run time (the error carries the link to create the index).
