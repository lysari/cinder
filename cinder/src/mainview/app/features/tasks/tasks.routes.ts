import type { Routes } from "@angular/router";

export const tasksRoutes: Routes = [
	{
		path: "",
		loadComponent: () => import("./pages/tasks.page").then((m) => m.TasksPage),
	},
];
