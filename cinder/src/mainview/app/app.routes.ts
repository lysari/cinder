import type { Routes } from "@angular/router";
import { MainLayoutComponent } from "./shared/layout/main-layout/main-layout.component";

export const routes: Routes = [
	{
		path: "",
		component: MainLayoutComponent,
		children: [
			{
				path: "accounts",
				loadChildren: () => import("./features/connections/connections.routes").then((m) => m.connectionsRoutes),
			},
			{
				path: "query",
				loadChildren: () => import("./features/query/query.routes").then((m) => m.queryRoutes),
			},
			{
				path: "transfer",
				loadChildren: () => import("./features/transfer/transfer.routes").then((m) => m.transferRoutes),
			},
			{
				path: "bulk-edit",
				loadChildren: () => import("./features/bulk-edit/bulk-edit.routes").then((m) => m.bulkEditRoutes),
			},
			{
				path: "tasks",
				loadChildren: () => import("./features/tasks/tasks.routes").then((m) => m.tasksRoutes),
			},
			{
				path: "",
				loadChildren: () => import("./features/explorer/explorer.routes").then((m) => m.explorerRoutes),
			},
		],
	},
	{
		path: "**",
		redirectTo: "",
	},
];
