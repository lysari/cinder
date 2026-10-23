import type { DatabaseTarget } from "../../../../shared/interfaces/account.interface";

/** Builds the router commands of the query page of a database; pass a collection path to start the builder on that collection, or null. */
export function queryRoute({ accountId, projectId, databaseId }: DatabaseTarget, collectionPath: string | null): string[] {
	const databaseCommands = ["/query", accountId, projectId, databaseId];
	return collectionPath === null ? databaseCommands : [...databaseCommands, "c", collectionPath];
}
