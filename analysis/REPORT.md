# Firefoo 1.5.11 (macOS arm64): reverse-engineering notes

Target: `target/app/Firefoo.app`, downloaded from `releases.firefoo.app/download/darwin_arm64`.
It is signed with Developer ID `Mathis Lichtenberger (2AGB5YS7R3)`.
`app.asar` sha256: `59b64c643ec9248f65cec3fc80e0ee72c64dd86673e5e32f56a742cb805ebe27`.

Tooling: `rea-agents@6.7.0` `analyze-javascript-application` (evidence graph: `analysis/rea-js-app.json`),
`@electron/asar` extract (`target/extracted/`), and js-beautify slices (`analysis/*.js`).
Offsets below are `file:line:column` into the minified bundles. The bundles are single-line, so the column is the byte offset.

> **REA coverage gap:** REA's worker ran out of heap on the three large bundles (`main/index.js`,
> `main/ficoprocess.js`, `renderer/main_window/index.js`), so its semantic graph is partial.
> Its Electron-boundary facts are complete: windows, webPreferences, preload, and the 22 IPC handlers.
> I traced the internals by reading the source manually, starting from REA's offsets.

---

## 1. Architecture

```
┌──────────────── Renderer (main_window, React + Redux, Monaco) ───────────────┐
│ nodeIntegration=ON, contextIsolation=OFF, webSecurity=OFF                     │
│ • builds JavaScript from GUI queries                                          │
│ • invoke(...) → 21 ipcMain.handle channels                                    │
│ • send("f2p-message", Task) ───────────┐     ◄── "b2f-message" (task updates) │
└────────────────────────────────────────┼─────────────────────────────────────┘
                                         ▼
┌──────────────── Main process (.webpack/main/index.js) ────────────────────────┐
│ • holds account keys in memory: tt = {UserAccount:{}, ServiceAccount:{}}      │
│ • task queue ft[], running mt{}, concurrency ht = 4 if RAM>10GB else 2        │
│ • RunScript / AnalyzeCSV / LoadCSV skip the queue                             │
│ • ExecuteShortScript runs in-process with node:vm (10s default timeout)       │
│ • a warm pool of 1 pre-forked worker                                          │
└────────────────────────────────────────┬──────────────────────────────────────┘
               child_process.fork("ficoprocess.js", execArgv:                   
               --experimental-vm-modules --max-old-space-size=2048)             
                                         ▼
┌──────────────── Worker (.webpack/main/ficoprocess.js), one per task ──────────┐
│ process.on("message") → qv(task): RunScript | Export | Import | Copy |        │
│ AuthCopy | Transfer | DocUpdate | RtQuery | AnalyzeCSV | LoadCSV              │
│ batches updates every 500 ms → process.send → main → renderer                 │
│ firebase-admin (patched) ── gRPC ──► firestore.googleapis.com / emulator      │
└───────────────────────────────────────────────────────────────────────────────┘
```

Evidence:
- Window and webPreferences: `main/index.js:2:3971266` (beautified in `analysis/main-ipc.js`, the `ir()` function)
- Task routing: `analysis/main-app.js:790-905` (`pt`, `_t`, `bt`, `wt`, `Ot`)
- Worker dispatch: `analysis/fico-app.js:6901` (`process.on("message")`) → `qv` at `:6941`
- Task type enum: `analysis/main-app.js:204`

### IPC surface (renderer → main, `ipcMain.handle`)

| Channel | Purpose |
|---|---|
| `LoginViaGoogle` | Loopback OAuth flow (see §3) |
| `SetUserAccount` / `SetServiceAccount` | Push credentials into main-process memory |
| `ExecuteShortScript` | Run a small JS snippet in main with `node:vm` and return the serialized result |
| `SetTabInfo`, `SetIsScriptRunning` | Update the native menu state |
| `ShowSaveDialog` / `ShowOpenDialog` / `ShowContextMenu` | Native UI |
| `GetMachineId`, `GetPlatform`, `SetH`, `GetInitialMainState` | License/telemetry identity, persisted state |
| `RunAutoUpdater`, `QuitAndUpdate` | Squirrel `autoUpdater` (Stable/other channels) |
| `OpenChat`, `OpenLicenses` | Child windows (`app.chaport.com` widget, `assets.firefoo.app/text/licenses.html`) |
| `ToggleMaximize`, `TerminateFirefoo`, `ForceRendererCrash` | Window/process control |

Plus `ipcMain.on("f2p-message")` for tasks and `webContents.send("b2f-message")` for results.
The preload only sets `window.api = {log, appVersion}`. There is no contextBridge, because the renderer already has full Node access.

---

## 2. Feature: query execution (GUI ⇄ JavaScript)

The UI never calls Firestore itself. **Every query, including GUI-built ones, becomes JavaScript that runs against the Firebase Admin SDK.**

**GUI → JS codegen** (`renderer/main_window/index.js:2:8723488`, functions `EX`/`CX`/`RX`):
```js
async function run() {
  const query = await db.collection("<path>")
    .where("<field>", "<op>", <value>)        // String → "…", Time → admin.firestore.Timestamp.fromMillis(n)
    .orderBy("<field>", "<dir>")
    .limit(<n>)
    .get();
  return query;
}
```
**JS → GUI parser:** a set of whitespace-tolerant regexes (`PX`, `NX`, `DX`, `BX`, `jX`, `FX`) match the same shape.
That way a script the user edits by hand can switch back to the GUI builder whenever it still fits the template.
`UX` infers value types (bool/null/quoted string/Timestamp.fromMillis/number/JSON array).

