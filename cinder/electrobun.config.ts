import type { ElectrobunConfig } from "electrobun";
import { join } from "node:path";
import pkg from "./package.json";
import { BUILT_IN_OAUTH_CLIENT_FILE, readBuiltInOAuthClient } from "./scripts/built-in-oauth-client";

const { version } = pkg;
const builtInOAuthClient = await readBuiltInOAuthClient(join(import.meta.dir, BUILT_IN_OAUTH_CLIENT_FILE));

export default {
	app: {
		name: "Cinder",
		identifier: "app.cinder.desktop",
		version,
	},
	build: {
		mainProcess: "bun",
		bun: {
			entrypoint: "src/bun/index.ts",
			define: { BUILT_IN_OAUTH_CLIENT: JSON.stringify(builtInOAuthClient) },
		},
		copy: {
			"dist/index.html": "views/mainview/index.html",
			"dist/assets": "views/mainview/assets",
			"dist/worker.js": "bun/worker.js",
		},
		watchIgnore: ["dist/**"],
		mac: {
			bundleCEF: false,
			icons: "icon.iconset",
		},
		linux: {
			bundleCEF: false,
		},
		win: {
			bundleCEF: false,
		},
	},
} satisfies ElectrobunConfig;
