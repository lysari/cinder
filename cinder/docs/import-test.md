# tests/worker/tasks/import.test.ts

## Hidden constraints

- The round-trip source is `USER_COUNT` (2) users, each with `orders/order-1/items/item-1`, so it still covers every value type and every subcollection depth. Keep it small: the export and the test's `readTree` call `listCollections` once per document, and on a long-running Firestore emulator one call takes about 13 ms instead of under 1 ms on a fresh one. With the earlier 30 users (90 documents, about 270 calls per test) each round-trip test took about 3.8 s and passed bun's 5 s default timeout under load; with 2 users it takes well under a second.
- One user's file is far smaller than Bun's 256 KB file stream chunk, as the 30-user file was, so the fixture size never decided how many chunks the import reads.
