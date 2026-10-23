import { Component, computed, input } from "@angular/core";
import { RouterLink } from "@angular/router";
import { LucideAngularModule } from "lucide-angular";
import type { DatabaseTarget } from "../../../../../shared/interfaces/account.interface";
import { collectionRoute, databaseRoute, documentRoute } from "../../../shared/utils/explorer-route";

interface Crumb {
	id: string;
	path: string;
	route: string[];
}

@Component({
	selector: "app-explorer-breadcrumb",
	imports: [RouterLink, LucideAngularModule],
	templateUrl: "./explorer-breadcrumb.component.html",
	styleUrl: "./explorer-breadcrumb.component.scss",
})
export class ExplorerBreadcrumbComponent {
	readonly database = input.required<DatabaseTarget>();
	readonly accountLabel = input.required<string>();
	readonly path = input<string | null>(null);
	readonly currentLabel = input<string | null>(null);
	protected readonly databaseLink = computed(() => databaseRoute(this.database()));
	protected readonly crumbs = computed<Crumb[]>(() => {
		const path = this.path();
		if (path === null) {
			return [];
		}
		const ids = path.split("/");
		return ids.map((id, index) => {
			const crumbPath = ids.slice(0, index + 1).join("/");
			const isCollection = index % 2 === 0;
			const route = isCollection ? collectionRoute(this.database(), crumbPath) : documentRoute(this.database(), crumbPath);
			return { id, path: crumbPath, route };
		});
	});
	protected readonly isDatabaseCurrent = computed(() => this.path() === null && this.currentLabel() === null);
}
