import type { Routes } from "@angular/router";

export const connectionsRoutes: Routes = [
	{
		path: "new",
		loadComponent: () => import("./pages/add-account.page").then((m) => m.AddAccountPage),
	},
];
