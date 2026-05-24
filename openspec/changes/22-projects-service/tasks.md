# 22 · Projects service

Gate: all service unit tests pass; `SlugConflictError` thrown on duplicate slug; `deleteProject` returns correct counts.

- [ ] 1.1 Create `packages/services/src/projects.ts`:

  `createProject({ name, slug, defaultBranch }, callerId)`:
  - `slugExists(slug)` → throw `SlugConflictError` if true
  - `projectsRepo.create(...)` → project
  - `variantsRepo.create({ projectId, name: "default", browser: "chromium", viewportWidth: 1280, viewportHeight: 800 })` → default variant
  - Return project

  `updateProject(id, patch, callerId)`:
  - If patch includes `slug`: check `slugExists` → `SlugConflictError`
  - `projectsRepo.update(id, patch)`

  `deleteProject(id, callerId)`:
  - Fetch build/snapshot/diff/baseline counts (for confirmation dialog)
  - `projectsRepo.delete(id)` — cascade handles DB rows
  - Fire-and-forget: `storageRepo.deletePrefix(`projects/${id}/`)` (don't await — don't block response)
  - Return `{ buildCount, snapshotCount, diffCount }` counts

  `addVariant(projectId, data, callerId)`:
  - `variantsRepo.countByProject(projectId)` → throw `LimitExceededError` if ≥ 10
  - `variantsRepo.create({ projectId, ...data })`

  `removeVariant(variantId, callerId)`:
  - `variantsRepo.delete(variantId)`

- [ ] 1.2 Export custom error classes from `packages/services/src/errors.ts`: `SlugConflictError`, `LimitExceededError`, `SelfActionError`, `ForbiddenError`

- [ ] 1.3 Unit tests (mocked repos):
  - `createProject`: duplicate slug → `SlugConflictError`; success → returns project + creates default variant
  - `deleteProject`: returns correct counts; calls `storageRepo.deletePrefix`
  - `addVariant`: 10 variants → `LimitExceededError`
  - `removeVariant`: calls `variantsRepo.delete`
