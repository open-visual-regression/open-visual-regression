# Diff threshold config

Gate: `pnpm test` and `pnpm check-types` pass; CLI sends a resolved `diffThreshold` on every `createBuild`; a story's `parameters.ovr.diffThreshold` overrides the build default for that story's snapshots; `diffSnapshot` decides `not_required`/`needs_review` from `snapshot.diffThreshold`; the per-project diff threshold field is gone from the DB, API, and UI.

- [x] 1.1 `apps/cli/src/defineConfig.ts`: add `diffThreshold?: number` to `OvrConfig` and to `OvrStoryParameters` (mirrors `viewports`/story override docs).

- [x] 1.2 `apps/cli/src/config.ts`: factor the existing `jiti` config-file load out of `loadViewports` into a shared `loadOvrConfig(cwd, configPath)` helper; add `export const DEFAULT_DIFF_THRESHOLD = 0.05` and `loadDiffThreshold(cwd, configPath)` that reads `diffThreshold` from the loaded config, validates `0 < value <= 1` (throw a clear `ovr.config: "diffThreshold" must be...` error otherwise), and falls back to `DEFAULT_DIFF_THRESHOLD`.

- [x] 1.3 `apps/cli/src/__tests__/loadViewports.test.ts` stays as-is; add `apps/cli/src/__tests__/loadDiffThreshold.test.ts` covering: no config file → default; config sets a valid value → that value; config sets an out-of-range value → throws.

- [x] 1.4 `apps/cli/src/commands/snapshot/storybook.ts`: call `loadDiffThreshold(process.cwd(), options.config)` alongside `loadViewports` and pass `diffThreshold` to `client.builds.createBuild`.

- [x] 1.5 `packages/api/src/contracts/builds.ts`: add `diffThreshold: z.number().min(0.01).max(1).optional()` to `createBuildInputSchema`.

- [x] 1.6 `packages/db/src/schemas/builds.ts`: add `diffThreshold: numeric("diff_threshold", { mode: "number", precision: 3, scale: 2 }).notNull()` to `snapshots`. `packages/db/src/schemas/schemas.ts`: remove `diffThreshold` from `projects`. Run `pnpm db:generate`; commit the migration.

- [x] 1.7 `packages/services/src/captureStrategies.ts`: rename `OvrStoryParameters`/`readOvrStoryParameters` usage stays the same shape-wise — add `diffThreshold?: number` to the `OvrStoryParameters` type so the existing `page.evaluate(readOvrStoryParameters, targetId)` call also returns it.

- [x] 1.8 `packages/services/src/storyViewports.ts`: change `OverrideEntry`/`readStoryViewportOverrides` to carry the whole `OvrStoryParameters` object (not just `.viewports`) keyed by target id; add `resolveTargetDiffThreshold(buildDefault: number, override: OvrStoryParameters | undefined): number` returning `override?.diffThreshold ?? buildDefault`. Update `resolveTargetViewports` call sites for the new override shape.

- [x] 1.9 `packages/services/src/extract.ts`: `extractBuild` takes a new `diffThreshold: number` (build default) param; for each target, resolve its threshold via `resolveTargetDiffThreshold` and set it on every snapshot row created for that target.

- [x] 1.10 `packages/queue` + `packages/services/src/lib/queue.ts` + `apps/worker/src/handlers/extract.ts`: add `diffThreshold` to the extract job payload type and thread it from `enqueueExtract` through to the `extractBuild` call.

- [x] 1.11 `packages/services/src/builds.ts`: `CreateBuildInput` gains `diffThreshold: number`; pass it through to `enqueueExtract`.

- [x] 1.12 `apps/web/lib/router/builds.ts`: pass `input.diffThreshold ?? DEFAULT_DIFF_THRESHOLD` (re-export or duplicate the `0.05` constant per package boundary — services shouldn't import the CLI package) to `createBuildService`.

- [x] 1.13 `packages/services/src/snapshots.ts`: `diffSnapshot` — drop the `project.diffThreshold` read; compare `diffPercent` against `snapshot.diffThreshold` at the line that currently reads `diffPercent <= project.diffThreshold`.

- [x] 1.14 `packages/api/src/contracts/projects.ts`: remove `diffThreshold` from `projectSchema`, `addProjectInputSchema`, `updateProjectInputSchema`.

- [x] 1.15 `apps/web/lib/router/projects.ts`: drop `diffThreshold` from create/update handlers.

- [x] 1.16 UI: remove the diff threshold field from `apps/web/app/(authenticated)/projects/new/_components/new-project-form/NewProjectForm.tsx` and `.../[projectId]/settings/_components/update-project-form/UpdateProjectForm.tsx`; remove the threshold display from `apps/web/app/(authenticated)/projects/_components/ProjectCardListItem.tsx`.

- [x] 1.17 Update fixtures/mocks that set `diffThreshold` on projects (`packages/services/src/__tests__/fixtures.ts`, `packages/mocks/src/project.ts`, `packages/db/src/__tests__/fixtures.ts`, `apps/worker/src/__tests__/fixtures.ts`) to instead set it on snapshot fixtures; update integration tests referencing project-level `diffThreshold` (`packages/db/src/__tests__/builds.integration.test.ts`, `apps/web/lib/router/__tests__/{apiKeys,builds,diffs,projects,snapshots}.integration.test.ts`, `apps/web/app/api/storage/[...path]/__tests__/route.integration.test.ts`, `UpdateProjectForm.test.tsx`, settings `page.test.tsx`).

- [x] 1.18 `packages/services/src/__tests__/extract.integration.test.ts`: add coverage for per-story `diffThreshold` override resolving onto the created snapshots, and for the build default applying when no story override is set.
