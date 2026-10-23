import type { Routes } from "@angular/router";
import { QueryApiService } from "./services/query-api.service";
import { QueryStore } from "./stores/query.store";

export const queryRoutes: Routes = [
	{
		path: ":accountId/:projectId/:databaseId",
		providers: [QueryApiService, QueryStore],
		children: [
			{
				path: "",
				loadComponent: () => import("./pages/query.page").then((m) => m.QueryPage),
			},
			{
				path: "c/:collectionPath",
				loadComponent: () => import("./pages/query.page").then((m) => m.QueryPage),
			},
		],
	},
];
