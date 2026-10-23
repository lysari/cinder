import { Component, computed, input, model, output } from "@angular/core";
import type { DatabaseTarget } from "../../../../../../shared/interfaces/account.interface";
import type { FirestoreDocument } from "../../../../../../shared/interfaces/firestore-value.interface";
import type { LiveStatus } from "../../../../../../shared/interfaces/live.interface";
import { toReadableJson } from "../../../../../../shared/utils/firestore-value-json";
import { DocumentViewsComponent } from "../../../../shared/components/document-views/document-views.component";
import { ValueCellComponent } from "../../../../shared/components/value-cell/value-cell.component";
import { ValueTreeComponent } from "../../../../shared/components/value-tree/value-tree.component";
import { ViewSwitcherComponent } from "../../../../shared/components/view-switcher/view-switcher.component";
import type { DocumentView } from "../../../../../../shared/constants/document-view";
import { scriptErrorLocation } from "../../../../shared/utils/script-error";
import type { QueryRun } from "../../interfaces/query-page.interface";

@Component({
	selector: "app-query-results",
	imports: [DocumentViewsComponent, ValueCellComponent, ValueTreeComponent, ViewSwitcherComponent],
	templateUrl: "./query-results.component.html",
	styleUrl: "./query-results.component.scss",
})
export class QueryResultsComponent {
	readonly run = input.required<QueryRun>();
	readonly database = input.required<DatabaseTarget>();
	readonly view = model.required<DocumentView>();
	readonly liveStatus = input.required<LiveStatus>();
	readonly liveError = input.required<string | null>();
	readonly canGoLive = input.required<boolean>();
	readonly changedPaths = input.required<ReadonlySet<string>>();
	readonly loadMoreRequested = output<void>();
	readonly liveToggled = output<void>();
	protected readonly documents = computed<FirestoreDocument[] | null>(() => {
		const result = this.run().result;
		if (result?.kind === "documents") {
			return result.documents;
		}
		return result?.kind === "document" && result.document ? [result.document] : null;
	});
	protected readonly missingDocumentPath = computed(() => {
		const result = this.run().result;
		return result?.kind === "document" && result.document === null ? result.path : null;
	});
	protected readonly value = computed(() => {
		const result = this.run().result;
		return result?.kind === "value" ? result.value : null;
	});
	protected readonly valueView = computed(() => (this.view() === "json" ? "json" : "tree"));
	protected readonly valueJson = computed(() => {
		const value = this.value();
		return value && this.valueView() === "json" ? JSON.stringify(toReadableJson(value), null, 2) : "";
	});
	protected readonly errorLocation = computed(() => {
		const { mode, error } = this.run();
		return mode === "javascript" && error ? scriptErrorLocation(error) : null;
	});
}
