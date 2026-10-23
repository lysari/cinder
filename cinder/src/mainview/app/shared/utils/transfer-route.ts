import type { DatabaseTarget } from "../../../../shared/interfaces/account.interface";
import type { CopySource } from "../../../../shared/interfaces/copy.interface";
import type { StructuredQuery } from "../../../../shared/interfaces/query.interface";

export const COPY_OPERATIONS = ["copy", "move", "duplicate", "rename"] as const;
export type CopyOperation = (typeof COPY_OPERATIONS)[number];

/** Builds the router commands of the export page for a collection. The path is one URL segment, like the explorer routes. */
export function exportCollectionRoute(database: DatabaseTarget, collectionPath: string): string[] {
	return [...transferRoute("export", database), "c", collectionPath];
}

/** Builds the router commands of the export page for one document. */
export function exportDocumentRoute(database: DatabaseTarget, documentPath: string): string[] {
	return [...transferRoute("export", database), "d", documentPath];
}

/** Builds the router commands of the export page for a builder query; the query travels as JSON in one URL segment. */
export function exportQueryRoute(database: DatabaseTarget, query: StructuredQuery): string[] {
	return [...transferRoute("export", database), "q", JSON.stringify(query)];
}

/** Builds the router commands of the import page; pass a collection path to preselect it as the target, or null. */
export function importRoute(database: DatabaseTarget, collectionPath: string | null): string[] {
	const commands = transferRoute("import", database);
	return collectionPath === null ? commands : [...commands, "c", collectionPath];
}

/** Builds the router commands of the copy page for a collection or document, opened on one operation: copy, move, duplicate (documents) or rename (collections). */
export function copyRoute(database: DatabaseTarget, source: CopySource, operation: CopyOperation): string[] {
	const sourceCommands = source.type === "collection" ? ["c", source.collectionPath] : ["d", source.documentPath];
	return [...transferRoute("copy", database), ...sourceCommands, operation];
}

function transferRoute(page: "export" | "import" | "copy", { accountId, projectId, databaseId }: DatabaseTarget): string[] {
	return ["/transfer", page, accountId, projectId, databaseId];
}
