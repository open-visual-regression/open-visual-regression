# 21 · Project schema + repositories

Gate: `drizzle-kit generate` adds a capture configuration migration; existing integration tests (apps/web, against real Postgres) continue to pass.

The `projects` table, its initial migration, and a basic repository (`getProject`, `listProjects`, `addProject`) already exist — see `packages/db/src/schemas/schemas.ts` and `packages/db/src/repository/projects.ts`. Projects are identified by `id` (uuid v7) and scoped to an `organizationId`; there is no `slug` — routes and lookups use `id` directly (e.g. `/projects/[projectId]`).

New repository functions added here are exercised through the router's integration tests (`apps/web/lib/router/__tests__`) once `c25-project-settings` and `c26-delete-project` add the corresponding endpoints.

- [x] 1.1 `packages/db/src/repository/projects.ts` — add:
  - `updateProject(id, patch)` → updates the row, returns the project (used by `c25-project-settings`)
  - `deleteProject(id)` → deletes the row; cascading FKs remove related rows once they exist (used by `c26-delete-project`)

- [x] 1.2 Add a `captureConfigurations` table to `packages/db/src/schemas/schemas.ts`, following the existing `projects` table conventions (`uuidv7` default id, `pgTable`):
  ```ts
  captureConfigurations: id (uuid pk, default uuidv7), projectId (uuid notNull, FK → projects.id onDelete cascade),
            name (varchar notNull), browser (varchar notNull default "chromium"),
            viewportWidth (integer notNull default 1280), viewportHeight (integer notNull default 800)
  ```
  Run `drizzle-kit generate`; commit migration

- [x] 1.3 Create `packages/db/src/repository/captureConfigurations.ts`:
  - `findByProject(projectId)` → captureConfiguration[]
  - `addCaptureConfiguration(data)` → captureConfiguration
  - `deleteCaptureConfiguration(id)` → void
  - `countByProject(projectId)` → number
