import { describe, expect, test } from "bun:test";
import { DEFAULT_PAGE_SIZE, MAX_LIVE_DOCUMENTS } from "../../../../../src/shared/constants/browse-session";
import type { FirestoreDocument } from "../../../../../src/shared/interfaces/firestore-value.interface";
import type { LiveChanges, LiveDocumentChange } from "../../../../../src/shared/interfaces/live.interface";
import { applyLiveChanges, changedDocumentPaths, liveWindowSize } from "../../../../../src/mainview/app/shared/utils/live-changes";

function documentOf(id: string, count = 1): FirestoreDocument {
	return { id, path: `items/${id}`, createTime: null, updateTime: null, fields: { count: { type: "integer", value: String(count) } } } as unknown as FirestoreDocument;
}

function change(type: LiveDocumentChange["type"], id: string, oldIndex: number, newIndex: number, count = 1): LiveDocumentChange {
	return { type, document: documentOf(id, count), oldIndex, newIndex };
}

function batch(changes: LiveDocumentChange[], isFirst = false): LiveChanges {
	return { listenerId: "l", kind: "changes", isFirst, changes };
}

describe("applyLiveChanges", () => {
	test("starts a first batch from an empty list", () => {
		const documents = applyLiveChanges([documentOf("stale")], batch([change("added", "a", -1, 0), change("added", "b", -1, 1)], true));
		expect(documents.map(({ id }) => id)).toEqual(["a", "b"]);
	});

	test("applies additions, moves and removals in order", () => {
		const loaded = ["a", "b", "c"].map((id) => documentOf(id));
		const documents = applyLiveChanges(
			loaded,
			batch([change("removed", "a", 0, -1), change("modified", "c", 1, 0, 7), change("added", "d", -1, 2)]),
		);
		expect(documents.map(({ id }) => id)).toEqual(["c", "b", "d"]);
		expect(documents[0].fields.count).toEqual({ type: "integer", value: "7" });
		expect(loaded.map(({ id }) => id)).toEqual(["a", "b", "c"]);
	});
});

describe("changedDocumentPaths", () => {
	test("lists added and modified paths, never removed ones or a first batch", () => {
		expect(changedDocumentPaths(batch([change("added", "a", -1, 0), change("removed", "b", 1, -1), change("modified", "c", 1, 1)]))).toEqual([
			"items/a",
			"items/c",
		]);
		expect(changedDocumentPaths(batch([change("added", "a", -1, 0)], true))).toEqual([]);
	});
});

describe("liveWindowSize", () => {
	test("follows the loaded documents, with room for a page when all are loaded, within both limits", () => {
		expect(liveWindowSize(120, true, null)).toBe(120);
		expect(liveWindowSize(3, false, null)).toBe(3 + DEFAULT_PAGE_SIZE);
		expect(liveWindowSize(3, false, 10)).toBe(10);
		expect(liveWindowSize(0, false, null)).toBe(DEFAULT_PAGE_SIZE);
		expect(liveWindowSize(MAX_LIVE_DOCUMENTS, false, null)).toBe(MAX_LIVE_DOCUMENTS);
	});
});
