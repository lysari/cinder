import type { DatabaseTarget } from "../../../../shared/interfaces/account.interface";
import type { StructuredQuery } from "../../../../shared/interfaces/query.interface";

/** Builds the router commands of the bulk update page for every document of a collection. The path is one URL segment, like the explorer routes. */
export function bulkUpdateCollectionRoute(database: DatabaseTarget, collectionPath: string): string[] {
	return [...bulkEditRoute("update", database), "c", collectionPath];
}

/** Builds the router commands of the bulk update page for the documents a builder query matches; the query travels as JSON in one URL segment. */
export function bulkUpdateQueryRoute(database: DatabaseTarget, query: StructuredQuery): string[] {
	return [...bulkEditRoute("update", database), "q", JSON.stringify(query)];
}

/** Builds the router commands of the page that deletes a collection with all of its subcollections. */
export function deleteCollectionRoute(database: DatabaseTarget, collectionPath: string): string[] {
	return [...bulkEditRoute("delete", database), "c", collectionPath];
}

/** Builds the router commands of the page that deletes the documents a builder query matches. */
export function deleteQueryRoute(database: DatabaseTarget, query: StructuredQuery): string[] {
	return [...bulkEditRoute("delete", database), "q", JSON.stringify(query)];
}

function bulkEditRoute(page: "update" | "delete", { accountId, projectId, databaseId }: DatabaseTarget): string[] {
	return ["/bulk-edit", page, accountId, projectId, databaseId];
}
