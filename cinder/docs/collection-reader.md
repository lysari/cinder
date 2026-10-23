# src/worker/utils/collection-reader.ts

`readCollection` and `readSubcollections` read a collection (and with `isRecursive` every subcollection below it) page by page for the export and copy tasks.

- Pages hold 500 documents (`READ_PAGE_SIZE`) ordered by document id; after each page come the subcollections of its documents, sorted by id, depth first. Exports rely on this order.
- `readSubcollections` lists the subcollections of all documents of a page at once, then starts reading the first page of the next 16 subcollections ahead (`SUBCOLLECTION_LOOKAHEAD`) while yielding them strictly in order. Many small subcollections would otherwise cost one round trip after another. A first page read ahead that fails rethrows when its turn comes. Memory holds up to 16 first pages per nesting level.
- A collection query only returns documents that exist, so a document that has no fields but holds subcollections is not visited and its subcollections are skipped; reading one document's subcollections (`readSubcollections([reference])`) works whether or not it exists.
- The consumer may delete a page's documents before asking for the next value (a move does): their subcollections are listed afterwards and are still found.
