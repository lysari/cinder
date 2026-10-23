import { Component, computed, inject } from "@angular/core";
import { RouterLink } from "@angular/router";
import { LucideAngularModule } from "lucide-angular";
import { AccountsStore } from "../../../../core/stores/accounts.store";
import { TasksStore } from "../../../../core/stores/tasks.store";
import { taskProgressRatio } from "../../../../core/utils/task-progress";

@Component({
	selector: "app-statusbar",
	imports: [RouterLink, LucideAngularModule],
	templateUrl: "./statusbar.component.html",
	styleUrl: "./statusbar.component.scss",
})
export class StatusbarComponent {
	protected readonly accountsStore = inject(AccountsStore);
	protected readonly tasksStore = inject(TasksStore);
	protected readonly firstActiveTask = computed(() => this.tasksStore.activeTasks()[0] ?? null);
	protected readonly firstTaskRatio = computed(() => {
		const task = this.firstActiveTask();
		return task ? taskProgressRatio(task) : null;
	});
}