**Execution sandbox:** `vm.createContext` + `runInContext(script)` → `await ctx.run()`, then the result is unwrapped while it is still a Promise.
- Short path (main, `analysis/main-app.js:1620`): the context has `db, admin, FirebaseFirestore, _` and timers.
- Full path (worker, `analysis/fico-app.js:6077` `Ev`) adds `axios, fetch, uuid, async, jwt, moment, dateFns, produce (immer), fs, path, csv, stream, zlib`.
  It also adds a prelude that redirects `console.*` into the task log (`ficoprocess.js` module `68706`).
- The result is serialized into a compact tagged format, e.g. `{t:"s", v:…}`.
  Tags: `a` array, `b` bool, `x` bytes, `d` double, `fr` docRef, `g` geopoint, `i` int, `m` map, `n` null, `s` string, `t` timestamp, `_qs` QuerySnapshot, `_ds` DocumentSnapshot, `_q` Query.
  The renderer renders the result as Tree, Table, or JSON.
- Realtime (`RtQuery`): races the listener's first result against a 1 s timeout and returns `RtQueryResult` (`analysis/fico-app.js:7106`).

To build something similar: generate code from a structured query model, keep a strict regex parser for the reverse direction, and run the code in a separate process.
Kill the process to cancel; `vm` timeouts alone don't stop async work. Stream progress back as batched `{taskUpdates, logMessages}` messages.

---

## 3. Network / auth flow

**Google sign-in** (`LoginViaGoogle`, `analysis/main-ipc.js`):
1. `http.createServer().listen(0)` starts a loopback server on a random port, and that URL is used as the redirect URI.
2. `google.auth.OAuth2(clientId, clientSecret, redirect).generateAuthUrl({access_type:"offline"})` builds the auth URL, which opens in the system browser.
3. The callback `?code=` is exchanged with `getToken`. The `id_token` is JWT-decoded for user info, and the server returns a "Successfully logged in" HTML page.
4. Scopes: `openid email cloudplatformprojects.readonly firebase cloud-platform`.
   It is a Google "installed app" client; the id and secret are embedded at `analysis/main-app.js:1055` (secret redacted here).

**Driving firebase-admin with a user's refresh token**: firebase-admin normally needs a service account. Firefoo uses `patch-package` to change three things:
- `FirebaseApp` constructor (`main/index.js:@1063188`): if `options.__monkeyPatchedAuth` is set, it builds a `RefreshTokenCredential({type:"authorized_user", …})`.
- `getFirestoreOptions` (`@1166991`): forwards `__monkeyPatchedAuth` to `@google-cloud/firestore`.
- GAPIC client constructor (`@368051`): `new GrpcClient({projectId, auth: __monkeyPatchedAuth})`, which is a google-auth `OAuth2Client` carrying the user's tokens.

Service accounts use the standard `credential.cert({projectId, clientEmail, privateKey})`.
Emulators use `firestore().settings({host, ssl:false})`.
Each connection is a named app instance (`o<projectId>-<nanoid>` or `e<emulatorId>-…`).
Transport is **gRPC** to Firestore; both the main and worker bundles ship protos.

**Credential handling:** account keys live in renderer state. They are pushed to main via `SetUserAccount`/`SetServiceAccount`, then attached to **every** task message as `_aux.accountKeys` and sent to the worker.

**Vendor endpoints:**
- `POST https://api.firefoo.app/api/firefoo/check_update` with `{k: licenseKey, hi: machineId, eventType, appVersion}`.
  The renderer calls it on a ~5 min cadence and main calls it on logout/quit. The response drives license state ("Could not connect to license server").
- Squirrel auto-update via `releases.firefoo.app`; support chat via `app.chaport.com`.
- Local state: `~/.firefoo/session.json` (window size, zoom, `h` = an AES-wrapped license/state blob).

---

## 4. Security observations

- The renderer has full Node access (`nodeIntegration` incl. subframes/workers, `contextIsolation:false`, `webSecurity:false`, `allowRunningInsecureContent:true`).
  Any XSS in rendered document data would be code execution with access to stored Google refresh tokens and service-account keys.
  React escaping is the main defense.
- `node:vm` is not a security boundary, and worker scripts get `fs`. That is fine for a user's own scripts, but it is not a sandbox.
- Credentials travel in every IPC task message rather than being resolved by id in the worker.
- The chat window loads a third-party URL with default webPreferences, so it is isolated. `new-window` is routed to `shell.openExternal`.

---

## Files

- `analysis/rea-js-app.json`: REA evidence graph (245 MB)
- `analysis/boundaries.txt`: flattened windows/IPC/storage/endpoint nodes
- `analysis/main-ipc.js`, `analysis/main-app.js`: main-process app code (beautified)
- `analysis/fico-app.js`: worker app code
- `analysis/preload.js`, `analysis/renderer-querygen.js`
- `scripts/`: slice/grep/summary helpers (run with `devbox shellenv`; REA needs `env -u DEVELOPER_DIR -u SDKROOT`)
