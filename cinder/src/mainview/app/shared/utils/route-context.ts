import { DefaultUrlSerializer, PRIMARY_OUTLET } from "@angular/router";
import type { DatabaseTarget } from "../../../../shared/interfaces/account.interface";

export interface RouteContext {
	title: string;
	database: DatabaseTarget | null;
	collectionPath: string | null;
}

interface DatabaseRoute {
	database: DatabaseTarget;
	sourceKind: string | undefined;
	sourceValue: string | undefined;
	extra: string | undefined;
}

const urlSerializer = new DefaultUrlSerializer();

/** Reads what a router URL shows: a short title for its tab and, when it names one, the database and collection. Pass `Router.url` or a tab's URL. */
export function routeContextOf(url: string): RouteContext {
	const segments = urlSerializer.parse(url).root.children[PRIMARY_OUTLET]?.segments.map((segment) => segment.path) ?? [];
	const [area, page, ...rest] = segments;
	switch (area) {
		case undefined:
			return withoutDatabase("Start");
		case "accounts":
			return withoutDatabase("Add account");
		case "tasks":
			return withoutDatabase("Tasks");
		case "explorer":
			return explorerContext(databaseRouteOf([page, ...rest]));
		case "query":
			return queryContext(databaseRouteOf([page, ...rest]));
		case "transfer":
			return transferContext(page, databaseRouteOf(rest));
		case "bulk-edit":
			return bulkEditContext(page, databaseRouteOf(rest));
		default:
			return withoutDatabase(url);
	}
}

function explorerContext(route: DatabaseRoute | null): RouteContext {
	if (!route) {
		return withoutDatabase("Explorer");
	}
	const { database, sourceKind, sourceValue, extra } = route;
	if (sourceKind === "c" && sourceValue !== undefined) {
		const title = extra === "new" ? `New document in ${sourceValue}` : sourceValue;
		return { title, database, collectionPath: sourceValue };
	}
	if (sourceKind === "d" && sourceValue !== undefined) {
		return { title: sourceValue, database, collectionPath: null };
	}
	return { title: `${database.projectId} / ${database.databaseId}`, database, collectionPath: null };
}

function queryContext(route: DatabaseRoute | null): RouteContext {
	if (!route) {
		return withoutDatabase("Query");
	}
	const collectionPath = route.sourceKind === "c" ? (route.sourceValue ?? null) : null;
	const subject = collectionPath ?? `${route.database.projectId} / ${route.database.databaseId}`;
	return { title: `Query ${subject}`, database: route.database, collectionPath };
}

function transferContext(page: string | undefined, route: DatabaseRoute | null): RouteContext {
	if (!route) {
		return withoutDatabase("Transfer");
	}
	const collectionPath = route.sourceKind === "c" ? (route.sourceValue ?? null) : null;
	const subject = sourceLabel(route);
	switch (page) {
		case "export":
			return { title: `Export ${subject}`, database: route.database, collectionPath };
		case "import":
			return { title: `Import into ${collectionPath ?? route.database.databaseId}`, database: route.database, collectionPath };
		default:
			return { title: `${capitalize(route.extra ?? "copy")} ${subject}`, database: route.database, collectionPath };
	}
}

function bulkEditContext(page: string | undefined, route: DatabaseRoute | null): RouteContext {
	if (!route) {
		return withoutDatabase("Bulk edit");
	}
	const collectionPath = route.sourceKind === "c" ? (route.sourceValue ?? null) : null;
	const action = page === "delete" ? "Delete" : "Bulk update";
	return { title: `${action} ${sourceLabel(route)}`, database: route.database, collectionPath };
}

function databaseRouteOf([accountId, projectId, databaseId, sourceKind, sourceValue, extra]: (string | undefined)[]): DatabaseRoute | null {
	if (accountId === undefined || projectId === undefined || databaseId === undefined) {
		return null;
	}
	return { database: { accountId, projectId, databaseId }, sourceKind, sourceValue, extra };
}

function sourceLabel({ sourceKind, sourceValue }: DatabaseRoute): string {
	return sourceKind === "q" ? "query matches" : (sourceValue ?? "");
}

function withoutDatabase(title: string): RouteContext {
	return { title, database: null, collectionPath: null };
}

function capitalize(text: string): string {
	return text.charAt(0).toUpperCase() + text.slice(1);
}
