import type { Firestore, Query, QueryDocumentSnapshot } from "@google-cloud/firestore";
import type { StructuredQuery } from "../../shared/interfaces/query.interface";
import { decodeValue } from "./firestore-value-decoder";

/** Builds the SDK query of a structured query without its limit; filter values are decoded like writes. Pass a query checked by `validateQuery`. */
export function buildQuery(db: Firestore, { target, filters, orders }: StructuredQuery): Query {
	let query: Query =
		target.type === "collection" ? db.collection(target.collectionPath) : db.collectionGroup(target.collectionId);
	for (const filter of filters) {
		query = query.where(filter.fieldPath, filter.operator, decodeValue(filter.value, db));
	}
	for (const order of orders) {
		query = query.orderBy(order.fieldPath, order.direction);
	}
	return query;
}

/** Reads a query page by page, each page starting after the last document of the previous one, until `limit` documents (null for all). */
export async function* readQueryPages(query: Query, limit: number | null, pageSize: number): AsyncGenerator<QueryDocumentSnapshot[]> {
	let readCount = 0;
	let lastDocument: QueryDocumentSnapshot | null = null;
	while (limit === null || readCount < limit) {
		const size = limit === null ? pageSize : Math.min(pageSize, limit - readCount);
		const page = lastDocument === null ? query.limit(size) : query.startAfter(lastDocument).limit(size);
		const { docs } = await page.get();
		if (docs.length > 0) {
			yield docs;
		}
		if (docs.length < size) {
			return;
		}
		readCount += docs.length;
		lastDocument = docs[docs.length - 1] as QueryDocumentSnapshot;
	}
}

/** Counts the documents a query matches with a count aggregation, at most `limit` (null for all). */
export async function countDocuments(query: Query, limit: number | null): Promise<number> {
	const snapshot = await (limit === null ? query : query.limit(limit)).count().get();
	return Number(snapshot.data().count);
}
