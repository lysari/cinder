import { Injectable, inject } from "@angular/core";
import type { ExportFileCheck, ExportFileParams } from "../../../../../shared/interfaces/export.interface";
import type { ImportFileSummary } from "../../../../../shared/interfaces/import.interface";
import { RpcService } from "../../../core/services/rpc.service";

const WAIT_FOR_USER = { maxRequestTime: Infinity };

@Injectable()
export class TransferApiService {
	private readonly rpc = inject(RpcService);

	getDefaultExportFolder(): Promise<string> {
		return this.rpc.request.getDefaultExportFolder();
	}

	chooseExportFolder(): Promise<string | null> {
		return this.rpc.request.chooseExportFolder(undefined, WAIT_FOR_USER);
	}

	checkExportFile(params: ExportFileParams): Promise<ExportFileCheck> {
		return this.rpc.request.checkExportFile(params);
	}

	chooseImportFile(): Promise<ImportFileSummary | null> {
		return this.rpc.request.chooseImportFile(undefined, WAIT_FOR_USER);
	}
}
