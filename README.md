# osmdle

A higher/lower game where players guess which OpenStreetMap feature is more
common in the real world.

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

| Script              | Description                    |
| ------------------- | ------------------------------ |
| `npm run dev`       | Start the development server   |
| `npm run build`     | Create a production build      |
| `npm run start`     | Serve the production build     |
| `npm run lint`      | Biome linter + formatter check |
| `npm run format`    | Apply Biome formatting         |
| `npm run typecheck` | Type-check with `tsc --noEmit` |

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

`opencode.json` wires the Next.js devtools MCP server, which connects to the
running dev server to expose live errors, logs, routes, and compile
diagnostics. Start `npm run dev` first, then restart your agent.
