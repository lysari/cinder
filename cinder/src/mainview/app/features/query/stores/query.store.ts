import { DestroyRef, Injectable, effect, inject, signal } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { DEFAULT_PAGE_SIZE } from "../../../../../shared/constants/browse-session";
import type { QueryMode } from "../../../../../shared/constants/query";
import type { DatabaseTarget } from "../../../../../shared/interfaces/account.interface";
import type { SavedQueryPage } from "../../../../../shared/interfaces/app-state.interface";
import type { FirestoreResult } from "../../../../../shared/interfaces/firestore-value.interface";
import type { LiveStatus, LiveUpdate } from "../../../../../shared/interfaces/live.interface";
import type { QueryForm, QueryFormResult, StructuredQuery } from "../../../../../shared/interfaces/query.interface";
import type { TaskResult } from "../../../../../shared/interfaces/task.interface";
import { generateQueryScript } from "../../../../../shared/utils/query-script";
import { parseQueryScript } from "../../../../../shared/utils/query-script-parser";
import type { Task } from "../../../core/interfaces/task.interface";
import { TasksStore } from "../../../core/stores/tasks.store";
import { ViewStateStore } from "../../../core/stores/view-state.store";
import { errorMessage } from "../../../shared/utils/error-message";
import { LIVE_HIGHLIGHT_MS, applyLiveChanges, changedDocumentPaths, liveWindowSize } from "../../../shared/utils/live-changes";
import { queryFormFromQuery, readQueryForm } from "../../../shared/utils/query-form";
import type { QueryPageState, QueryRun } from "../interfaces/query-page.interface";
import { QueryApiService } from "../services/query-api.service";

const DEFAULT_LIMIT_TEXT = "100";
const ENDED_STATUSES: readonly QueryRun["status"][] = ["done", "failed", "canceled"];
const FIRESTORE_RESULT_KINDS: readonly string[] = ["document", "documents", "value"];

@Injectable()
export class QueryStore {
	private readonly api = inject(QueryApiService);
	private readonly tasks = inject(TasksStore);
	private readonly viewState = inject(ViewStateStore);
	private readonly states = signal<Record<string, QueryPageState>>(
		Object.fromEntries(
			this.viewState
				.queryPages()
				.map((page) => [pageKey(page.tabId, page.database, page.collectionPath), { ...page, switchError: null, run: null }]),
		),
	);
	private nextRunId = 1;
	private listenerId: string | null = null;
	private highlightTimer: ReturnType<typeof setTimeout> | null = null;
	readonly liveKey = signal<string | null>(null);
	readonly liveStatus = signal<LiveStatus>("off");
	readonly liveError = signal<string | null>(null);
	readonly changedPaths = signal<ReadonlySet<string>>(new Set());

	constructor() {
		effect(() => this.viewState.queryPages.set(Object.values(this.states()).map(toSavedQueryPage)));
		this.api.liveUpdates.pipe(takeUntilDestroyed()).subscribe((update) => this.applyLiveUpdate(update));
		inject(DestroyRef).onDestroy(() => {
			this.stopLive();
			this.clearHighlight();
		});
	}

	open(tabId: string, database: DatabaseTarget, collectionPath: string | null): string {
		const key = pageKey(tabId, database, collectionPath);
		if (!this.states()[key]) {
			const form: QueryForm = {
				targetType: "collection",
				targetPath: collectionPath ?? "",
				filters: [],
				orders: [],
				limitText: DEFAULT_LIMIT_TEXT,
			};
			const query = readQueryForm(form).query as StructuredQuery;
			const script = generateQueryScript(query);
			const state: QueryPageState = { tabId, database, collectionPath, mode: "builder", form, script, switchError: null, run: null };
			this.states.update((states) => ({ ...states, [key]: state }));
		}
		return key;
	}

	stateOf(key: string): QueryPageState | undefined {
		const state = this.states()[key];
		const taskId = state?.run?.mode === "javascript" ? state.run.taskId : null;
		const task = taskId === null ? undefined : this.tasks.taskOf(taskId);
		return state?.run && task ? { ...state, run: withTask(state.run, task) } : state;
	}

	formResultOf(key: string): QueryFormResult | null {
		const state = this.stateOf(key);
		return state ? readQueryForm(state.form) : null;
	}

