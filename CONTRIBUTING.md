# Contributing to Cinder

Thank you for contributing to Cinder! Bug reports, feature suggestions, and pull requests are warmly welcome.

## Getting started

Follow the setup instructions in the [Getting started](README.md#getting-started) section of the README:

```bash
cd cinder
bun install
bun run prepare:devkit
bun run dev
```

If you are using [Devbox](https://www.jetify.com/devbox):

```bash
devbox run -- 'cd cinder && bun run dev'
```

## Architecture principles

When contributing code, please keep Cinder's core design principles in mind:

- **Strict process isolation**:
  - The **main process** (`cinder/src/bun/`) manages window lifecycles, Keychain credentials, application menus, and task supervision. It **never loads the Firestore SDK**.
  - The **webview** (`cinder/src/mainview/`) handles UI rendering only. It communicates with the backend exclusively via typed Electrobun RPC calls and never makes direct network requests.
  - **Database operations** execute in isolated Bun worker processes (`cinder/src/worker/`): long-lived browse sessions per database, and ephemeral task workers for heavy scripts, imports, and exports.
- **Data type fidelity**:
  - Never coerce or drop Firestore data types. 64-bit integers, exact doubles (e.g. `2.0`), nanosecond timestamps, geopoints, byte arrays, document references, and vector embeddings must be preserved accurately across RPC and storage boundaries.
- **Privacy & security**:
  - Sensitive secrets (OAuth refresh tokens, service account private keys) must stay securely inside the macOS Keychain. Never store credentials in the webview, state files, or unencrypted local storage.

## Validation & testing

Before submitting changes, ensure that typechecking and tests pass cleanly:

```bash
cd cinder
bun run typecheck     # Typechecks Bun backend, workers, and Angular templates (ngc)
bun run test          # Runs test suite with bun:test
```

## Pull request guidelines

- Keep each pull request focused on a single feature or bug fix.
- Follow [Conventional Commits](https://www.conventionalcommits.org/) for commit messages (e.g., `feat:`, `fix:`, `docs:`, `refactor:`).
- Document new features or data format additions in `cinder/docs/`.
- By submitting a pull request, you agree that your contributions are licensed under the project's [MIT License](LICENSE).

