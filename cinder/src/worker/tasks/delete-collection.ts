import type { Firestore } from "@google-cloud/firestore";
import { types } from "node:util";
import { READ_PAGE_SIZE } from "../../shared/constants/data-transfer";
import type { DeleteCollectionTaskRequest } from "../../shared/interfaces/delete-collection.interface";
import type { TaskContext, WriteTaskResult } from "../../shared/interfaces/task.interface";
import { DocumentWriter } from "../utils/document-writer";
import { buildQuery, countDocuments, readQueryPages } from "../utils/firestore-query";

export async function deleteCollection(db: Firestore, { source }: DeleteCollectionTaskRequest, context: TaskContext): Promise<WriteTaskResult> {
	const { progress } = context;
	const writer = new DocumentWriter(context);
	try {
		if (source.type === "collection") {
			await writer.deleteRecursively(db.collection(source.collectionPath));
		} else {
			const query = buildQuery(db, source.query);
			void countDocuments(query, source.query.limit).then(
				(count) => {
					progress.totalDocuments = count;
				},
				(error: unknown) => context.log("info", `The number of documents is not known: ${describeError(error)}`),
			);
			for await (const page of readQueryPages(query, source.query.limit, READ_PAGE_SIZE)) {
				progress.reads += page.length;
				for (const snapshot of page) {
					await writer.delete(snapshot.ref);
				}
			}
		}
	} catch (error) {
		await writer.close();
		throw new Error(`${describeError(error)} ${progress.deletes} documents were deleted before this error.`);
	}
	const result = await writer.close();
	context.log("info", `Deleted ${result.deleteCount} documents.`);
	return result;
}

function describeError(error: unknown): string {
	return types.isNativeError(error) ? error.message : String(error);
}
