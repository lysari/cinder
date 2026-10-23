import type { DatabaseTarget } from "./account.interface";
import type { FirestoreDocument } from "./firestore-value.interface";
import type { StructuredQuery } from "./query.interface";

export interface LiveQueryParams {
	listenerId: string;
	database: DatabaseTarget;
	query: StructuredQuery;
	limit: number;
}

export interface StopLiveParams {
	listenerId: string;
}

export interface LiveDocumentChange {
	type: "added" | "modified" | "removed";
	document: FirestoreDocument;
	oldIndex: number;
	newIndex: number;
}

export interface LiveChanges {
	listenerId: string;
	kind: "changes";
	isFirst: boolean;
	changes: LiveDocumentChange[];
}

export interface LiveStop {
	listenerId: string;
	kind: "stopped";
	reason: string;
}

export type LiveUpdate = LiveChanges | LiveStop;

export type LiveStatus = "off" | "starting" | "on";
