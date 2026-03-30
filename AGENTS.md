# AGENTS.md

## Project Summary

This repository is a SvelteKit backoffice for managing ZEIT game content. It currently supports four games:

- `eckchen`
- `wortiger`
- `spelling-bee`
- `wortgeflecht`

The app is frontend-heavy and talks directly to PostgREST endpoints for each game schema. There is no custom Node API layer in the app code for the core CRUD flows.

## Tech Stack

- Frontend: Svelte 5, SvelteKit 2
- Language: TypeScript
- Forms and validation: `sveltekit-superforms` with Zod-based schemas
- Styling: Tailwind CSS v4 plus ZEIT design system styles/tokens
- Testing: Vitest, Testing Library, jsdom
- Auth: `@zeitonline/svelte-oidc`
- Backend in local dev: PostgreSQL 17 + PostgREST + nginx via Docker Compose
- Svelte adapter: `@sveltejs/adapter-node`

Key package metadata lives in [app/package.json](app/package.json).

## Runtime Model

- The Svelte app lives in `app/`.
- `ssr = false` in [app/src/routes/+layout.ts](app/src/routes/+layout.ts#L10), so this is effectively a client-rendered admin app.
- In development, SvelteKit runs under the base path `/backoffice`. This is configured in [app/svelte.config.js](app/svelte.config.js#L17).
- In non-dev environments, access is gated by OIDC login in [app/src/components/OidcLogin.svelte](app/src/components/OidcLogin.svelte#L1).

## Local Dev Topology

Local services are defined in [docker-compose.yaml](docker-compose.yaml):

- `postgres` on `5432`
- `postgrest_eckchen` on `3001`
- `postgrest_wortiger` on `3002`
- `postgrest_spelling_bee` on `3003`
- `postgrest_wortgeflecht` on `3004`
- `nginx` on `8080`
- `app` on `3000`

The Vite dev server proxies frontend requests to those PostgREST services through these paths:

- `/backoffice/api/eckchen`
- `/backoffice/api/wortiger`
- `/backoffice/api/spelling-bee`
- `/backoffice/api/wortgeflecht`

Proxy config is in [app/vite.config.ts](app/vite.config.ts#L20).

## Repo Layout

- `app/src/routes`: route entrypoints for each game dashboard and word-list pages
- `app/src/components`: reusable UI and game-specific editors/forms
- `app/src/lib/games`: game-specific fetch/update helpers and validation utilities
- `app/src/lib/queries.ts`: shared dashboard data fetching and list pagination
- `app/src/config/games.config.ts`: central registry for game metadata, endpoints, table columns, form fields, and schemas
- `app/src/schemas`: form schemas per game
- `docker/init/init-db.sql`: local database schema and seed data

## Routing

Important routes:

- `/eckchen`
- `/wortiger`
- `/wortiger/wortliste`
- `/spelling-bee`
- `/wortgeflecht`
- `/wortgeflecht/wortliste`

The route tree is under [app/src/routes](app/src/routes).

## Game Configuration Contract

`CONFIG_GAMES` in [app/src/config/games.config.ts](app/src/config/games.config.ts#L22) is the central source of truth for game behavior. Each game defines:

- `apiBase`
- endpoint names
- form schemas
- dashboard table columns
- form field metadata
- creation modes

If a new game is added, this file is one of the main integration points.

Current endpoint mappings:

- `eckchen`: `game`
- `wortiger`: `wortiger_games`, word list `wortliste`
- `spelling-bee`: `game`, solutions `game_solution`
- `wortgeflecht`: `game`, word list `dictionary`

## Data Access Pattern

The project uses `requestPostgrest` from [app/src/lib/postgrest-client.ts](app/src/lib/postgrest-client.ts#L156) as the shared HTTP wrapper for PostgREST calls.

Common conventions:

- Query strings are built with `buildQueryParams`
- PostgREST operators are built with `pg`
- `Prefer: count=exact` is used when UI pagination needs total counts
- Errors should surface through `PostgrestError` and `getPostgrestErrorMessage`

When adding list views, prefer server-side pagination and server-side search over loading full datasets into the browser.

## UI Conventions

- The global app shell is defined in [app/src/routes/+layout.svelte](app/src/routes/+layout.svelte#L1).
- Toast notifications use the context-based state from [app/src/lib/toast-state.svelte.ts](app/src/lib/toast-state.svelte.ts#L1).
- Shared table controls live in `app/src/components/table/`.
- Most game-specific UI is under `app/src/components/games/<game>/`.

## Current Game-Specific Notes

### Wortiger

- Word lists are split by length-specific tables: `wortliste_4`, `wortliste_5`, `wortliste_6`, `wortliste_7`
- Game records live in `wortiger_games`
- Validation and helper logic live under `app/src/lib/games/wortiger*`
- Word-list ordering is expected to come from database collation on `word`
- CSV export for the word list fetches the full filtered dataset, not just the current page

### Wortgeflecht

- Dictionary words live in the `dictionary` table
- Game data is spread across `game`, `game_word`, and `game_letter`
- The local seed dictionary is defined in [docker/init/init-db.sql](docker/init/init-db.sql#L68904)
- Dictionary ordering is expected to come from database collation on `word`
- If seed changes are made, existing local Docker volumes must be recreated to re-run init SQL:

```bash
docker compose down -v
docker compose up --build
```

## Testing

Primary commands from `app/`:

- `npm run dev`
- `npm run build`
- `npm run check`
- `npm run lint`
- `npm run test:unit`

Test setup:

- Vitest config is in [app/vite.config.ts](app/vite.config.ts#L14)
- Jest DOM setup is in [app/vitest-setup.js](app/vitest-setup.js#L1)

Useful test locations:

- `app/src/lib/__tests__`
- `app/src/components/__tests__`

## High-Value Edit Hotspots

When changing behavior, these are usually the first files to inspect:

- [app/src/config/games.config.ts](app/src/config/games.config.ts)
- [app/src/lib/queries.ts](app/src/lib/queries.ts)
- [app/src/lib/postgrest-client.ts](app/src/lib/postgrest-client.ts)
- [app/src/components/GameTableWrapper.svelte](app/src/components/GameTableWrapper.svelte)
- [app/src/components/GenericDashboardTable.svelte](app/src/components/GenericDashboardTable.svelte)

## Guidance For Future Agents

- Keep new list UIs paginated at the server level.
- Reuse `requestPostgrest`, `buildQueryParams`, and `pg` rather than building fetch URLs manually.
- Prefer database collation for language-aware ordering when pagination depends on stable sort order; do not introduce read views for sorting unless collation is not viable.
- Prefer adding focused component or helper tests when introducing query or pagination behavior.
- If a change depends on SQL seed data, document whether Docker volumes must be recreated.
- Preserve the existing game-by-game structure instead of inventing a new abstraction layer unless there is a clear cross-game benefit.
