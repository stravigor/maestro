# Maestro

A small, opinionated showcase for the [Strav](https://github.com/stravigor/strav) framework — a multi-tenant project / sprint / story manager with a kanban story board and a per-project backlog.

## Stack

- [Bun](https://bun.sh) runtime
- [Strav](https://github.com/stravigor/strav) (kernel, http, view, database, cli, testing)
- PostgreSQL with row-level security for tenant isolation
- Vue 3 islands rendered into server-side `.strav` templates
- SCSS

## Domain

- **Workspace** — the tenant. Owns everything below it.
- **User** — global; joins workspaces through the `workspace_user` pivot.
- **Workflow** — a workspace-level set of kanban columns (e.g. `backlog`, `in_progress`, `done`). Attached to a project.
- **Project** — groups sprints and stories under a workspace.
- **Sprint** — time-boxed group of stories within a project (start/end dates).
- **Story** — the unit of work; lives in a workflow column and may belong to a sprint or sit in the backlog.
- **Comment** — author + body, attached to a story.

Tenanted tables (`workflow`, `project`, `sprint`, `story`, `comment`) carry a `workspace_id` column with an RLS policy. Every authenticated request resolves the current workspace from the session and runs queries inside `withTenant(workspace.id, ...)`.

## Try it with Docker

Quickest way to kick the tires — only Docker is needed locally:

```sh
# In a fresh directory:
curl -O https://raw.githubusercontent.com/stravigor/maestro/main/docker-compose.yml
docker compose up
```

Compose pulls the source from `https://github.com/stravigor/maestro` at build time, starts a Postgres 17 container, creates the two RLS roles via `bun strav db:setup-roles`, runs `seed --fresh`, and starts the app at [http://localhost:3000](http://localhost:3000). First boot takes a minute or two; subsequent starts skip the migration/seed step.

Override the build ref with `BUILD_REF=<branch|tag|sha> docker compose up --build`. To start clean, `docker compose down -v` wipes the database volume.

If you upgrade the strav version and bootstrap fails with `must be owner of table ...`, the persisted volume is from an older schema the new app role can't drop. Run `docker compose down -v` and bring it back up — the bootstrap-marker lives inside the container, but the DB volume outlives container rebuilds, so a fresh image can stare at a half-old schema.

The compose file ships demo credentials and a placeholder `APP_KEY`. Replace both before running anywhere that matters.

## Setup (without Docker)

### Requirements

- Bun ≥ 1.3
- PostgreSQL ≥ 14 (RLS-friendly)

### 1. Database roles

This app uses two Postgres roles — one normal app role (RLS applies) and one bypass role (for migrations and tenant admin):

```sh
createuser -P strav_app          # app role (no special attributes)
createuser -P --replication strav_admin   # or however you prefer; needs BYPASSRLS
psql -c "ALTER ROLE strav_admin BYPASSRLS"
createdb -O strav_admin maestro
```

### 2. `.env`

```sh
APP_ENV=local
APP_KEY=<run 'bun strav generate:key' to fill this>

DB_HOST=127.0.0.1
DB_PORT=5432
DB_USER=strav_app
DB_PASSWORD=<password>
DB_DATABASE=maestro

DB_BYPASS_USER=strav_admin
DB_BYPASS_PASSWORD=<password>
```

### 3. Install + migrate + seed

```sh
bun install
bun strav generate:key       # writes APP_KEY into .env
bun strav fresh              # drops everything, regenerates migrations, runs them
bun strav seed --fresh       # same + runs seeders (creates demo workspace + user)
```

### 4. Run

```sh
bun run dev                  # bun --hot index.ts
```

Then open [http://localhost:3000](http://localhost:3000).

Demo credentials (after `seed --fresh`):

```
user:     demo@strav.dev
password: demo1234
```

## Layout

```
app/
  controllers/
    api/       — REST controllers under /api
    pages/     — page controllers rendering .strav templates
  middleware/  — workspace() resolves the active tenant; projects() loads the sidebar list
  models/      — BaseModel subclasses with @primary, @reference, @associate, @cast
  validators/  — input rule sets matched to controllers
  lib/         — small helpers (e.g. renderPage)
config/        — strav configuration (app, http, database, view, session, encryption)
database/
  schemas/     — defineSchema(...) — single source of truth for tables
  migrations/  — strav diffs schemas against the live DB to generate these
  seeders/     — local-env seeders
resources/
  views/
    layouts/   — app, auth
    pages/     — one .strav per page route
    partials/  — sidebar, navbar
  islands/     — Vue 3 components mounted via <vue:foo/index />
  css/         — SCSS, compiled by IslandBuilder into public/css
start/
  providers.ts — app boot order
  routes/      — web.ts, api.ts
strav.ts       — CLI entrypoint (run `bun strav <command>`)
```

## Routes

### Pages (HTML)

| Route                                     | Page                                              |
| ----------------------------------------- | ------------------------------------------------- |
| `/`                                       | Stories kanban (project picker)                   |
| `/dashboard`                              | Dashboard                                         |
| `/projects`                               | Manage projects (create / archive / pick workflow) |
| `/sprints`                                | All sprints across all projects (kanban)          |
| `/workflow`                               | Manage workflows (columns)                        |
| `/projects/:projectId/stories`            | Story kanban scoped to one project (drag-and-drop) |
| `/projects/:projectId/sprints`            | Sprint kanban for one project                     |
| `/projects/:projectId/backlog`            | Unscheduled stories as a table                    |

### API (JSON, under `/api`)

`session()` + `csrf()` middleware. Auth-required routes also pass through `auth()` and `workspace()`.

| Route                                         | Verbs                          |
| --------------------------------------------- | ------------------------------ |
| `/auth/login`                                 | POST (public)                  |
| `/users`, `/workspaces`                       | full CRUD (global)             |
| `/workflows`, `/projects`                     | full CRUD (workspace-scoped)   |
| `/sprints`, `/stories`                        | GET (workspace-level read)     |
| `/projects/:projectId/sprints`                | full CRUD                      |
| `/projects/:projectId/stories`                | full CRUD                      |
| `/stories/:storyId/comments`                  | full CRUD                      |

Tenant scope comes from the session, not the URL — `:projectId` and `:storyId` are filters, not authorization signals.

## Useful commands

```sh
bun run dev              # start dev server with hot reload
bun run typecheck        # tsc --noEmit
bun test                 # run tests in tests/
bun strav fresh          # rebuild DB from schemas
bun strav seed --fresh   # rebuild DB + seed
bun strav generate:api   # regenerate API scaffolding from schemas (overwrites)
bun strav generate:models
bun strav migrate        # apply pending migrations
```

## Notes

- The `bypass` Postgres role must have `BYPASSRLS`. Migrations and tenant admin go through it; app traffic does not.
- `bun strav fresh` is gated to `APP_ENV=local`.
- Hot reload is wired with `bun --hot`. The framework serializes the close→open of DB pools across reloads, so `max_connections` shouldn't trip in normal dev.
