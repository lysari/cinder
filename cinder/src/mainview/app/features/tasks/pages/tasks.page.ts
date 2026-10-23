import { Component, inject, input } from "@angular/core";
import { LucideAngularModule } from "lucide-angular";
import { TasksStore } from "../../../core/stores/tasks.store";
import { TaskItemComponent } from "../components/task-item.component";

@Component({
	selector: "app-tasks-page",
	imports: [LucideAngularModule, TaskItemComponent],
	templateUrl: "./tasks.page.html",
	styleUrl: "./tasks.page.scss",
})
export class TasksPage {
	protected readonly store = inject(TasksStore);
	readonly task = input<string>();
}
