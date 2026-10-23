# src/worker/utils/firestore-query.ts

- `buildQuery` turns a `StructuredQuery` into an SDK query: target, then every filter (values decoded like writes), then every order; the limit is left to the caller. The browse session's `runQuery` and the export task both use it, so a builder query and its export match the same documents.
- `countDocuments` runs a count aggregation of a query, capped by a limit; the export, bulk update, copy and delete tasks use it for their progress totals and the browse session for `countQuery`.
- `readQueryPages` pages with `startAfter(<last snapshot>)`, so the SDK builds the cursor from every order, including the implicit document id order. Each page asks for at most `limit − read` documents; a short page ends the reading.
