import { CodeChallengeMethod, OAuth2Client, type OAuth2ClientOptions } from "google-auth-library";
import type { Server } from "bun";
import { randomBytes, timingSafeEqual } from "node:crypto";
import type { OAuthClient } from "../../shared/interfaces/account.interface";

export const SIGN_IN_TIMEOUT_MS = 5 * 60 * 1000;
const LOOPBACK_HOST = "127.0.0.1";
const CALLBACK_PATH = "/";
const STATE_BYTES = 32;
const SCOPES = ["openid", "email", "https://www.googleapis.com/auth/cloud-platform"];
const SIGNED_IN_PAGE = "<!doctype html><title>Cinder</title><p>Signed in to Cinder. You can close this tab.</p>";
const FAILED_PAGE = "<!doctype html><title>Cinder</title><p>Sign-in failed. Return to Cinder for details.</p>";

interface GoogleSignInOptions {
	timeoutMs: number;
	openUrl: (url: string) => boolean;
	endpoints?: OAuth2ClientOptions["endpoints"];
}

export interface GoogleSignInResult {
	email: string;
	refreshToken: string;
}

interface AuthorizationRequest {
	clientId: string;
	state: string;
	codeVerifier: string;
	redirectUri: string;
}

export class GoogleSignIn {
	private cancelPending: (() => void) | null = null;

	constructor(private readonly options: GoogleSignInOptions) {}

	async start(oauthClient: OAuthClient): Promise<GoogleSignInResult> {
		this.cancel();
		const client = new OAuth2Client({
			clientId: oauthClient.clientId,
			clientSecret: oauthClient.clientSecret,
			endpoints: this.options.endpoints,
		});
		const { codeVerifier, codeChallenge } = await client.generateCodeVerifierAsync();
		const state = randomBytes(STATE_BYTES).toString("base64url");
		const { promise, resolve, reject } = Promise.withResolvers<GoogleSignInResult>();
		let isSettled = false;
		const server = Bun.serve({
			hostname: LOOPBACK_HOST,
			port: 0,
			fetch: async (request, server) => {
				const url = new URL(request.url);
				if (isSettled || url.pathname !== CALLBACK_PATH) {
					return new Response("Not found", { status: 404 });
				}
				try {
					const result = await this.completeSignIn(client, url, {
						clientId: oauthClient.clientId,
						state,
						codeVerifier,
						redirectUri: redirectUriOf(server),
					});
					settle(() => resolve(result));
					return htmlResponse(SIGNED_IN_PAGE, 200);
				} catch (error) {
					settle(() => reject(error));
					return htmlResponse(FAILED_PAGE, 400);
				}
			},
		});
		const timer = setTimeout(
			() => settle(() => reject(new Error("Google sign-in timed out. Start it again."))),
			this.options.timeoutMs,
		);
		const settle = (finish: () => void) => {
			if (isSettled) {
				return;
			}
			isSettled = true;
			clearTimeout(timer);
			this.cancelPending = null;
			void server.stop();
			finish();
		};
		this.cancelPending = () => settle(() => reject(new Error("Google sign-in was canceled.")));
		const authUrl = client.generateAuthUrl({
			access_type: "offline",
			prompt: "consent",
			scope: SCOPES,
			state,
			redirect_uri: redirectUriOf(server),
			code_challenge_method: CodeChallengeMethod.S256,
			code_challenge: codeChallenge,
		});
		if (!this.options.openUrl(authUrl)) {
			settle(() => reject(new Error("Cinder could not open the browser for Google sign-in.")));
		}
		return promise;
	}

	cancel(): void {
		this.cancelPending?.();
	}

	private async completeSignIn(client: OAuth2Client, url: URL, request: AuthorizationRequest): Promise<GoogleSignInResult> {
		if (!isSameState(url.searchParams.get("state") ?? "", request.state)) {
			throw new Error("Google sign-in returned an unexpected state. Start it again.");
		}
		const error = url.searchParams.get("error");
		if (error) {
			throw new Error(`Google sign-in did not finish: ${error}.`);
		}
		const code = url.searchParams.get("code");
		if (!code) {
			throw new Error("Google sign-in returned no authorization code.");
		}
		const { tokens } = await client.getToken({ code, codeVerifier: request.codeVerifier, redirect_uri: request.redirectUri });
		if (!tokens.refresh_token || !tokens.id_token) {
			throw new Error("Google returned no refresh token. Remove Cinder's access in your Google account and sign in again.");
		}
		const ticket = await client.verifyIdToken({ idToken: tokens.id_token, audience: request.clientId });
		const email = ticket.getPayload()?.email;
		if (!email) {
			throw new Error("Google did not share the account's email address.");
		}
		return { email, refreshToken: tokens.refresh_token };
	}
}

function redirectUriOf(server: Server<undefined>): string {
	return `http://${LOOPBACK_HOST}:${server.port}${CALLBACK_PATH}`;
}

function isSameState(received: string, expected: string): boolean {
	const receivedBytes = Buffer.from(received);
	const expectedBytes = Buffer.from(expected);
	return receivedBytes.length === expectedBytes.length && timingSafeEqual(receivedBytes, expectedBytes);
}

function htmlResponse(html: string, status: number): Response {
	return new Response(html, { status, headers: { "Content-Type": "text/html; charset=utf-8" } });
}
