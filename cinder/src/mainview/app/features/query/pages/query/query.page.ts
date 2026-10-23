import { Component, DestroyRef, computed, effect, inject, input, signal, untracked } from "@angular/core";
import { RouterLink } from "@angular/router";
import { LucideAngularModule } from "lucide-angular";
import type { DatabaseTarget } from "../../../../../../shared/interfaces/account.interface";
import type { QueryIssue } from "../../../../../../shared/interfaces/query.interface";
import type { TaskLogEntry, TaskStatus } from "../../../../../../shared/interfaces/task.interface";
import { MAX_LIVE_DOCUMENTS } from "../../../../../../shared/constants/browse-session";
import { AccountsStore } from "../../../../core/stores/accounts.store";
import { TabsStore } from "../../../../core/stores/tabs.store";
import { ViewStateStore } from "../../../../core/stores/view-state.store";
import { CodeEditorComponent } from "../../../../shared/components/code-editor/code-editor.component";
import { completeScriptContext } from "../../../../shared/utils/script-completion";
import { bulkUpdateQueryRoute, deleteQueryRoute } from "../../../../shared/utils/bulk-edit-route";
import { exportQueryRoute } from "../../../../shared/utils/transfer-route";
import { QueryBuilderComponent } from "../../components/query-builder/query-builder.component";
import { QueryConsoleComponent } from "../../components/query-console/query-console.component";
import { QueryResultsComponent } from "../../components/query-results/query-results.component";
import { QueryStore } from "../../stores/query.store";

const ELAPSED_TICK_MS = 100;
const NO_ISSUES: QueryIssue[] = [];
const NO_LOG_ENTRIES: TaskLogEntry[] = [];
const MILLIS_PER_SECOND = 1000;
const STATUS_LABELS: Record<TaskStatus, string> = {
	queued: "Queued",
	running: "Running",
	done: "Done",
	failed: "Failed",
	canceled: "Canceled",
};

@Component({
	selector: "app-query-page",
	imports: [RouterLink, LucideAngularModule, CodeEditorComponent, QueryBuilderComponent, QueryConsoleComponent, QueryResultsComponent],
	templateUrl: "./query.page.html",
	styleUrl: "./query.page.scss",
})
export class QueryPage {
	private readonly accounts = inject(AccountsStore);
	private readonly tabs = inject(TabsStore);
	private readonly now = signal(Date.now());
	protected readonly store = inject(QueryStore);
	readonly accountId = input.required<string>();
	readonly projectId = input.required<string>();
	readonly databaseId = input.required<string>();
	readonly collectionPath = input<string>();
	protected readonly completionSources = [completeScriptContext];
	protected readonly statusLabels = STATUS_LABELS;
	protected readonly key = signal<string | null>(null);
	protected readonly documentView = inject(ViewStateStore).documentView;
	protected readonly liveStatus = computed(() => (this.store.liveKey() === this.key() ? this.store.liveStatus() : "off"));
	protected readonly liveError = computed(() => (this.store.liveKey() === this.key() ? this.store.liveError() : null));
	protected readonly canGoLive = computed(() => {
		const run = this.state()?.run;
		return (
			run?.mode === "builder" &&
			run.status === "done" &&
			run.result?.kind === "documents" &&
			run.result.documents.length <= MAX_LIVE_DOCUMENTS
		);
	});
	protected readonly database = computed<DatabaseTarget>(() => ({
		accountId: this.accountId(),
		projectId: this.projectId(),
		databaseId: this.databaseId(),
	}));
	protected readonly accountLabel = computed(() => this.accounts.labelOf(this.accountId()));
	protected readonly state = computed(() => {
		const key = this.key();
		return key === null ? undefined : this.store.stateOf(key);
	});
	protected readonly formResult = computed(() => {
		const key = this.key();
		return key === null ? null : this.store.formResultOf(key);
	});
	protected readonly issues = computed(() => this.formResult()?.issues ?? NO_ISSUES);
	protected readonly builderQuery = computed(() => {
		const result = this.formResult();
		const isBuilder = this.state()?.mode === "builder";
		return isBuilder && result?.query && result.issues.length === 0 ? result.query : null;
	});
	protected readonly exportLink = computed(() => {
		const query = this.builderQuery();
		return query ? exportQueryRoute(this.database(), query) : null;
	});
	protected readonly bulkUpdateLink = computed(() => {
		const query = this.builderQuery();
		return query ? bulkUpdateQueryRoute(this.database(), query) : null;
	});
	protected readonly deleteLink = computed(() => {
		const query = this.builderQuery();
		return query ? deleteQueryRoute(this.database(), query) : null;
	});
	protected readonly logEntries = computed(() => this.state()?.run?.logEntries ?? NO_LOG_ENTRIES);
	protected readonly isRunning = computed(() => {
		const status = this.state()?.run?.status;
		return status === "queued" || status === "running";
	});
	protected readonly canRun = computed(() => {
		const state = this.state();
		if (!state) {
			return false;
		}
		if (state.mode === "javascript") {
			return state.script.trim().length > 0;
		}
		const result = this.formResult();
		return result !== null && result.query !== null && result.issues.length === 0;
	});
	protected readonly elapsed = computed(() => {
		const run = this.state()?.run;
		return run ? formatDuration((run.endedAt ?? this.now()) - run.startedAt) : "";
	});
	protected readonly resultCount = computed(() => {
		const run = this.state()?.run;
		if (run?.status !== "done" || !run.result) {
			return "";
		}
		if (run.result.kind === "value") {
			return "1 value";
		}
		const count = run.result.kind === "documents" ? run.result.documents.length : run.result.document ? 1 : 0;
		const label = count === 1 ? "1 document" : `${count} documents`;
		return run.hasMore ? `${label}, more available` : label;
	});

	constructor() {
		effect(() => {
			const tabId = this.tabs.activeTabId();
			const database = this.database();
			const collectionPath = this.collectionPath() ?? null;
			untracked(() => {
				this.store.stopLive();
				this.key.set(this.store.open(tabId, database, collectionPath));
			});
		});
		inject(DestroyRef).onDestroy(() => this.store.stopLive());
		effect((onCleanup) => {
			if (!this.isRunning()) {
				return;
			}
			const timer = setInterval(() => this.now.set(Date.now()), ELAPSED_TICK_MS);
			onCleanup(() => clearInterval(timer));
		});
	}
}

function formatDuration(milliseconds: number): string {
	return milliseconds < MILLIS_PER_SECOND ? `${milliseconds} ms` : `${(milliseconds / MILLIS_PER_SECOND).toFixed(1)} s`;
}
