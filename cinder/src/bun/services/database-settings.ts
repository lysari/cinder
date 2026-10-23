import type { Account, DatabaseSettings, DatabaseTarget } from "../../shared/interfaces/account.interface";

export function resolveDatabaseSettings(account: Account, target: DatabaseTarget): DatabaseSettings {
	const { projectId, databaseId } = target;
	switch (account.type) {
		case "emulator":
			return { type: "emulator", projectId, databaseId, host: account.host, port: account.port };
		case "service-account":
			return {
				type: "cloud",
				projectId,
				databaseId,
				credentials: { type: "service_account", client_email: account.clientEmail, private_key: account.privateKey },
			};
		case "google-user":
			return {
				type: "cloud",
				projectId,
				databaseId,
				credentials: {
					type: "authorized_user",
					client_id: account.oauthClient.clientId,
					client_secret: account.oauthClient.clientSecret,
					refresh_token: account.refreshToken,
				},
			};
	}
}
