import { DEFAULT_PAGE_SIZE, MAX_LIVE_DOCUMENTS } from "../../../../shared/constants/browse-session";
import type { FirestoreDocument } from "../../../../shared/interfaces/firestore-value.interface";
import type { LiveChanges } from "../../../../shared/interfaces/live.interface";

export const LIVE_HIGHLIGHT_MS = 1500;

/** Applies one batch of live changes to the loaded documents and returns the new list. Changes must be applied in the order Firestore sent them; a first batch starts from an empty list. */
export function applyLiveChanges(documents: readonly FirestoreDocument[], update: LiveChanges): FirestoreDocument[] {
	const next = update.isFirst ? [] : [...documents];
	for (const change of update.changes) {
		if (change.oldIndex !== -1) {
			next.splice(change.oldIndex, 1);
		}
		if (change.newIndex !== -1) {
			next.splice(change.newIndex, 0, change.document);
		}
	}
	return next;
}

/** Returns the paths a batch added or modified, for a brief highlight. A first batch highlights nothing. */
export function changedDocumentPaths(update: LiveChanges): string[] {
	return update.isFirst ? [] : update.changes.filter((change) => change.type !== "removed").map((change) => change.document.path);
}

/** Returns how many documents a live listener follows: the loaded ones, plus room for one more page when every document is loaded, capped by the query's own limit and the live maximum. */
export function liveWindowSize(loadedCount: number, hasMore: boolean, queryLimit: number | null): number {
	const window = hasMore ? loadedCount : loadedCount + DEFAULT_PAGE_SIZE;
	return Math.max(1, Math.min(window, queryLimit ?? Number.POSITIVE_INFINITY, MAX_LIVE_DOCUMENTS));
}