	saveForm(key: string, form: QueryForm): void {
		this.patch(key, { form });
	}

	saveScript(key: string, script: string): void {
		this.patch(key, { script, switchError: null });
	}

	showJavaScript(key: string): void {
		const state = this.stateOf(key);
		if (!state || state.mode === "javascript") {
			return;
		}
		const { query, issues } = readQueryForm(state.form);
		const script = query && issues.length === 0 ? generateQueryScript(query) : state.script;
		this.patch(key, { mode: "javascript", script, switchError: null });
	}

	showBuilder(key: string): void {
		const state = this.stateOf(key);
		if (!state || state.mode === "builder") {
			return;
		}
		const parsed = parseQueryScript(state.script);
		if (!parsed.isParsed) {
			this.patch(key, { switchError: `${parsed.reason} The script stays in JavaScript.` });
			return;
		}
		const form = queryFormFromQuery(parsed.query);
		if (JSON.stringify(readQueryForm(form).query) !== JSON.stringify(parsed.query)) {
			this.patch(key, { switchError: "The query builder cannot show a value of this script. The script stays in JavaScript." });
			return;
		}
		this.patch(key, { mode: "builder", form, switchError: null });
	}

	run(key: string): Promise<void> {
		const state = this.stateOf(key);
		if (!state || (state.run && !ENDED_STATUSES.includes(state.run.status))) {
			return Promise.resolve();
		}
		this.stopLive();
		this.liveError.set(null);
		return state.mode === "builder" ? this.runBuilderQuery(key, state) : this.runScript(key, state);
	}

	async cancel(key: string): Promise<void> {
		const run = this.stateOf(key)?.run;
		if (!run || ENDED_STATUSES.includes(run.status)) {
			return;
		}
		if (run.mode === "builder") {
			this.updateRun(key, run.runId, (current) => ({ ...current, status: "canceled", endedAt: Date.now() }));
		} else if (run.taskId !== null) {
			await this.tasks.cancel(run.taskId);
		}
	}

	async loadMore(key: string): Promise<void> {
		const state = this.stateOf(key);
		const run = state?.run;
		const documents = run?.result?.kind === "documents" ? run.result.documents : [];
		const lastDocument = documents.at(-1);
		if (!state || !run?.query || !run.hasMore || run.isLoadingMore || !lastDocument) {
			return;
		}
		this.updateRun(key, run.runId, (current) => ({ ...current, isLoadingMore: true, loadMoreError: null }));
		try {
			const page = await this.api.runQuery({
				database: state.database,
				query: run.query,
				pageSize: DEFAULT_PAGE_SIZE,
				startAfter: { documentPath: lastDocument.path, documentCount: documents.length },
			});
			this.updateRun(key, run.runId, (current) => ({
				...current,
				result: { kind: "documents", documents: [...documents, ...page.documents] },
				hasMore: page.hasMore,
				isLoadingMore: false,
			}));
		} catch (error) {
			this.updateRun(key, run.runId, (current) => ({ ...current, isLoadingMore: false, loadMoreError: errorMessage(error) }));
		}
	}

	async startLive(key: string): Promise<void> {
		const state = this.stateOf(key);
		const run = state?.run;
		if (!state || run?.mode !== "builder" || run.status !== "done" || !run.query || run.result?.kind !== "documents") {
			return;
		}
		this.stopLive();
		const listenerId = crypto.randomUUID();
		this.listenerId = listenerId;
		this.liveKey.set(key);
		this.liveStatus.set("starting");
		this.liveError.set(null);
		try {
			await this.api.startLive({
				listenerId,
				database: state.database,
				query: run.query,
				limit: liveWindowSize(run.result.documents.length, run.hasMore, run.query.limit),
			});
		} catch (error) {
			if (this.listenerId === listenerId) {
				this.listenerId = null;
				this.liveStatus.set("off");
				this.liveError.set(errorMessage(error));
			}
		}
	}

	stopLive(): void {
		const listenerId = this.listenerId;
		if (listenerId === null) {
			return;
		}
		this.listenerId = null;
		this.liveStatus.set("off");
		this.api.stopLive(listenerId).catch((error: unknown) => this.liveError.set(errorMessage(error)));
	}

