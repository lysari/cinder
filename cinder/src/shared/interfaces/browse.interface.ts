import type { DatabaseSettings, DatabaseTarget } from "./account.interface";
import type { FirestoreDocument, FirestoreValue } from "./firestore-value.interface";

export interface ListCollectionsParams {
	database: DatabaseTarget;
	documentPath: string | null;
}

export interface ListDocumentsParams {
	database: DatabaseTarget;
	collectionPath: string;
	pageSize: number;
	startAfterId: string | null;
}

export interface DocumentParams {
	database: DatabaseTarget;
	documentPath: string;
}

export interface CreateDocumentParams {
	database: DatabaseTarget;
	collectionPath: string;
	documentId: string | null;
	fields: Record<string, FirestoreValue>;
}

export interface UpdateDocumentParams {
	database: DatabaseTarget;
	documentPath: string;
	changedFields: Record<string, FirestoreValue>;
	deletedFieldNames: string[];
}

export interface SetDocumentParams {
	database: DatabaseTarget;
	documentPath: string;
	fields: Record<string, FirestoreValue>;
}

export interface DeleteDocumentParams {
	database: DatabaseTarget;
	documentPath: string;
	isRecursive: boolean;
}

export interface DocumentPage {
	documents: FirestoreDocument[];
	hasMore: boolean;
}

export type BrowseOperation =
	| { type: "listCollections"; params: ListCollectionsParams }
	| { type: "listDocuments"; params: ListDocumentsParams }
	| { type: "getDocument"; params: DocumentParams }
	| { type: "createDocument"; params: CreateDocumentParams }
	| { type: "updateDocument"; params: UpdateDocumentParams }
	| { type: "setDocument"; params: SetDocumentParams }
	| { type: "deleteDocument"; params: DeleteDocumentParams };

export interface BrowseResponses {
	listCollections: string[];
	listDocuments: DocumentPage;
	getDocument: FirestoreDocument | null;
	createDocument: FirestoreDocument;
	updateDocument: FirestoreDocument;
	setDocument: FirestoreDocument;
	deleteDocument: null;
}

export type BrowseResponse<T extends BrowseOperation> = BrowseResponses[T["type"]];

export interface BrowseSessionStartMessage {
	settings: DatabaseSettings;
}

export interface BrowseRequestMessage {
	requestId: number;
	operation: BrowseOperation;
}

export type BrowseResponseMessage =
	| { requestId: number; result: BrowseResponses[BrowseOperation["type"]]; error: null }
	| { requestId: number; result: null; error: string };
