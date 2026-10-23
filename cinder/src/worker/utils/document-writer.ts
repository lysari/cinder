import type {
	BulkWriter,
	BulkWriterError,
	CollectionReference,
	DocumentData,
	DocumentReference,
	Firestore,
	QueryDocumentSnapshot,
	UpdateData,
} from "@google-cloud/firestore";
import { types } from "node:util";
import { MAX_STORED_FAILURES, type WriteMode } from "../../shared/constants/data-transfer";
import type { TaskContext, TaskFailure, WriteTaskResult } from "../../shared/interfaces/task.interface";
import { isObject } from "../../shared/utils/type-guards";

const MAX_PENDING_WRITES = 1000;
const MAX_WRITE_ATTEMPTS = 5;
const GRPC_DEADLINE_EXCEEDED = 4;
const GRPC_ALREADY_EXISTS = 6;
const GRPC_RESOURCE_EXHAUSTED = 8;
const GRPC_FAILED_PRECONDITION = 9;
const GRPC_ABORTED = 10;
const GRPC_INTERNAL = 13;
const GRPC_UNAVAILABLE = 14;
const RETRIED_CODES: readonly number[] = [GRPC_DEADLINE_EXCEEDED, GRPC_RESOURCE_EXHAUSTED, GRPC_ABORTED, GRPC_INTERNAL, GRPC_UNAVAILABLE];
const CHANGED_SINCE_READ_MESSAGE = "The document changed after it was read, so it was not updated. Run the update again.";

export interface DocumentWrite {
	reference: DocumentReference;
	data: DocumentData;
	writeMode: WriteMode;
	rowNumber: number | null;
	onWritten: (() => void) | null;
}

interface QueuedOperation {
	reference: DocumentReference;
	rowNumber: number | null;
	start: (bulkWriter: BulkWriter) => Promise<unknown>;
	onSuccess: () => void;
	onError: (error: unknown) => void;
}

/**
 * Writes, updates and deletes the documents of a task with one BulkWriter per database, retrying transient errors and recording each failure; the emulator is written unthrottled.
 * Create one per task, `await` each queued operation (it waits while too many are pending), then `close()` for the summary.
 */
export class DocumentWriter {
	private readonly bulkWriters = new Map<Firestore, BulkWriter>();
	private readonly pendingWrites = new Set<Promise<void>>();
	private readonly failures: TaskFailure[] = [];

	constructor(private readonly context: TaskContext) {}

	/** Queues one document write in its write mode. Pass the CSV row number (null otherwise) and an optional callback that runs once the write succeeded. */
	async write({ reference, data, writeMode, rowNumber, onWritten }: DocumentWrite): Promise<void> {
		await this.enqueue({
			reference,
			rowNumber,
			start: (bulkWriter) => startWrite(bulkWriter, reference, data, writeMode),
			onSuccess: () => {
				this.context.progress.writes += 1;
				onWritten?.();
			},
			onError: (error) => {
				if (writeMode === "skip" && errorCode(error) === GRPC_ALREADY_EXISTS) {
					this.context.progress.skips += 1;
				} else {
					this.fail({ documentPath: reference.path, rowNumber, message: describeError(error) });
				}
			},
		});
	}

	/** Queues an update of the given dotted field paths that only applies while the document is unchanged since `snapshot` was read. */
	async update(snapshot: QueryDocumentSnapshot, data: UpdateData<DocumentData>): Promise<void> {
		const reference = snapshot.ref;
		await this.enqueue({
			reference,
			rowNumber: null,
			start: (bulkWriter) => bulkWriter.update(reference, data, { lastUpdateTime: snapshot.updateTime }),
			onSuccess: () => {
				this.context.progress.writes += 1;
			},
			onError: (error) => {
				const message = errorCode(error) === GRPC_FAILED_PRECONDITION ? CHANGED_SINCE_READ_MESSAGE : describeError(error);
				this.fail({ documentPath: reference.path, rowNumber: null, message });
			},
		});
	}

	/** Queues the delete of one document; its subcollections stay. */
	async delete(reference: DocumentReference): Promise<void> {
		await this.enqueue({
			reference,
			rowNumber: null,
			start: (bulkWriter) => bulkWriter.delete(reference),
			onSuccess: () => {
				this.context.progress.deletes += 1;
			},
			onError: (error) => this.fail({ documentPath: reference.path, rowNumber: null, message: describeError(error) }),
		});
	}

