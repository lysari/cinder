import { type CollectionReference, type DocumentReference, type DocumentSnapshot, FieldPath } from "@google-cloud/firestore";
import { READ_PAGE_SIZE } from "../../shared/constants/data-transfer";
import { readQueryPages } from "./firestore-query";

const SUBCOLLECTION_LOOKAHEAD = 16;

/** Reads a collection in pages of 500 ordered by document id; with `isRecursive`, each page is followed by every subcollection of its documents, depth first. */
export async function* readCollection(collection: CollectionReference, isRecursive: boolean): AsyncGenerator<DocumentSnapshot[]> {
	for await (const page of readQueryPages(collection.orderBy(FieldPath.documentId()), null, READ_PAGE_SIZE)) {
		yield page;
		if (isRecursive) {
			yield* readSubcollections(page.map((snapshot) => snapshot.ref));
		}
	}
}

/** Reads every subcollection of the given documents, sorted by id, with all of their own subcollections, depth first. Pass references of documents that may or may not exist. */
export async function* readSubcollections(references: DocumentReference[]): AsyncGenerator<DocumentSnapshot[]> {
	const collectionLists = await Promise.all(references.map((reference) => reference.listCollections()));
	const readers = collectionLists
		.flatMap((collections) => collections.sort((first, second) => (first.id < second.id ? -1 : 1)))
		.map((collection) => readCollection(collection, true));
	const firstPages = new Map<number, Promise<IteratorResult<DocumentSnapshot[]>>>();
	for (const [index, reader] of readers.entries()) {
		for (const [aheadIndex, aheadReader] of readers.slice(index, index + SUBCOLLECTION_LOOKAHEAD).entries()) {
			if (!firstPages.has(index + aheadIndex)) {
				const firstPage = aheadReader.next();
				// A first page read ahead may fail before it is awaited; it rethrows when its turn comes.
				firstPage.catch(() => undefined);
				firstPages.set(index + aheadIndex, firstPage);
			}
		}
		let result = await (firstPages.get(index) as Promise<IteratorResult<DocumentSnapshot[]>>);
		firstPages.delete(index);
		while (!result.done) {
			yield result.value;
			result = await reader.next();
		}
	}
}
