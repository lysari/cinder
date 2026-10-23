import { describe, expect, test } from "bun:test";
import {
	parseAccountParams,
	parseEmulatorAccountForm,
	parseOAuthClient,
	parseProjectParams,
} from "../../src/bun/account-request-parser";

const EMULATOR_FORM = { host: "127.0.0.1", port: 8080, projectIds: ["demo-cinder", "demo-other"] };

describe("parseEmulatorAccountForm", () => {
	test("accepts a host, port and project ids and drops other fields", () => {
		expect(parseEmulatorAccountForm({ ...EMULATOR_FORM, extra: true })).toEqual(EMULATOR_FORM);
		expect(parseEmulatorAccountForm({ ...EMULATOR_FORM, host: "localhost" }).host).toBe("localhost");
	});

	test("rejects an invalid host", () => {
		for (const host of ["", "-bad", "a b", "http://127.0.0.1", 42]) {
			expect(() => parseEmulatorAccountForm({ ...EMULATOR_FORM, host })).toThrow("The emulator host must be a host name or IPv4 address.");
		}
	});

	test("rejects a port outside 1 to 65535", () => {
		for (const port of [0, 65536, 80.5, "8080"]) {
			expect(() => parseEmulatorAccountForm({ ...EMULATOR_FORM, port })).toThrow("The emulator port must be a whole number from 1 to 65535.");
		}
	});

	test("rejects missing, invalid or repeated project ids", () => {
		expect(() => parseEmulatorAccountForm({ ...EMULATOR_FORM, projectIds: [] })).toThrow("An emulator account needs at least one project id.");
		expect(() => parseEmulatorAccountForm({ ...EMULATOR_FORM, projectIds: ["Demo"] })).toThrow("A project id uses lowercase letters");
		expect(() => parseEmulatorAccountForm({ ...EMULATOR_FORM, projectIds: ["demo", "demo"] })).toThrow("Each project id may be listed only once.");
		expect(() => parseEmulatorAccountForm(null)).toThrow("An emulator account needs a host, port and project ids.");
	});
});

describe("parseOAuthClient", () => {
	test("accepts a desktop client id and secret", () => {
		const client = { clientId: "123-abc.apps.googleusercontent.com", clientSecret: "test-secret" };
		expect(parseOAuthClient({ ...client, extra: 1 })).toEqual(client);
	});

	test("rejects a client id from elsewhere and a missing secret", () => {
		expect(() => parseOAuthClient({ clientId: "123-abc.example.com", clientSecret: "test-secret" })).toThrow(
			"The client id must end with .apps.googleusercontent.com.",
		);
		expect(() => parseOAuthClient({ clientId: "123-abc.apps.googleusercontent.com", clientSecret: "" })).toThrow(
			"The client secret is missing or too long.",
		);
	});
});

describe("parseAccountParams and parseProjectParams", () => {
	test("accept an account id and a project id", () => {
		expect(parseAccountParams({ accountId: "account-1", extra: 1 })).toEqual({ accountId: "account-1" });
		expect(parseProjectParams({ accountId: "account-1", projectId: "demo-cinder" })).toEqual({
			accountId: "account-1",
			projectId: "demo-cinder",
		});
		expect(parseProjectParams({ accountId: "account-1", projectId: "example.com:legacy-project" }).projectId).toBe(
			"example.com:legacy-project",
		);
	});

	test("reject a missing account id or an invalid project id", () => {
		expect(() => parseAccountParams({})).toThrow("The request needs an account id.");
		expect(() => parseProjectParams({ accountId: "account-1", projectId: "../secrets" })).toThrow("A project id uses lowercase letters");
	});
});
