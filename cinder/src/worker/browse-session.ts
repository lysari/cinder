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
import { isObject } from "../shared/utils/type-guards";
import { createFirestore } from "./firestore-client";
import { decodeFields, decodeValue } from "./utils/firestore-value-decoder";
import { encodeBigIntDocument } from "./utils/firestore-value-encoder";

const GRPC_NOT_FOUND = 5;
const GRPC_ALREADY_EXISTS = 6;

export function startBrowseSession(): void {
	process.on("unhandledRejection", (reason) => console.error(`Browse session error: ${describeError(reason)}`));
	process.once("message", (message) => {
		const db = createFirestore((message as BrowseSessionStartMessage).settings, { useBigInt: true });
		process.on("message", (request) => void answer(db, request as BrowseRequestMessage));
	});
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