	private applyLiveUpdate(update: LiveUpdate): void {
		const key = this.liveKey();
		const run = key === null ? undefined : this.states()[key]?.run;
		if (update.listenerId !== this.listenerId || key === null || !run) {
			return;
		}
		if (update.kind === "stopped") {
			this.listenerId = null;
			this.liveStatus.set("off");
			this.liveError.set(update.reason);
			return;
		}
		this.liveStatus.set("on");
		this.updateRun(key, run.runId, (current) => {
			const documents = current.result?.kind === "documents" ? current.result.documents : [];
			return { ...current, result: { kind: "documents", documents: applyLiveChanges(documents, update) } };
		});
		const paths = changedDocumentPaths(update);
		if (paths.length > 0) {
			this.changedPaths.update((changedPaths) => new Set([...changedPaths, ...paths]));
			this.clearHighlight();
			this.highlightTimer = setTimeout(() => this.changedPaths.set(new Set()), LIVE_HIGHLIGHT_MS);
		}
	}

	private clearHighlight(): void {
		if (this.highlightTimer !== null) {
			clearTimeout(this.highlightTimer);
			this.highlightTimer = null;
		}
	}

	private async runBuilderQuery(key: string, state: QueryPageState): Promise<void> {
		const { query, issues } = readQueryForm(state.form);
		if (!query || issues.length > 0) {
			return;
		}
		const runId = this.startRun(key, "builder", "running", query);
		try {
			const page = await this.api.runQuery({ database: state.database, query, pageSize: DEFAULT_PAGE_SIZE, startAfter: null });
			const result = { kind: "documents" as const, documents: page.documents };
			this.updateRun(key, runId, (run) =>
				run.status === "running" ? { ...run, status: "done", endedAt: Date.now(), result, hasMore: page.hasMore } : run,
			);
		} catch (error) {
			this.updateRun(key, runId, (run) =>
				run.status === "running" ? { ...run, status: "failed", endedAt: Date.now(), error: errorMessage(error) } : run,
			);
		}
	}

	private async runScript(key: string, state: QueryPageState): Promise<void> {
		const runId = this.startRun(key, "javascript", "queued", null);
		const { database, script } = state;
		try {
			const taskId = await this.tasks.start(
				{ type: "run-script", database, script },
				`Script on ${database.projectId} / ${database.databaseId}`,
			);
			this.updateRun(key, runId, (run) => ({ ...run, taskId }));
		} catch (error) {
			this.updateRun(key, runId, (run) => ({ ...run, status: "failed", endedAt: Date.now(), error: errorMessage(error) }));
		}
	}

	private startRun(key: string, mode: QueryMode, status: QueryRun["status"], query: StructuredQuery | null): number {
		const runId = this.nextRunId++;
		const run: QueryRun = {
			mode,
			runId,
			taskId: null,
			status,
			startedAt: Date.now(),
			endedAt: null,
			result: null,
			logEntries: [],
			error: null,
			query,
			hasMore: false,
			isLoadingMore: false,
			loadMoreError: null,
		};
		this.patch(key, { run });
		return runId;
	}

	private updateRun(key: string, runId: number, change: (run: QueryRun) => QueryRun): void {
		this.states.update((states) => {
			const state = states[key];
			if (!state?.run || state.run.runId !== runId) {
				return states;
			}
			return { ...states, [key]: { ...state, run: change(state.run) } };
		});
	}

	private patch(key: string, changes: Partial<QueryPageState>): void {
		this.states.update((states) => {
			const state = states[key];
			return state ? { ...states, [key]: { ...state, ...changes } } : states;
		});
	}
}

function pageKey(tabId: string, { accountId, projectId, databaseId }: DatabaseTarget, collectionPath: string | null): string {
	return JSON.stringify([tabId, accountId, projectId, databaseId, collectionPath]);
}

function toSavedQueryPage({ tabId, database, collectionPath, mode, form, script }: QueryPageState): SavedQueryPage {
	return { tabId, database, collectionPath, mode, form, script };
}

function withTask(run: QueryRun, task: Task): QueryRun {
	return {
		...run,
		status: task.status,
		endedAt: task.endedAt,
		logEntries: task.logEntries,
		result: isFirestoreResult(task.result) ? task.result : null,
		error: task.error,
	};
}

function isFirestoreResult(result: TaskResult | null): result is FirestoreResult {
	return result !== null && FIRESTORE_RESULT_KINDS.includes(result.kind);
}
