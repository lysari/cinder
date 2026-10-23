import { Component, input } from "@angular/core";
import { LucideAngularModule } from "lucide-angular";

@Component({
	selector: "app-empty-state",
	imports: [LucideAngularModule],
	templateUrl: "./empty-state.component.html",
	styleUrl: "./empty-state.component.scss",
})
export class EmptyStateComponent {
	readonly icon = input.required<string>();
	readonly heading = input.required<string>();
	readonly text = input.required<string>();
}