	/** Deletes a collection with every document and subcollection below it, documents that only hold subcollections included, counting each delete. */
	async deleteRecursively(collection: CollectionReference): Promise<void> {
		const bulkWriter = this.createBulkWriter(collection.firestore, (error) =>
			this.fail({ documentPath: error.documentRef.path, rowNumber: null, message: error.message }),
		);
		bulkWriter.onWriteResult(() => {
			this.context.progress.deletes += 1;
		});
		const failureCount = this.context.progress.failures;
		try {
			await collection.firestore.recursiveDelete(collection, bulkWriter);
		} catch (error) {
			// recursiveDelete rejects with a summary when deletes failed; those are already recorded one by one.
			if (this.context.progress.failures === failureCount) {
				throw error;
			}
		} finally {
			await bulkWriter.close();
		}
	}

	/** Records a document or row that could not be written, e.g. a value that did not parse. The first 100 are kept and logged. */
	fail(failure: TaskFailure): void {
		this.context.progress.failures += 1;
		if (this.failures.length < MAX_STORED_FAILURES) {
			this.failures.push(failure);
			this.context.log("warn", describeFailure(failure));
		}
	}

	/** Waits until every queued operation has finished and its callback ran, e.g. before deleting the sources of copied documents. */
	async flush(): Promise<void> {
		await Promise.all([...this.bulkWriters.values()].map((bulkWriter) => bulkWriter.flush()));
		await Promise.all(this.pendingWrites);
	}

	/** Waits for every queued operation and returns the task summary. */
	async close(): Promise<WriteTaskResult> {
		await Promise.all([...this.bulkWriters.values()].map((bulkWriter) => bulkWriter.close()));
		await Promise.all(this.pendingWrites);
		const { writes, skips, deletes, failures } = this.context.progress;
		if (failures > this.failures.length) {
			this.context.log("warn", `${failures - this.failures.length} more failures are not listed.`);
		}
		return { kind: "writes", writeCount: writes, skipCount: skips, deleteCount: deletes, failureCount: failures, failures: this.failures };
	}

	private async enqueue({ reference, rowNumber, start, onSuccess, onError }: QueuedOperation): Promise<void> {
		while (this.pendingWrites.size >= MAX_PENDING_WRITES) {
			await Promise.race(this.pendingWrites);
		}
		let operation: Promise<unknown>;
		try {
			operation = start(this.bulkWriterOf(reference.firestore));
		} catch (error) {
			this.fail({ documentPath: reference.path, rowNumber, message: describeError(error) });
			return;
		}
		const pendingWrite: Promise<void> = operation.then(onSuccess, onError).finally(() => this.pendingWrites.delete(pendingWrite));
		this.pendingWrites.add(pendingWrite);
	}

	private bulkWriterOf(db: Firestore): BulkWriter {
		let bulkWriter = this.bulkWriters.get(db);
		if (!bulkWriter) {
			bulkWriter = this.createBulkWriter(db, null);
			this.bulkWriters.set(db, bulkWriter);
		}
		return bulkWriter;
	}

	private createBulkWriter(db: Firestore, onFailure: ((error: BulkWriterError) => void) | null): BulkWriter {
		const bulkWriter = db.bulkWriter({ throttling: !this.context.isEmulator });
		bulkWriter.onWriteError((error) => {
			const isRetried = RETRIED_CODES.includes(error.code) && error.failedAttempts < MAX_WRITE_ATTEMPTS;
			if (!isRetried) {
				onFailure?.(error);
			}
			return isRetried;
		});
		return bulkWriter;
	}
}

function startWrite(bulkWriter: BulkWriter, reference: DocumentReference, data: DocumentData, writeMode: WriteMode): Promise<unknown> {
	switch (writeMode) {
		case "overwrite":
			return bulkWriter.set(reference, data);
		case "merge":
			return bulkWriter.set(reference, data, { merge: true });
		case "skip":
			return bulkWriter.create(reference, data);
	}
}

function errorCode(error: unknown): unknown {
	return isObject(error) ? error.code : undefined;
}

function describeFailure({ documentPath, rowNumber, message }: TaskFailure): string {
	const place = [rowNumber === null ? null : `Row ${rowNumber}`, documentPath].filter((part) => part !== null).join(", ");
	return place ? `${place}: ${message}` : message;
}

function describeError(error: unknown): string {
	return types.isNativeError(error) ? error.message : String(error);
}
