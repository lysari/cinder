import { type DocumentReference, FieldPath, FieldValue, type Firestore } from "@google-cloud/firestore";
import { types } from "node:util";
import type {
	BrowseOperation,
	BrowseRequestMessage,
	BrowseResponseMessage,
	BrowseResponses,
	BrowseSessionStartMessage,
	CreateDocumentParams,
	DeleteDocumentParams,
	DocumentPage,
	ListCollectionsParams,
	ListDocumentsParams,
	UpdateDocumentParams,
} from "../shared/interfaces/browse.interface";
import type { FirestoreDocument, FirestoreValue } from "../shared/interfaces/firestore-value.interface";
import type { LiveQueryParams, LiveUpdate } from "../shared/interfaces/live.interface";
import type { RunQueryParams } from "../shared/interfaces/query.interface";
import { isObject } from "../shared/utils/type-guards";
import { createFirestore } from "./firestore-client";
import { buildQuery, countDocuments } from "./utils/firestore-query";
import { decodeFields, decodeValue } from "./utils/firestore-value-decoder";
import { encodeBigIntDocument } from "./utils/firestore-value-encoder";

const GRPC_NOT_FOUND = 5;
const GRPC_ALREADY_EXISTS = 6;
const CLOSE_TIMEOUT_MS = 2_000;
const unsubscribers = new Map<string, () => void>();

export function startBrowseSession(): void {
	process.on("unhandledRejection", (reason) => console.error(`Browse session error: ${describeError(reason)}`));
	process.once("message", (message) => {
		const db = createFirestore((message as BrowseSessionStartMessage).settings, { useBigInt: true });
		process.on("message", (request) => void answer(db, request as BrowseRequestMessage));
		process.once("SIGTERM", () => close(db));
	});
}

function close(db: Firestore): void {
	setTimeout(() => process.exit(1), CLOSE_TIMEOUT_MS);
	for (const unsubscribe of unsubscribers.values()) {
		unsubscribe();
	}
	unsubscribers.clear();
	void db.terminate().then(() => process.exit(0));
}

async function answer(db: Firestore, { requestId, operation }: BrowseRequestMessage): Promise<void> {
	let response: BrowseResponseMessage;
	try {
		response = { requestId, result: await runOperation(db, operation), error: null };
	} catch (error) {
		response = { requestId, result: null, error: describeError(error) };
	}
	process.send?.(response);
}

function runOperation(db: Firestore, operation: BrowseOperation): Promise<BrowseResponses[BrowseOperation["type"]]> {
	switch (operation.type) {
		case "listCollections":
			return listCollections(db, operation.params);
		case "listDocuments":
			return listDocuments(db, operation.params);
		case "getDocument":
			return getDocument(db.doc(operation.params.documentPath));
		case "createDocument":
			return createDocument(db, operation.params);
		case "updateDocument":
			return updateDocument(db, operation.params);
		case "setDocument":
			return setDocument(db, db.doc(operation.params.documentPath), operation.params.fields);
		case "deleteDocument":
			return deleteDocument(db, operation.params);
		case "runQuery":
			return runQuery(db, operation.params);
		case "countQuery":
			return countDocuments(buildQuery(db, operation.params.query), operation.params.query.limit);
		case "listen":
			return listen(db, operation.params);
		case "unlisten":
			unsubscribers.get(operation.params.listenerId)?.();
			unsubscribers.delete(operation.params.listenerId);
			return Promise.resolve(null);
	}
}

async function listCollections(db: Firestore, { documentPath }: ListCollectionsParams): Promise<string[]> {
	const collections = documentPath === null ? await db.listCollections() : await db.doc(documentPath).listCollections();
	return collections.map((collection) => collection.id).sort();
}

async function listDocuments(
	db: Firestore,
	{ collectionPath, pageSize, startAfterId }: ListDocumentsParams,
): Promise<DocumentPage> {
	let query = db.collection(collectionPath).orderBy(FieldPath.documentId()).limit(pageSize + 1);
	if (startAfterId !== null) {
		query = query.startAfter(startAfterId);
	}
	const snapshot = await query.get();
	return {
		documents: snapshot.docs.slice(0, pageSize).map((document) => encodeBigIntDocument(document)),
		hasMore: snapshot.size > pageSize,
	};
}

