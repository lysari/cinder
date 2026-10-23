import type { DocumentReference, DocumentSnapshot, Firestore } from "@google-cloud/firestore";
import { types } from "node:util";
import type { CopyTaskRequest } from "../../shared/interfaces/copy.interface";
import type { FirestoreValue } from "../../shared/interfaces/firestore-value.interface";
import type { TaskContext, WriteTaskResult } from "../../shared/interfaces/task.interface";
import { readCollection, readSubcollections } from "../utils/collection-reader";
import { DocumentWriter } from "../utils/document-writer";
import { countDocuments } from "../utils/firestore-query";
import { decodeFields } from "../utils/firestore-value-decoder";
import { encodeBigIntDocument } from "../utils/firestore-value-encoder";

export async function copyDocuments(
	sourceDb: Firestore,
	destinationDb: Firestore,
	request: CopyTaskRequest,
	context: TaskContext,
): Promise<WriteTaskResult> {
	const { progress } = context;
	const sourceRoot = request.source.type === "collection" ? request.source.collectionPath : request.source.documentPath;
	const destinationRoot = request.destination.path;
	const destinationPathOf = (path: string) => `${destinationRoot}${path.slice(sourceRoot.length)}`;
	const rewrittenPathOf = (path: string) => (isCopiedPath(request, sourceRoot, path) ? destinationPathOf(path) : path);
	void countSourceDocuments(sourceDb, request).then(
		(count) => {
			progress.totalDocuments = count;
		},
		(error: unknown) => context.log("info", `The number of documents is not known: ${describeError(error)}`),
	);
	const writer = new DocumentWriter(context);
	try {
		for await (const page of readSourcePages(sourceDb, request)) {
			const copiedSources: DocumentReference[] = [];
			for (const snapshot of page) {
				const { fields } = encodeBigIntDocument(snapshot);
				const copiedFields = request.isRewritingReferences ? rewriteReferences(fields, rewrittenPathOf) : fields;
				await writer.write({
					reference: destinationDb.doc(destinationPathOf(snapshot.ref.path)),
					data: decodeFields(copiedFields, destinationDb),
					writeMode: request.writeMode,
					rowNumber: null,
					onWritten: request.isMove ? () => copiedSources.push(snapshot.ref) : null,
				});
			}
			progress.reads += page.length;
			if (request.isMove) {
				await writer.flush();
				for (const reference of copiedSources) {
					await writer.delete(reference);
				}
			}
		}
	} catch (error) {
		await writer.close();
		throw new Error(`${describeError(error)} ${progress.writes} documents were copied and ${progress.deletes} sources deleted before this error.`);
	}
	return writer.close();
}

async function* readSourcePages(db: Firestore, { source, isRecursive }: CopyTaskRequest): AsyncGenerator<DocumentSnapshot[]> {
	if (source.type === "collection") {
		yield* readCollection(db.collection(source.collectionPath), isRecursive);
		return;
	}
	const reference = db.doc(source.documentPath);
	const snapshot = await reference.get();
	if (snapshot.exists) {
		yield [snapshot];
	}
	if (isRecursive) {
		yield* readSubcollections([reference]);
	}
}

async function countSourceDocuments(db: Firestore, { source, isRecursive }: CopyTaskRequest): Promise<number | null> {
	if (isRecursive) {
		return null;
	}
	return source.type === "collection" ? countDocuments(db.collection(source.collectionPath), null) : 1;
}

function isCopiedPath({ source, isRecursive }: CopyTaskRequest, sourceRoot: string, documentPath: string): boolean {
	if (source.type === "document" && documentPath === sourceRoot) {
		return true;
	}
	if (!documentPath.startsWith(`${sourceRoot}/`)) {
		return false;
	}
	return isRecursive || (source.type === "collection" && !documentPath.slice(sourceRoot.length + 1).includes("/"));
}

function rewriteReferences(fields: Record<string, FirestoreValue>, rewrittenPathOf: (path: string) => string): Record<string, FirestoreValue> {
	const rewrite = (value: FirestoreValue): FirestoreValue => {
		switch (value.type) {
			case "reference":
				return { type: "reference", value: rewrittenPathOf(value.value) };
			case "array":
				return { type: "array", value: value.value.map(rewrite) };
			case "map":
				return { type: "map", value: rewriteReferences(value.value, rewrittenPathOf) };
			default:
				return value;
		}
	};
	return Object.fromEntries(Object.entries(fields).map(([name, value]) => [name, rewrite(value)]));
}

function describeError(error: unknown): string {
	return types.isNativeError(error) ? error.message : String(error);
}
