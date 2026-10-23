import type { Account, DatabaseSettings, DatabaseTarget } from "../../shared/interfaces/account.interface";

export const SIGN_IN_AGAIN_MESSAGE =
	"was signed in with an OAuth client this build of Cinder does not include. Sign in again with Google to use it.";

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
			if (account.oauthClientSecret === null) {
				throw new Error(`${account.email} ${SIGN_IN_AGAIN_MESSAGE}`);
			}
			return {
				type: "cloud",
				projectId,
				databaseId,
				credentials: {
					type: "authorized_user",
					client_id: account.oauthClientId,
					client_secret: account.oauthClientSecret,
					refresh_token: account.refreshToken,
				},
			};
	}
}
