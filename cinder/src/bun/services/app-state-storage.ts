import { mkdirSync, renameSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import type { ViewState, WindowFrame } from "../../shared/interfaces/app-state.interface";
import { isObject } from "../../shared/utils/type-guards";
import { parseViewState, parseWindowFrame } from "../view-state-parser";

export const APP_STATE_SAVE_DELAY_MS = 500;
const FILE_VERSION = 1;
const FILE_MODE = 0o600;
const DIRECTORY_MODE = 0o700;

interface AppStateFile {
	version: typeof FILE_VERSION;
	window: WindowFrame | null;
	view: ViewState | null;
}

interface AppStateStorageOptions {
	filePath: string;
	saveDelayMs: number;
}

export class AppStateStorage {
	private state: AppStateFile = { version: FILE_VERSION, window: null, view: null };
	private saveTimer: Timer | null = null;

	constructor(private readonly options: AppStateStorageOptions) {}

	async load(): Promise<void> {
		const file = Bun.file(this.options.filePath);
		if (!(await file.exists())) {
			return;
		}
		try {
			this.state = parseAppStateFile(JSON.parse(await file.text()));
		} catch (error) {
			console.warn(`The app state in ${this.options.filePath} is not valid and was ignored: ${String(error)}`);
		}
	}

	get windowFrame(): WindowFrame | null {
		return this.state.window;
	}

	get viewState(): ViewState | null {
		return this.state.view;
	}

	saveWindowFrame(frame: WindowFrame): void {
		this.state = { ...this.state, window: frame };
		this.scheduleWrite();
	}

	saveViewState(view: ViewState): void {
		this.state = { ...this.state, view };
		this.scheduleWrite();
	}

	flush(): void {
		if (this.saveTimer === null) {
			return;
		}
		clearTimeout(this.saveTimer);
		this.saveTimer = null;
		this.write();
	}

	private scheduleWrite(): void {
		if (this.saveTimer !== null) {
			clearTimeout(this.saveTimer);
		}
		this.saveTimer = setTimeout(() => {
			this.saveTimer = null;
			this.write();
		}, this.options.saveDelayMs);
	}

	private write(): void {
		const temporaryPath = `${this.options.filePath}.${crypto.randomUUID()}.tmp`;
		try {
			mkdirSync(dirname(this.options.filePath), { recursive: true, mode: DIRECTORY_MODE });
			writeFileSync(temporaryPath, JSON.stringify(this.state, null, "\t"), { mode: FILE_MODE });
			renameSync(temporaryPath, this.options.filePath);
		} catch (error) {
			console.error(`Saving the app state to ${this.options.filePath} failed: ${String(error)}`);
		}
	}
}

function parseAppStateFile(value: unknown): AppStateFile {
	if (!isObject(value) || value.version !== FILE_VERSION) {
		throw new Error(`The app state file must have version ${FILE_VERSION}.`);
	}
	return {
		version: FILE_VERSION,
		window: value.window === null ? null : parseWindowFrame(value.window),
		view: value.view === null ? null : parseViewState(value.view),
	};
}
