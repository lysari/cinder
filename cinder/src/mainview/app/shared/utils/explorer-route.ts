import type { DatabaseTarget } from "../../../../shared/interfaces/account.interface";

/** Builds the router commands of a database page. Pass them to `routerLink` or `Router.navigate`. */
export function databaseRoute({ accountId, projectId, databaseId }: DatabaseTarget): string[] {
	return ["/explorer", accountId, projectId, databaseId];
}

/** Builds the router commands of a collection page. The whole path is one URL segment, so the router encodes its slashes as %2F. */
export function collectionRoute(database: DatabaseTarget, collectionPath: string): string[] {
	return [...databaseRoute(database), "c", collectionPath];
}

/** Builds the router commands of the page that adds a document to a collection. */
export function addDocumentRoute(database: DatabaseTarget, collectionPath: string): string[] {
	return [...collectionRoute(database, collectionPath), "new"];
}

/** Builds the router commands of a document page. The whole path is one URL segment, so the router encodes its slashes as %2F. */
export function documentRoute(database: DatabaseTarget, documentPath: string): string[] {
	return [...databaseRoute(database), "d", documentPath];
}
