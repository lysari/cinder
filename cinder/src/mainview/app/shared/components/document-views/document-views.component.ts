import { Component, computed, inject, input } from "@angular/core";
import { Router } from "@angular/router";
import { LucideAngularModule } from "lucide-angular";
import type { DatabaseTarget } from "../../../../../shared/interfaces/account.interface";
import type { FirestoreDocument, FirestoreMapValue } from "../../../../../shared/interfaces/firestore-value.interface";
import { documentsToReadableJson } from "../../../../../shared/utils/firestore-value-json";
import type { DocumentView } from "../../../../../shared/constants/document-view";
import { TabsStore } from "../../../core/stores/tabs.store";
import type { DocumentSelection } from "../../interfaces/document-selection.interface";
import { documentRoute } from "../../utils/explorer-route";
import { CollectionTableComponent } from "../collection-table/collection-table.component";
import { ValueCellComponent } from "../value-cell/value-cell.component";
import { ValueTreeComponent } from "../value-tree/value-tree.component";

@Component({
	selector: "app-document-views",
	imports: [LucideAngularModule, CollectionTableComponent, ValueCellComponent, ValueTreeComponent],
	templateUrl: "./document-views.component.html",
	styleUrl: "./document-views.component.scss",
})
export class DocumentViewsComponent {
	private readonly router = inject(Router);
	private readonly tabs = inject(TabsStore);
	readonly documents = input.required<FirestoreDocument[]>();
	readonly database = input.required<DatabaseTarget>();
	readonly view = input.required<DocumentView>();
	readonly changedPaths = input<ReadonlySet<string>>(new Set());
	protected readonly fieldNames = computed(() =>
		[...new Set(this.documents().flatMap((document) => Object.keys(document.fields)))].sort(),
	);
	protected readonly json = computed(() =>
		this.view() === "json" ? JSON.stringify(documentsToReadableJson(this.documents()), null, 2) : "",
	);

	protected fieldsOf(document: FirestoreDocument): FirestoreMapValue {
		return { type: "map", value: document.fields };
	}

	protected openDocument({ documentPath, isNewTab }: DocumentSelection): void {
		const commands = documentRoute(this.database(), documentPath);
		if (isNewTab) {
			this.tabs.openInNewTab(this.router.serializeUrl(this.router.createUrlTree(commands)), false);
		} else {
			void this.router.navigate(commands);
		}
	}
}
