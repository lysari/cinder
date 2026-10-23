import type { Routes } from "@angular/router";
import { ExplorerApiService } from "./services/explorer-api.service";

export const explorerRoutes: Routes = [
	{
		path: "",
		loadComponent: () => import("./pages/explorer-start.page").then((m) => m.ExplorerStartPage),
	},
	{
		path: "explorer/:accountId/:projectId/:databaseId",
		providers: [ExplorerApiService],
		children: [
			{
				path: "",
				loadComponent: () => import("./pages/explorer-database.page").then((m) => m.ExplorerDatabasePage),
			},
			{
				path: "c/:collectionPath",
				loadComponent: () => import("./pages/explorer-collection.page").then((m) => m.ExplorerCollectionPage),
			},
			{
				path: "c/:collectionPath/new",
				loadComponent: () => import("./pages/explorer-add-document.page").then((m) => m.ExplorerAddDocumentPage),
			},
			{
				path: "d/:documentPath",
				loadComponent: () => import("./pages/explorer-document.page").then((m) => m.ExplorerDocumentPage),
			},
		],
	},
];