async function getDocument(reference: DocumentReference): Promise<FirestoreDocument | null> {
	const snapshot = await reference.get();
	return snapshot.exists ? encodeBigIntDocument(snapshot) : null;
}

async function createDocument(
	db: Firestore,
	{ collectionPath, documentId, fields }: CreateDocumentParams,
): Promise<FirestoreDocument> {
	const collection = db.collection(collectionPath);
	const reference = documentId === null ? collection.doc() : collection.doc(documentId);
	await reference.create(decodeFields(fields, db));
	return readWrittenDocument(reference);
}

async function updateDocument(
	db: Firestore,
	{ documentPath, changedFields, deletedFieldNames }: UpdateDocumentParams,
): Promise<FirestoreDocument> {
	const reference = db.doc(documentPath);
	const [firstField, firstValue, ...moreFieldsAndValues] = [
		...Object.entries(changedFields).flatMap(([name, value]) => [new FieldPath(name), decodeValue(value, db)]),
		...deletedFieldNames.flatMap((name) => [new FieldPath(name), FieldValue.delete()]),
	];
	await reference.update(firstField as FieldPath, firstValue, ...moreFieldsAndValues);
	return readWrittenDocument(reference);
}

async function setDocument(
	db: Firestore,
	reference: DocumentReference,
	fields: Record<string, FirestoreValue>,
): Promise<FirestoreDocument> {
	await reference.set(decodeFields(fields, db));
	return readWrittenDocument(reference);
}

async function deleteDocument(db: Firestore, { documentPath, isRecursive }: DeleteDocumentParams): Promise<null> {
	const reference = db.doc(documentPath);
	if (isRecursive) {
		await db.recursiveDelete(reference);
	} else {
		await reference.delete();
	}
	return null;
}

async function runQuery(db: Firestore, { query, pageSize, startAfter }: RunQueryParams): Promise<DocumentPage> {
	const remainingCount = query.limit === null ? Number.POSITIVE_INFINITY : query.limit - (startAfter?.documentCount ?? 0);
	if (remainingCount <= 0) {
		return { documents: [], hasMore: false };
	}
	let sdkQuery = buildQuery(db, query).limit(Math.min(pageSize + 1, remainingCount));
	if (startAfter !== null) {
		const lastDocument = await db.doc(startAfter.documentPath).get();
		if (!lastDocument.exists) {
			throw new Error("The last loaded document was deleted. Run the query again.");
		}
		sdkQuery = sdkQuery.startAfter(lastDocument);
	}
	const snapshot = await sdkQuery.get();
	return {
		documents: snapshot.docs.slice(0, pageSize).map((document) => encodeBigIntDocument(document)),
		hasMore: snapshot.size > pageSize,
	};
}

async function listen(db: Firestore, { listenerId, query, limit }: LiveQueryParams): Promise<null> {
	if (unsubscribers.has(listenerId)) {
		throw new Error("This live view is already running.");
	}
	let isFirst = true;
	const unsubscribe = buildQuery(db, query)
		.limit(limit)
		.onSnapshot(
			(snapshot) => {
				const changes = snapshot.docChanges().map((change) => ({
					type: change.type,
					document: encodeBigIntDocument(change.doc),
					oldIndex: change.oldIndex,
					newIndex: change.newIndex,
				}));
				if (isFirst || changes.length > 0) {
					process.send?.({ listenerId, kind: "changes", isFirst, changes } satisfies LiveUpdate);
					isFirst = false;
				}
			},
			(error) => {
				unsubscribers.delete(listenerId);
				process.send?.({ listenerId, kind: "stopped", reason: describeError(error) } satisfies LiveUpdate);
			},
		);
	unsubscribers.set(listenerId, unsubscribe);
	return null;
}

async function readWrittenDocument(reference: DocumentReference): Promise<FirestoreDocument> {
	const document = await getDocument(reference);
	if (!document) {
		throw new Error("The document was deleted right after it was written.");
	}
	return document;
}

function describeError(error: unknown): string {
	if (isObject(error) && error.code === GRPC_ALREADY_EXISTS) {
		return "A document with this id already exists.";
	}
	if (isObject(error) && error.code === GRPC_NOT_FOUND) {
		return "The document does not exist.";
	}
	return types.isNativeError(error) ? error.message : String(error);
}
