import { describe, expect, test } from "bun:test";
import { resolveDatabaseSettings } from "../../../src/bun/services/database-settings";
import type { DatabaseTarget } from "../../../src/shared/interfaces/account.interface";

const TARGET: DatabaseTarget = { accountId: "account-1", projectId: "demo-cinder", databaseId: "(default)" };

describe("resolveDatabaseSettings", () => {
	test("points an emulator account at its host and port", () => {
		expect(resolveDatabaseSettings({ id: "account-1", type: "emulator", host: "127.0.0.1", port: 8080, projectIds: ["demo-cinder"] }, TARGET)).toEqual({
			type: "emulator",
			projectId: "demo-cinder",
			databaseId: "(default)",
			host: "127.0.0.1",
			port: 8080,
		});
	});

	test("passes a service account key as service account credentials", () => {
		const settings = resolveDatabaseSettings(
			{
				id: "account-1",
				type: "service-account",
				projectId: "key-project",
				clientEmail: "reader@key-project.iam.gserviceaccount.com",
				privateKey: "test-private-key",
			},
			{ ...TARGET, databaseId: "orders" },
		);
		expect(settings).toEqual({
			type: "cloud",
			projectId: "demo-cinder",
			databaseId: "orders",
			credentials: {
				type: "service_account",
				client_email: "reader@key-project.iam.gserviceaccount.com",
				private_key: "test-private-key",
			},
		});
	});

	test("passes a Google user as authorized user credentials", () => {
		const settings = resolveDatabaseSettings(
			{
				id: "account-1",
				type: "google-user",
				email: "dara@example.com",
				refreshToken: "test-refresh-token",
				oauthClient: { clientId: "test-client-id", clientSecret: "test-client-secret" },
			},
			TARGET,
		);
		expect(settings).toEqual({
			type: "cloud",
			projectId: "demo-cinder",
			databaseId: "(default)",
			credentials: {
				type: "authorized_user",
				client_id: "test-client-id",
				client_secret: "test-client-secret",
				refresh_token: "test-refresh-token",
			},
		});
	});
});
