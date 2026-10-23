import { afterAll, describe, expect, test } from "bun:test";
import {
	listDatabases,
	listFirebaseProjects,
	listFirestoreDatabases,
	listProjects,
} from "../../../src/bun/services/project-listing";
import type { EmulatorAccount } from "../../../src/shared/interfaces/account.interface";

const ACCESS_TOKEN = "test-access-token";
const authorizations: (string | null)[] = [];

const fakeGoogleApi = Bun.serve({
	hostname: "127.0.0.1",
	port: 0,
	fetch: (request) => {
		const url = new URL(request.url);
		authorizations.push(request.headers.get("Authorization"));
		if (url.pathname === "/v1beta1/projects") {
			if (url.searchParams.get("pageToken") === "page-2") {
				return Response.json({ results: [{ projectId: "beta-project" }] });
			}
			return Response.json({ results: [{ projectId: "alpha-project", displayName: "Alpha" }], nextPageToken: "page-2" });
		}
		if (url.pathname === "/v1/projects/alpha-project/databases") {
			return Response.json({
				databases: [{ name: "projects/alpha-project/databases/(default)" }, { name: "projects/alpha-project/databases/orders" }],
			});
		}
		if (url.pathname === "/v1/projects/locked-project/databases") {
			return Response.json({ error: { code: 403, message: "The caller does not have permission" } }, { status: 403 });
		}
		return Response.json({ error: { code: 404, message: "Project not found" } }, { status: 404 });
	},
});
const FAKE_API_URL = `http://127.0.0.1:${fakeGoogleApi.port}`;

afterAll(() => fakeGoogleApi.stop(true));

describe("listFirebaseProjects", () => {
	test("follows every page with the access token", async () => {
		expect(await listFirebaseProjects(ACCESS_TOKEN, FAKE_API_URL)).toEqual([
			{ projectId: "alpha-project", displayName: "Alpha" },
			{ projectId: "beta-project", displayName: "beta-project" },
		]);
		expect(authorizations.slice(-2)).toEqual([`Bearer ${ACCESS_TOKEN}`, `Bearer ${ACCESS_TOKEN}`]);
	});
});

describe("listFirestoreDatabases", () => {
	test("returns the database ids of a project", async () => {
		expect(await listFirestoreDatabases(ACCESS_TOKEN, "alpha-project", FAKE_API_URL)).toEqual({
			databaseIds: ["(default)", "orders"],
			warning: null,
		});
	});

	test("falls back to the default database when listing is forbidden", async () => {
		const databases = await listFirestoreDatabases(ACCESS_TOKEN, "locked-project", FAKE_API_URL);
		expect(databases.databaseIds).toEqual(["(default)"]);
		expect(databases.warning).toBe(
			"Cinder may not list the databases of locked-project, so only (default) is shown. Google answered 403: The caller does not have permission",
		);
	});

	test("reports any other error with Google's message", async () => {
		await expect(listFirestoreDatabases(ACCESS_TOKEN, "missing-project", FAKE_API_URL)).rejects.toThrow(
			"Google answered 404: Project not found",
		);
	});
});

describe("listProjects and listDatabases", () => {
	test("list an emulator account's own project ids and its default database", async () => {
		const account: EmulatorAccount = { id: "emulator", type: "emulator", host: "127.0.0.1", port: 8080, projectIds: ["demo-cinder"] };
		expect(await listProjects(account)).toEqual([{ projectId: "demo-cinder", displayName: "demo-cinder" }]);
		expect(await listDatabases(account, "demo-cinder")).toEqual({
			databaseIds: ["(default)"],
			warning: null,
		});
	});
});
