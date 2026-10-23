import type { WriteMode } from "../constants/data-transfer";
import type { DatabaseTarget } from "./account.interface";

export type CopySource = { type: "collection"; collectionPath: string } | { type: "document"; documentPath: string };

export interface CopyDestination {
	database: DatabaseTarget;
	path: string;
}

export interface CopyTaskRequest {
	type: "copy";
	database: DatabaseTarget;
	source: CopySource;
	destination: CopyDestination;
	isMove: boolean;
	isRecursive: boolean;
	writeMode: WriteMode;
	isRewritingReferences: boolean;
}
