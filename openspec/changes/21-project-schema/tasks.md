# 21 · Project schema + repositories

Gate: `drizzle-kit generate` adds project/variant migration; integration tests pass against real Postgres.

- [ ] 1.1 Create `packages/db/src/schema/projects.ts`:
  ```ts
  project: id (uuid pk default gen_random_uuid()), name (text notNull), slug (text notNull unique),
           defaultBranch (text notNull default "main"), diffThreshold (real notNull default 0.1),
           createdAt (timestamp notNull defaultNow()), createdBy (text notNull, FK → user.id)

  variant: id (uuid pk), projectId (uuid notNull FK → project.id onDelete cascade),
           name (text notNull), browser (text notNull default "chromium"),
           viewportWidth (int notNull default 1280), viewportHeight (int notNull default 800)
  ```
- [ ] 1.2 Run `drizzle-kit generate`; commit migration
- [ ] 1.3 Create `packages/db/src/repositories/projects.ts`:
  - `findAll()` → all projects ordered by name
  - `findBySlug(slug)` → project or undefined
  - `findById(id)` → project or undefined
  - `slugExists(slug)` → boolean
  - `create(data)` → project
  - `update(id, patch)` → project
  - `delete(id)` → void
- [ ] 1.4 Create `packages/db/src/repositories/variants.ts`:
  - `findByProject(projectId)` → variant[]
  - `create(data)` → variant
  - `delete(id)` → void
  - `countByProject(projectId)` → number
- [ ] 1.5 Export all new repositories + schema from `packages/db/src/index.ts`
- [ ] 1.6 Integration tests (`src/__tests__/integration/projects.test.ts`) using Testcontainers Postgres:
  - Create project → findBySlug returns it
  - slugExists returns true for existing slug, false for new
  - Create variant → findByProject returns it
  - Delete project cascades to variants
