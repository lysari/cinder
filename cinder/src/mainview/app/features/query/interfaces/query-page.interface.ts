import type { QueryMode } from "../../../../../shared/constants/query";
import type { SavedQueryPage } from "../../../../../shared/interfaces/app-state.interface";
import type { FirestoreResult } from "../../../../../shared/interfaces/firestore-value.interface";
import type { StructuredQuery } from "../../../../../shared/interfaces/query.interface";
import type { TaskLogEntry, TaskStatus } from "../../../../../shared/interfaces/task.interface";

export interface QueryRun {
	mode: QueryMode;
	runId: number;
	taskId: string | null;
	status: TaskStatus;
	startedAt: number;
	endedAt: number | null;
	result: FirestoreResult | null;
	logEntries: TaskLogEntry[];
	error: string | null;
	query: StructuredQuery | null;
	hasMore: boolean;
	isLoadingMore: boolean;
	loadMoreError: string | null;
}

export interface QueryPageState extends SavedQueryPage {
	switchError: string | null;
	run: QueryRun | null;
}
