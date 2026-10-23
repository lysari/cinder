import { Firestore, type Settings } from "@google-cloud/firestore";
import type { DatabaseSettings } from "../shared/interfaces/account.interface";

const GOOGLE_UNIVERSE_DOMAIN = "googleapis.com";

export function createFirestore(settings: DatabaseSettings, clientSettings: Pick<Settings, "useBigInt"> = {}): Firestore {
	if (settings.type === "emulator") {
		return new Firestore({
			...clientSettings,
			projectId: settings.projectId,
			databaseId: settings.databaseId,
			host: settings.host,
			port: settings.port,
			ssl: false,
			clientOptions: { universeDomain: GOOGLE_UNIVERSE_DOMAIN },
		});
	}
	return new Firestore({
		...clientSettings,
		projectId: settings.projectId,
		databaseId: settings.databaseId,
		credentials: settings.credentials as Settings["credentials"],
	});
}
