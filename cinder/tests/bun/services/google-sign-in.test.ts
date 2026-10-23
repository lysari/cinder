import { afterAll, describe, expect, test } from "bun:test";
import { createHash, createSign, generateKeyPairSync } from "node:crypto";
import { GoogleSignIn } from "../../../src/bun/services/google-sign-in";

const OAUTH_CLIENT = { clientId: "test-client.apps.googleusercontent.com", clientSecret: "test-client-secret" };
const KEY_ID = "test-key";
const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const tokenRequests: URLSearchParams[] = [];

const fakeGoogle = Bun.serve({
	hostname: "127.0.0.1",
	port: 0,
	fetch: async (request) => {
		const url = new URL(request.url);
		if (url.pathname === "/certs") {
			return Response.json({ [KEY_ID]: publicKey.export({ type: "spki", format: "pem" }) });
		}
		if (url.pathname === "/token") {
			tokenRequests.push(new URLSearchParams(await request.text()));
			return Response.json({
				access_token: "test-access-token",
				refresh_token: "test-refresh-token",
				id_token: signIdToken({ email: "dara@example.com" }),
				expires_in: 3600,
				token_type: "Bearer",
			});
		}
		return new Response("Not found", { status: 404 });
	},
});
const FAKE_GOOGLE_URL = `http://127.0.0.1:${fakeGoogle.port}`;

function signIdToken(claims: Record<string, unknown>): string {
	const now = Math.floor(Date.now() / 1000);
	const header = Buffer.from(JSON.stringify({ alg: "RS256", kid: KEY_ID, typ: "JWT" })).toString("base64url");
	const payload = Buffer.from(
		JSON.stringify({ iss: "https://accounts.google.com", aud: OAUTH_CLIENT.clientId, sub: "1", iat: now, exp: now + 3600, ...claims }),
	).toString("base64url");
	const signature = createSign("RSA-SHA256").update(`${header}.${payload}`).sign(privateKey, "base64url");
	return `${header}.${payload}.${signature}`;
}

function startSignIn({ timeoutMs = 5000, canOpenBrowser = true } = {}) {
	const openedUrls: string[] = [];
	const signIn = new GoogleSignIn({
		timeoutMs,
		openUrl: (url) => {
			openedUrls.push(url);
			return canOpenBrowser;
		},
		endpoints: {
			oauth2AuthBaseUrl: `${FAKE_GOOGLE_URL}/auth`,
			oauth2TokenUrl: `${FAKE_GOOGLE_URL}/token`,
			oauth2FederatedSignonPemCertsUrl: `${FAKE_GOOGLE_URL}/certs`,
		},
	});
	const result = signIn.start(OAUTH_CLIENT);
	const waitForAuthUrl = async () => {
		while (openedUrls.length === 0) {
			await Bun.sleep(5);
		}
		return new URL(openedUrls[0] as string);
	};
	return { signIn, result, waitForAuthUrl };
}

function callbackUrl(authUrl: URL, params: Record<string, string>): string {
	return `${authUrl.searchParams.get("redirect_uri")}?${new URLSearchParams(params)}`;
}

afterAll(() => fakeGoogle.stop(true));

describe("GoogleSignIn", () => {
	test("exchanges the code with the PKCE verifier and returns the verified email", async () => {
		const { result, waitForAuthUrl } = startSignIn();
		const authUrl = await waitForAuthUrl();
		expect(authUrl.origin + authUrl.pathname).toBe(`${FAKE_GOOGLE_URL}/auth`);
		expect(authUrl.searchParams.get("redirect_uri")).toMatch(/^http:\/\/127\.0\.0\.1:\d+\/$/);
		expect(authUrl.searchParams.get("scope")).toBe("openid email https://www.googleapis.com/auth/cloud-platform");
		expect(authUrl.searchParams.get("access_type")).toBe("offline");
		expect(authUrl.searchParams.get("code_challenge_method")).toBe("S256");

		const tokenRequestCount = tokenRequests.length;
		const page = await fetch(callbackUrl(authUrl, { code: "test-code", state: authUrl.searchParams.get("state") ?? "" }));
		expect(page.status).toBe(200);
		expect(await page.text()).toContain("You can close this tab.");
		expect(await result).toEqual({ email: "dara@example.com", refreshToken: "test-refresh-token" });

		const tokenRequest = tokenRequests[tokenRequestCount];
		expect(tokenRequest?.get("code")).toBe("test-code");
		expect(tokenRequest?.get("redirect_uri")).toBe(authUrl.searchParams.get("redirect_uri"));
		const codeVerifier = tokenRequest?.get("code_verifier") ?? "";
		expect(createHash("sha256").update(codeVerifier).digest("base64url")).toBe(authUrl.searchParams.get("code_challenge") ?? "");
		await expect(fetch(callbackUrl(authUrl, {}), { keepalive: false })).rejects.toThrow();
	});

	test("rejects a callback whose state does not match", async () => {
		const { result, waitForAuthUrl } = startSignIn();
		const authUrl = await waitForAuthUrl();
		const tokenRequestCount = tokenRequests.length;
		const failure = result.catch((error: Error) => error);
		const page = await fetch(callbackUrl(authUrl, { code: "test-code", state: "forged-state" }));
		expect(page.status).toBe(400);
		expect(await failure).toHaveProperty("message", "Google sign-in returned an unexpected state. Start it again.");
		expect(tokenRequests.length).toBe(tokenRequestCount);
	});

	test("rejects a callback that carries Google's error", async () => {
		const { result, waitForAuthUrl } = startSignIn();
		const authUrl = await waitForAuthUrl();
		const failure = result.catch((error: Error) => error);
		await fetch(callbackUrl(authUrl, { error: "access_denied", state: authUrl.searchParams.get("state") ?? "" }));
		expect(await failure).toHaveProperty("message", "Google sign-in did not finish: access_denied.");
	});

	test("times out and closes the loopback server", async () => {
		const { result, waitForAuthUrl } = startSignIn({ timeoutMs: 50 });
		const authUrl = await waitForAuthUrl();
		await expect(result).rejects.toThrow("Google sign-in timed out.");
		await expect(fetch(callbackUrl(authUrl, {}), { keepalive: false })).rejects.toThrow();
	});

	test("cancels a pending sign-in", async () => {
		const { signIn, result, waitForAuthUrl } = startSignIn();
		await waitForAuthUrl();
		signIn.cancel();
		await expect(result).rejects.toThrow("Google sign-in was canceled.");
	});

	test("fails when the browser cannot be opened", async () => {
		const { result } = startSignIn({ canOpenBrowser: false });
		await expect(result).rejects.toThrow("Cinder could not open the browser for Google sign-in.");
	});
});
