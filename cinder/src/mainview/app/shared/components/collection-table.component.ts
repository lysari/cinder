import { Component, input, output } from "@angular/core";
import { RouterLink } from "@angular/router";
import type { DatabaseTarget } from "../../../../shared/interfaces/account.interface";
import type { FirestoreDocument } from "../../../../shared/interfaces/firestore-value.interface";
import type { DocumentSelection } from "../interfaces/document-selection.interface";
import { documentRoute } from "../utils/explorer-route";
import { ValueCellComponent } from "./value-cell.component";

@Component({
	selector: "app-collection-table",
	imports: [RouterLink, ValueCellComponent],
	templateUrl: "./collection-table.component.html",
	styleUrl: "./collection-table.component.scss",
})
export class CollectionTableComponent {
	readonly documents = input.required<FirestoreDocument[]>();
	readonly fieldNames = input.required<string[]>();
	readonly database = input.required<DatabaseTarget>();
	readonly changedPaths = input.required<ReadonlySet<string>>();
	readonly documentSelected = output<DocumentSelection>();

	protected documentLink(documentPath: string): string[] {
		return documentRoute(this.database(), documentPath);
	}
}
