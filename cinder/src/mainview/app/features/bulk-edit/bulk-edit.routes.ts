import type { Routes } from "@angular/router";
import { BulkEditApiService } from "./services/bulk-edit-api.service";

export const bulkEditRoutes: Routes = [
	{
		path: "",
		providers: [BulkEditApiService],
		children: [
			{
				path: "update/:accountId/:projectId/:databaseId/c/:collectionPath",
				loadComponent: () => import("./pages/bulk-update/bulk-update.page").then((m) => m.BulkUpdatePage),
			},
			{
				path: "update/:accountId/:projectId/:databaseId/q/:query",
				loadComponent: () => import("./pages/bulk-update/bulk-update.page").then((m) => m.BulkUpdatePage),
			},
			{
				path: "delete/:accountId/:projectId/:databaseId/c/:collectionPath",
				loadComponent: () => import("./pages/delete-collection/delete-collection.page").then((m) => m.DeleteCollectionPage),
			},
			{
				path: "delete/:accountId/:projectId/:databaseId/q/:query",
				loadComponent: () => import("./pages/delete-collection/delete-collection.page").then((m) => m.DeleteCollectionPage),
			},
		],
	},
];
