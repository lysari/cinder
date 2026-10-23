import type { DocumentView } from "../constants/document-view";
import type { QueryMode } from "../constants/query";
import type { DatabaseTarget } from "./account.interface";
import type { QueryForm } from "./query.interface";

export interface WindowFrame {
	x: number;
	y: number;
	width: number;
	height: number;
}

export interface Tab {
	id: string;
	url: string;
}

export interface SavedQueryPage {
	tabId: string;
	database: DatabaseTarget;
	collectionPath: string | null;
	mode: QueryMode;
	form: QueryForm;
	script: string;
}

export interface ViewState {
	tabs: Tab[];
	activeTabId: string;
	sidebarExpandedIds: string[];
	documentView: DocumentView;
	queryPages: SavedQueryPage[];
}
