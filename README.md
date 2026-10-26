# Osmdle

Osmdle is a higher/lower game built on OpenStreetMap data. Each round shows you
two features from around the world, and you pick the one you think is mapped
more often worldwide. Guess correctly to build your streak, and try to beat your
best.

<img src="docs/assets/demo.gif" width="800" alt="Animated demo: a player picks between two OpenStreetMap features, builds a streak, and reaches the game-over screen">

## Requirements

- Node.js >= 24 (see `.nvmrc`)
- npm 11

## Getting started

```bash
npm ci
npm run dev
```

Open http://localhost:3000.

## Scripts

| Script                  | Description                           |
| ----------------------- | ------------------------------------- |
| `npm run dev`           | Start the development server          |
| `npm run build`         | Create the static export in `out/`    |
| `npm test`              | Run the game logic tests              |
| `npm run lint`          | Biome linter + formatter check        |
| `npm run format`        | Apply Biome formatting                |
| `npm run typecheck`     | Generate Next types and type-check    |
| `npm run data:sync`     | Refresh Taginfo counts and metadata   |
| `npm run data:validate` | Validate the committed data snapshot  |

## Data

The `Sync Taginfo counts` workflow runs on the first of each month and opens a
pull request with the refreshed `data/elements.json`.

## Git hooks

Hooks are managed by [lefthook](https://lefthook.dev). Since `.npmrc` sets
`ignore-scripts=true`, the `prepare` step is skipped on install — run it once
after cloning:

```bash
npx lefthook install
```

Pre-commit formats staged files with Biome and runs the type-check; commit-msg
enforces [Conventional Commits](https://www.conventionalcommits.org).

## Tech stack

- Next.js 16 (App Router) + React 19
- TypeScript (strict)
- Tailwind CSS v4
- Biome for linting and formatting

## Security

Dependencies install from the lockfile only, with install scripts disabled and
a release-age cooldown:

- `.npmrc` sets `ignore-scripts=true`, `min-release-age=7`,
  `save-exact=true`, and `engine-strict=true`
- dependency versions are pinned exactly in `package.json`
- CI runs `npm ci --ignore-scripts`, `npm audit`, and registry signature checks
- Dependabot updates with a 7-day cooldown

See [SECURITY.md](./SECURITY.md) to report a vulnerability.

## Development with coding agents

Agent guidance lives in [`AGENTS.md`](./AGENTS.md). Ask agents to verify their
changes with the same checks CI runs: `npm run lint`, `npm run typecheck`,
`npm test`, `npm run data:validate`, and `npm run build`.
