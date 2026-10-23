import { DOCUMENT_VIEWS } from "../shared/constants/document-view";
import { QUERY_DIRECTIONS, QUERY_MODES, QUERY_OPERATORS, QUERY_TARGET_TYPES, QUERY_VALUE_TYPES } from "../shared/constants/query";
import {
	MAX_QUERY_FORM_ROWS,
	MAX_QUERY_FORM_TEXT_LENGTH,
	MAX_QUERY_PAGES,
	MAX_SCRIPT_LENGTH,
	MAX_SIDEBAR_EXPANDED_IDS,
	MAX_SIDEBAR_ID_LENGTH,
	MAX_TAB_URL_LENGTH,
	MAX_TABS,
	TAB_ID_PATTERN,
} from "../shared/constants/view-state";
import type { SavedQueryPage, Tab, ViewState, WindowFrame } from "../shared/interfaces/app-state.interface";
import type { QueryFilterForm, QueryForm, QueryOrderForm, QueryValueForm } from "../shared/interfaces/query.interface";
import { isCollectionPath } from "../shared/utils/firestore-validation";
import { isObject } from "../shared/utils/type-guards";
import { parseDatabaseTarget } from "./account-request-parser";

const VIEW_URL_PREFIX = "views://mainview/index.html#";
const MIN_WINDOW_WIDTH = 480;
const MIN_WINDOW_HEIGHT = 320;
const MAX_WINDOW_COORDINATE = 100_000;

export function parseWindowFrame(value: unknown): WindowFrame {
	if (!isObject(value)) {
		throw new Error("The window frame must be an object.");
	}
	const { x, y, width, height } = value;
	if (
		!isCoordinate(x, -MAX_WINDOW_COORDINATE) ||
		!isCoordinate(y, -MAX_WINDOW_COORDINATE) ||
		!isCoordinate(width, MIN_WINDOW_WIDTH) ||
		!isCoordinate(height, MIN_WINDOW_HEIGHT)
	) {
		throw new Error(`The window frame needs whole numbers, at least ${MIN_WINDOW_WIDTH} by ${MIN_WINDOW_HEIGHT}.`);
	}
	return { x, y, width, height };
}

export function parseViewState(value: unknown): ViewState {
	if (!isObject(value) || !Array.isArray(value.tabs) || value.tabs.length === 0 || value.tabs.length > MAX_TABS) {
		throw new Error(`The view state needs 1 to ${MAX_TABS} tabs.`);
	}
	const tabs = value.tabs.map(parseTab);
	const tabIds = new Set(tabs.map((tab) => tab.id));
	if (tabIds.size !== tabs.length) {
		throw new Error("Two tabs have the same id.");
	}
	if (typeof value.activeTabId !== "string" || !tabIds.has(value.activeTabId)) {
		throw new Error("The active tab is not one of the tabs.");
	}
	const documentView = DOCUMENT_VIEWS.find((candidate) => candidate === value.documentView);
	if (!documentView) {
		throw new Error(`The document view must be one of ${DOCUMENT_VIEWS.join(", ")}.`);
	}
	return {
		tabs,
		activeTabId: value.activeTabId,
		sidebarExpandedIds: parseList(value.sidebarExpandedIds, MAX_SIDEBAR_EXPANDED_IDS, "sidebar rows", (id) =>
			parseText(id, MAX_SIDEBAR_ID_LENGTH, "A sidebar row id"),
		),
		documentView,
		queryPages: parseList(value.queryPages, MAX_QUERY_PAGES, "query pages", (page) => parseQueryPage(page, tabIds)),
	};
}

export function tabUrlOfLink(detail: unknown): string | null {
	if (!isObject(detail) || detail.isSPANavigation === true || typeof detail.url !== "string") {
		return null;
	}
	const { url } = detail;
	if (!url.startsWith(VIEW_URL_PREFIX)) {
		return null;
	}
	const tabUrl = url.slice(VIEW_URL_PREFIX.length);
	return tabUrl.startsWith("/") && tabUrl.length <= MAX_TAB_URL_LENGTH ? tabUrl : null;
}

