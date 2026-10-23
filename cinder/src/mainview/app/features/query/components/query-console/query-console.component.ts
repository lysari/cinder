import { DatePipe } from "@angular/common";
import { Component, input } from "@angular/core";
import { LucideAngularModule } from "lucide-angular";
import type { TaskLogEntry } from "../../../../../../shared/interfaces/task.interface";

@Component({
	selector: "app-query-console",
	imports: [DatePipe, LucideAngularModule],
	templateUrl: "./query-console.component.html",
	styleUrl: "./query-console.component.scss",
})
export class QueryConsoleComponent {
	readonly entries = input.required<TaskLogEntry[]>();
}
