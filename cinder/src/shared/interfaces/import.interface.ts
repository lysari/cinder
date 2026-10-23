import type { ImportFormat, WriteMode } from "../constants/data-transfer";
import type { DatabaseTarget } from "./account.interface";
import type { FirestoreValue } from "./firestore-value.interface";

export type ImportTarget = { type: "original-paths" } | { type: "collection"; collectionPath: string };

export interface ImportTaskRequest {
	type: "import";
	database: DatabaseTarget;
	filePath: string;
	format: ImportFormat;
	target: ImportTarget;
	writeMode: WriteMode;
}

export interface ImportFileSummary {
	filePath: string;
	fileName: string;
	byteCount: number;
	format: ImportFormat | "csv";
	rootPath: string | null;
	exportedAt: string | null;
}

export interface CinderDocument {
	path: string;
	fields: Record<string, FirestoreValue>;
}

export interface CinderHeaderSummary {
	rootPath: string | null;
	exportedAt: string | null;
}
