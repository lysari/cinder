import { Component, input } from "@angular/core";
import { ReactiveFormsModule } from "@angular/forms";
import type { QueryValueControls } from "../interfaces/query-builder-controls.interface";

const BOOLEAN_TEXTS = ["true", "false"];

@Component({
	selector: "app-query-value-input",
	imports: [ReactiveFormsModule],
	templateUrl: "./query-value-input.component.html",
	styleUrl: "./query-value-input.component.scss",
})
export class QueryValueInputComponent {
	readonly group = input.required<QueryValueControls>();
	readonly label = input.required<string>();

	protected fitTextToType(event: Event): void {
		const type = (event.target as HTMLSelectElement).value;
		const { text } = this.group().controls;
		if (type === "boolean" && !BOOLEAN_TEXTS.includes(text.value)) {
			text.setValue("true");
		} else if (type === "null") {
			text.setValue("");
		}
	}
}
