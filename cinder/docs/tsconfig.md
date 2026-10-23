# tsconfig.json and src/mainview/tsconfig.app.json

- `tsconfig.json` covers the Bun side (`src/` without `src/mainview/`, `tests/`, and the root config files) and extends the generated `.hutch/devkit/tsconfig.json`, which maps `electrobun/*` imports to the devkit. Run `bun run prepare:devkit` before the first typecheck.
- `src/mainview/tsconfig.app.json` covers the Angular app. It resets `exclude` to `[]`, because the inherited exclude of `src/mainview` would otherwise remove every file.
- It sets `noEmit: false` because the Vite Angular plugin compiles through the TypeScript emit; with `noEmit: true` the build outputs an empty bundle. `bun run typecheck` passes `--noEmit` to `ngc` itself, so nothing is written to disk.
