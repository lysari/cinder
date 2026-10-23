import { Component, computed, input } from "@angular/core";
import { LucideAngularModule } from "lucide-angular";
import type { DatabaseTarget } from "../../../../../shared/interfaces/account.interface";
import type { FirestoreArrayValue, FirestoreMapValue, FirestoreValue } from "../../../../../shared/interfaces/firestore-value.interface";
import { compareNames } from "../../../shared/utils/value-draft";
import { ValueCellComponent } from "./value-cell.component";

interface TreeEntry {
	label: string;
	value: FirestoreValue;
	children: FirestoreMapValue | FirestoreArrayValue | null;
}

@Component({
	selector: "app-value-tree",
	imports: [LucideAngularModule, ValueCellComponent],
	templateUrl: "./value-tree.component.html",
	styleUrl: "./value-tree.component.scss",
})
export class ValueTreeComponent {
	readonly value = input.required<FirestoreMapValue | FirestoreArrayValue>();
	readonly database = input.required<DatabaseTarget>();
	protected readonly entries = computed<TreeEntry[]>(() => {
		const value = this.value();
		const pairs: [string, FirestoreValue][] =
			value.type === "map"
				? Object.entries(value.value).sort(([first], [second]) => compareNames(first, second))
				: value.value.map((item, index) => [`[${index}]`, item]);
		return pairs.map(([label, item]) => ({
			label,
			value: item,
			children: item.type === "map" || item.type === "array" ? item : null,
		}));
	});
}
