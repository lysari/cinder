import { Component, input } from "@angular/core";
import type { DatabaseTarget } from "../../../../../../shared/interfaces/account.interface";
import type { BulkUpdatePreviewDocument } from "../../../../../../shared/interfaces/bulk-update.interface";
import { ValueCellComponent } from "../../../../shared/components/value-cell/value-cell.component";

@Component({
	selector: "app-bulk-update-preview",
	imports: [ValueCellComponent],
	templateUrl: "./bulk-update-preview.component.html",
	styleUrl: "./bulk-update-preview.component.scss",
})
export class BulkUpdatePreviewComponent {
	readonly documents = input.required<BulkUpdatePreviewDocument[]>();
	readonly database = input.required<DatabaseTarget>();
}
