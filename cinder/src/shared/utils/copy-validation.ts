import type { DatabaseTarget } from "../interfaces/account.interface";
import type { CopyTaskRequest } from "../interfaces/copy.interface";
import { isCollectionPath, isDocumentPath } from "./firestore-validation";

/** Returns why a copy or move cannot run (wrong destination path type, the source itself, or a destination inside a moved or recursively copied tree), or null when it can. */
export function copyRequestError({ database, source, destination, isMove, isRecursive }: CopyTaskRequest): string | null {
	const sourcePath = source.type === "collection" ? source.collectionPath : source.documentPath;
	if (source.type === "collection" && !isCollectionPath(destination.path)) {
		return "Enter a collection path for the destination, such as users or users/dara/orders.";
	}
	if (source.type === "document" && !isDocumentPath(destination.path)) {
		return "Enter a document path for the destination, such as users/dara.";
	}
	if (!isSameDatabase(database, destination.database)) {
		return null;
	}
	if (destination.path === sourcePath) {
		return "The destination is the source itself.";
	}
	if (!destination.path.startsWith(`${sourcePath}/`)) {
		return null;
	}
	if (isMove) {
		return "Nothing can be moved into itself; choose a destination outside the source.";
	}
	return isRecursive ? "The destination lies inside the source; choose a path outside it, or copy without subcollections." : null;
}

/** Checks whether two targets name the same database of the same account. */
export function isSameDatabase(first: DatabaseTarget, second: DatabaseTarget): boolean {
	return first.accountId === second.accountId && first.projectId === second.projectId && first.databaseId === second.databaseId;
}