function parseTab(value: unknown): Tab {
	if (!isObject(value) || typeof value.id !== "string" || !TAB_ID_PATTERN.test(value.id)) {
		throw new Error("A tab needs an id of 1 to 64 letters, digits or dashes.");
	}
	const url = parseText(value.url, MAX_TAB_URL_LENGTH, "A tab URL");
	if (!url.startsWith("/")) {
		throw new Error("A tab URL must start with /.");
	}
	return { id: value.id, url };
}

function parseQueryPage(value: unknown, tabIds: ReadonlySet<string>): SavedQueryPage {
	if (!isObject(value) || typeof value.tabId !== "string" || !tabIds.has(value.tabId)) {
		throw new Error("A query page must belong to one of the tabs.");
	}
	const { collectionPath } = value;
	if (collectionPath !== null && (typeof collectionPath !== "string" || !isCollectionPath(collectionPath))) {
		throw new Error("A query page's collection must be null or a collection path.");
	}
	const mode = QUERY_MODES.find((candidate) => candidate === value.mode);
	if (!mode) {
		throw new Error(`A query page's mode must be one of ${QUERY_MODES.join(", ")}.`);
	}
	return {
		tabId: value.tabId,
		database: parseDatabaseTarget(value.database),
		collectionPath,
		mode,
		form: parseQueryForm(value.form),
		script: parseText(value.script, MAX_SCRIPT_LENGTH, "A query script"),
	};
}

function parseQueryForm(value: unknown): QueryForm {
	const targetType = isObject(value) ? QUERY_TARGET_TYPES.find((candidate) => candidate === value.targetType) : undefined;
	if (!isObject(value) || !targetType) {
		throw new Error(`A query form's target must be one of ${QUERY_TARGET_TYPES.join(", ")}.`);
	}
	return {
		targetType,
		targetPath: parseFormText(value.targetPath),
		filters: parseList(value.filters, MAX_QUERY_FORM_ROWS, "filters", parseFilterForm),
		orders: parseList(value.orders, MAX_QUERY_FORM_ROWS, "orders", parseOrderForm),
		limitText: parseFormText(value.limitText),
	};
}

function parseFilterForm(value: unknown): QueryFilterForm {
	const operator = isObject(value) ? QUERY_OPERATORS.find((candidate) => candidate === value.operator) : undefined;
	if (!isObject(value) || !operator) {
		throw new Error("A filter row needs a known operator.");
	}
	return {
		fieldPath: parseFormText(value.fieldPath),
		operator,
		value: parseValueForm(value.value),
		items: parseList(value.items, MAX_QUERY_FORM_ROWS, "list values", parseValueForm),
	};
}

function parseValueForm(value: unknown): QueryValueForm {
	const type = isObject(value) ? QUERY_VALUE_TYPES.find((candidate) => candidate === value.type) : undefined;
	if (!isObject(value) || !type) {
		throw new Error("A filter value needs a known type.");
	}
	return { type, text: parseFormText(value.text) };
}

function parseOrderForm(value: unknown): QueryOrderForm {
	const direction = isObject(value) ? QUERY_DIRECTIONS.find((candidate) => candidate === value.direction) : undefined;
	if (!isObject(value) || !direction) {
		throw new Error("An order row needs the direction asc or desc.");
	}
	return { fieldPath: parseFormText(value.fieldPath), direction };
}

function parseList<T>(value: unknown, maxLength: number, label: string, parseItem: (item: unknown) => T): T[] {
	if (!Array.isArray(value) || value.length > maxLength) {
		throw new Error(`The ${label} must be a list of at most ${maxLength}.`);
	}
	return value.map(parseItem);
}

function parseFormText(value: unknown): string {
	return parseText(value, MAX_QUERY_FORM_TEXT_LENGTH, "A query form text");
}

function parseText(value: unknown, maxLength: number, label: string): string {
	if (typeof value !== "string" || value.length > maxLength) {
		throw new Error(`${label} must be text of at most ${maxLength} characters.`);
	}
	return value;
}

function isCoordinate(value: unknown, min: number): value is number {
	return typeof value === "number" && Number.isInteger(value) && value >= min && value <= MAX_WINDOW_COORDINATE;
}
