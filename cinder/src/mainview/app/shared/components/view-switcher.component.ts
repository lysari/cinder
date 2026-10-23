import { Component, input, model } from "@angular/core";
import { LucideAngularModule } from "lucide-angular";
import type { DocumentView } from "../../../../shared/constants/document-view";

@Component({
	selector: "app-view-switcher",
	imports: [LucideAngularModule],
	templateUrl: "./view-switcher.component.html",
})
export class ViewSwitcherComponent {
	readonly view = model.required<DocumentView>();
	readonly hasTable = input(true);
}
