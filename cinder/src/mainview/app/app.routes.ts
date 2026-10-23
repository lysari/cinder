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
