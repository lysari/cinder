import { Injectable, inject } from "@angular/core";
import type { DatabaseTarget } from "../../../../../shared/interfaces/account.interface";
import type {
	CreateDocumentParams,
	DocumentPage,
	ListDocumentsParams,
} from "../../../../../shared/interfaces/browse.interface";
import type { FirestoreDocument } from "../../../../../shared/interfaces/firestore-value.interface";
import { RpcService } from "../../../core/services/rpc.service";
import type { FieldChanges } from "../../../shared/interfaces/value-draft.interface";

@Injectable()
export class ExplorerApiService {
	private readonly rpc = inject(RpcService);

	listDocuments(params: ListDocumentsParams): Promise<DocumentPage> {
		return this.rpc.request.listDocuments(params);
	}

	getDocument(database: DatabaseTarget, documentPath: string): Promise<FirestoreDocument | null> {
		return this.rpc.request.getDocument({ database, documentPath });
	}

	listSubcollections(database: DatabaseTarget, documentPath: string): Promise<string[]> {
		return this.rpc.request.listCollections({ database, documentPath });
	}

	createDocument(params: CreateDocumentParams): Promise<FirestoreDocument> {
		return this.rpc.request.createDocument(params);
	}

	updateDocument(database: DatabaseTarget, documentPath: string, changes: FieldChanges): Promise<FirestoreDocument> {
		return this.rpc.request.updateDocument({ database, documentPath, ...changes });
	}

	deleteDocument(database: DatabaseTarget, documentPath: string, isRecursive: boolean): Promise<void> {
		return this.rpc.request.deleteDocument({ database, documentPath, isRecursive });
	}
}
