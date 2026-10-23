# AGENTS.md

Guidance for AI coding agents working in this repository.

## Project

osmdle — a higher/lower game where players guess which OpenStreetMap feature is
more common in the real world. Next.js 16 (App Router) + React 19 + TypeScript +
Tailwind v4.

## Commands

- `npm ci` — install exactly from the lockfile (do not use `npm install` to add deps casually)
- `npm run dev` — start the dev server
- `npm run build` — production build
- `npm run lint` — Biome linter + formatter check
- `npm run format` — apply Biome formatting
- `npm run typecheck` — generate Next.js route types and run `tsc --noEmit`

## Conventions

- Formatting/linting is owned by Biome (`biome.json`): single quotes, no
  semicolons, 2-space indent, 100-char line width. Do not add ESLint/Prettier.
- Do not add code comments unless explicitly requested.
- Commit messages follow Conventional Commits, lowercase, imperative, ≤50-char
  subject (enforced by commitlint).
- Prefer the `@/*` path alias for imports from the repo root.

## Security

- `.npmrc` sets `ignore-scripts=true`, `min-release-age=7`, `save-exact=true`,
  and `engine-strict=true`. Keep dependency versions exact and pinned.
- Never run installs/builds with production secrets in the environment.
- Do not add dependencies with install-lifecycle scripts without an explicit
  allowlist decision.

## Dev MCP

`opencode.json` wires the Next.js devtools MCP server (`next-devtools-mcp`).
It connects to the running dev server for live errors, logs, routes, and
compile diagnostics. Run `npm run dev` before relying on it.
