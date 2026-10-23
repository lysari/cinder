import type { ExportFormat } from "../constants/data-transfer";
import type { DatabaseTarget } from "./account.interface";
import type { StructuredQuery } from "./query.interface";

export type ExportSource =
	| { type: "collection"; collectionPath: string; isRecursive: boolean }
	| { type: "collection-group"; collectionId: string }
	| { type: "query"; query: StructuredQuery }
	| { type: "document"; documentPath: string; isRecursive: boolean };

export interface ExportTaskRequest {
	type: "export";
	database: DatabaseTarget;
	source: ExportSource;
	format: ExportFormat;
	folderPath: string;
	fileName: string;
	isOverwriting: boolean;
}

export interface ExportTaskResult {
	kind: "export";
	filePath: string;
	documentCount: number;
	byteCount: number;
}

export interface ExportFileParams {
	folderPath: string;
	fileName: string;
	format: ExportFormat;
}

export interface ExportFileCheck {
	filePath: string;
	isExisting: boolean;
}

export interface CinderExportHeader {
	format: string;
	version: number;
	exportedAt: string;
	projectId: string;
	databaseId: string;
	source: ExportSource;
	rootPath: string | null;
}
