import { Component, computed, input } from "@angular/core";
import { RouterLink } from "@angular/router";
import type { DatabaseTarget } from "../../../../../shared/interfaces/account.interface";
import type { FirestoreValue } from "../../../../../shared/interfaces/firestore-value.interface";
import { documentRoute } from "../../../shared/utils/explorer-route";
import { formatTimestampUtc, formatValueSummary } from "../../../shared/utils/firestore-value-format";

@Component({
	selector: "app-value-cell",
	imports: [RouterLink],
	templateUrl: "./value-cell.component.html",
	styleUrl: "./value-cell.component.scss",
})
export class ValueCellComponent {
	readonly value = input.required<FirestoreValue>();
	readonly database = input.required<DatabaseTarget>();
	protected readonly summary = computed(() => formatValueSummary(this.value()));
	protected readonly referenceRoute = computed(() => {
		const value = this.value();
		return value.type === "reference" ? documentRoute(this.database(), value.value) : null;
	});
	protected readonly title = computed(() => {
		const value = this.value();
		return value.type === "timestamp" ? `${formatTimestampUtc(value.value)} (UTC)` : this.summary();
	});
	protected readonly numberHint = computed(() => {
		const { type } = this.value();
		return type === "integer" ? "int" : type === "double" ? "dbl" : null;
	});
}
