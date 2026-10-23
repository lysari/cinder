import type { DatabaseTarget } from "./account.interface";
import type { StructuredQuery } from "./query.interface";

export type DeleteSource = { type: "collection"; collectionPath: string } | { type: "query"; query: StructuredQuery };

export interface DeleteCollectionTaskRequest {
	type: "delete-collection";
	database: DatabaseTarget;
	source: DeleteSource;
}
