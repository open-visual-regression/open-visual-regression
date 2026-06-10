# 21 · Project schema + repositories

Gate: `drizzle-kit generate` adds a variant migration; integration tests pass against real Postgres.

The `projects` table, its initial migration, and a basic repository (`getProject`, `listProjects`, `addProject`) already exist — see `packages/db/src/schemas/schemas.ts` and `packages/db/src/repository/projects.ts`. Projects are identified by `id` (uuid v7) and scoped to an `organizationId`; there is no `slug` — routes and lookups use `id` directly (e.g. `/projects/[projectId]`).

- [x] 1.1 Install `testcontainers` in `packages/db`; create `packages/db/src/__tests__/helpers/containers.ts`:
  - `startPostgres()` → starts `postgres:16-alpine`; returns `{ connectionString: string, stop: () => Promise<void> }`
  - Remove `passWithNoTests: true` from `packages/db/vitest.config.ts`
  - Add Docker socket access to `.github/workflows/ci.yml` test job (so Testcontainers can reach the Docker daemon)

- [x] 1.2 `packages/db/src/repository/projects.ts` — add:
  - `updateProject(id, patch)` → updates the row, returns the project (used by `c25-project-settings`)
  - `deleteProject(id)` → deletes the row; cascading FKs remove related rows once they exist (used by `c26-delete-project`)

- [x] 1.3 Add a `variants` table to `packages/db/src/schemas/schemas.ts`, following the existing `projects` table conventions (`uuidv7` default id, `pgTable`):
  ```ts
  variants: id (uuid pk, default uuidv7), projectId (uuid notNull, FK → projects.id onDelete cascade),
            name (varchar notNull), browser (varchar notNull default "chromium"),
            viewportWidth (integer notNull default 1280), viewportHeight (integer notNull default 800)
  ```
  Run `drizzle-kit generate`; commit migration

- [x] 1.4 Create `packages/db/src/repository/variants.ts`:
  - `findByProject(projectId)` → variant[]
  - `addVariant(data)` → variant
  - `deleteVariant(id)` → void
  - `countByProject(projectId)` → number

- [x] 1.5 Integration tests (`src/__tests__/integration/projects.test.ts`) using Testcontainers Postgres:
  - `addProject` → `getProject` returns it
  - `updateProject` persists changes
  - `addVariant` → `findByProject` returns it
  - `deleteProject` cascades to variants
