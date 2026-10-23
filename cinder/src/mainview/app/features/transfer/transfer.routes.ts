import type { Routes } from "@angular/router";
import { TransferApiService } from "./services/transfer-api.service";

export const transferRoutes: Routes = [
	{
		path: "",
		providers: [TransferApiService],
		children: [
			{
				path: "export/:accountId/:projectId/:databaseId/c/:collectionPath",
				loadComponent: () => import("./pages/export.page").then((m) => m.ExportPage),
			},
			{
				path: "export/:accountId/:projectId/:databaseId/d/:documentPath",
				loadComponent: () => import("./pages/export.page").then((m) => m.ExportPage),
			},
			{
				path: "export/:accountId/:projectId/:databaseId/q/:query",
				loadComponent: () => import("./pages/export.page").then((m) => m.ExportPage),
			},
			{
				path: "copy/:accountId/:projectId/:databaseId/c/:collectionPath/:operation",
				loadComponent: () => import("./pages/copy.page").then((m) => m.CopyPage),
			},
			{
				path: "copy/:accountId/:projectId/:databaseId/d/:documentPath/:operation",
				loadComponent: () => import("./pages/copy.page").then((m) => m.CopyPage),
			},
			{
				path: "import/:accountId/:projectId/:databaseId",
				loadComponent: () => import("./pages/import.page").then((m) => m.ImportPage),
			},
			{
				path: "import/:accountId/:projectId/:databaseId/c/:collectionPath",
				loadComponent: () => import("./pages/import.page").then((m) => m.ImportPage),
			},
		],
	},
];
