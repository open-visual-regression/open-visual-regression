## 1. Monorepo Foundation

- [x] 1.1 Delete `apps/docs`, reset `apps/web` and `packages/ui` to blank stubs, update `pnpm-workspace.yaml` and `turbo.json`
- [x] 1.2 Create `apps/worker` package with `package.json`, `tsconfig.json`, and empty entrypoint
- [x] 1.3 Create `apps/cli` package with `package.json` (`name: "@ovr/cli"`, `bin` field), `tsconfig.json`, and empty entrypoint
- [x] 1.4 Create `packages/db` with `package.json` and `tsconfig.json`
- [x] 1.5 Create `packages/services` with `package.json` and `tsconfig.json`
- [x] 1.6 Create `packages/api` with `package.json` and `tsconfig.json`
- [x] 1.7 Create `packages/queue` with `package.json` and `tsconfig.json`
- [x] 1.8 Create `packages/storage` with `package.json` and `tsconfig.json`
- [x] 1.9 Wire all new packages into `pnpm-workspace.yaml` and verify `pnpm install` resolves correctly
- [x] 1.10 Configure `turbo.json` pipeline: `build`, `dev`, `lint`, `format`, `check-types`, `test`, `storybook`, `build-storybook` tasks with correct `dependsOn` and output caching
- [x] 1.11 Rename `packages/typescript-config` → `@ovr/typescript-config` and `packages/eslint-config` → `@ovr/eslint-config`; update all `package.json` references across the monorepo

## 2. Toolchain

- [ ] 2.1 Remove ESLint and Prettier dependencies from all packages; delete config files
- [ ] 2.2 Install Oxlint at repo root; create `oxlint.json` with `react`, `typescript`, `import`, `unicorn` plugins enabled
- [ ] 2.3 Install Oxfmt at repo root; create `oxfmt.toml` with Tailwind class sorting enabled
- [ ] 2.4 Add `lint` and `format` scripts to each `package.json` and to root; wire into `turbo.json`
- [ ] 2.5 Verify `turbo lint` and `turbo format` run cleanly across all packages

## 3. Testing + CI Infrastructure

- [ ] 3.1 Install Vitest at repo root; create `vitest.workspace.ts` covering all packages and apps; add `test` script to root `package.json`
- [ ] 3.2 Configure per-package Vitest: unit tests (`*.test.ts` co-located) use `jsdom` for web, `node` for server packages; integration tests (`__tests__/integration/`) use `node` environment
- [ ] 3.3 Install `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom` in `apps/web`; add Vitest setup file extending `jest-dom` matchers
- [ ] 3.4 Install `testcontainers` in `packages/db`, `packages/queue`, `packages/storage`; create `__tests__/helpers/containers.ts` in each with typed helpers for starting/stopping Postgres, Valkey, and MinIO containers
- [ ] 3.5 Add `test` script to each package `package.json`; wire `test` into `turbo.json` with `dependsOn: ["^build"]`
- [x] 3.6 Create `.github/workflows/ci.yml`: five jobs (`lint`, `format-check`, `type-check`, `build`, `test`), triggered on push to `main` and PRs targeting `main`, `ubuntu-latest`, pnpm cache, Node 22 — `build` and `check-types` active; `lint`, `format-check`, `test` stubbed (`if: false`) until toolchain/vitest PRs
- [ ] 3.7 Configure GitHub branch protection on `main`: require all five CI status checks to pass

## 4. Database Schema

- [ ] 4.1 Install Drizzle ORM, `drizzle-kit`, and `postgres` driver in `packages/db`
- [ ] 4.2 Configure `drizzle.config.ts` pointing to `DATABASE_URL`
- [ ] 4.3 Run `better-auth generate` to produce Better Auth schema; commit generated migration
- [ ] 4.4 Define Drizzle schema for `team` table (schema-only, no UI)
- [ ] 4.5 Define Drizzle schema for `project` table (id, name, slug, defaultBranch, createdAt)
- [ ] 4.6 Define Drizzle schema for `variant` table (id, projectId, name, browser, viewportWidth, viewportHeight)
- [ ] 4.7 Define Drizzle schema for `build` table (id, projectId, branch, commitSha, status, storybookPath, createdAt, createdBy)
- [ ] 4.8 Define Drizzle schema for `snapshot` table (id, buildId, variantId, storyId, status, imagePath, hasRenderError)
- [ ] 4.9 Define Drizzle schema for `snapshotLog` table (id, snapshotId, level, message, timestamp)
- [ ] 4.10 Define Drizzle schema for `diff` table (id, snapshotId, baselineId, status, diffImagePath, pixelDiffCount, reviewerId, reviewedAt)
- [ ] 4.11 Define Drizzle schema for `baseline` table (id, projectId, variantId, storyId, snapshotId, approvedAt, approvedBy)
- [ ] 4.12 Generate and verify initial Drizzle migration
- [ ] 4.13 Create repository functions in `packages/db/repositories/` for each entity (CRUD + domain queries, no business logic)
- [ ] 4.14 Write Testcontainers integration tests for all repositories against a real Postgres container

## 5. Infrastructure Packages

- [ ] 5.1 Implement `packages/storage`: S3-compatible client wrapping RustFS using `@aws-sdk/client-s3`; expose `uploadFile`, `getFileStream`, `deleteFile`, `getPresignedUrl`
- [ ] 5.2 Write Testcontainers integration tests for `packages/storage` against a real MinIO container
- [ ] 5.3 Implement `packages/queue`: define BullMQ job payload types for `snapshot:capture`, `snapshot:diff`, `build:finalize`; export queue producer functions (`enqueueCapture`, `enqueueDiff`, `enqueueFinalize`)
- [ ] 5.4 Write Testcontainers integration tests for `packages/queue` producers against a real Valkey container

## 6. Better Auth Setup

- [ ] 6.1 Install Better Auth in `apps/web`; configure with Admin, API Key, Organization, and Rate Limiting plugins
- [ ] 6.2 Create `auth.ts` in `apps/web` with plugin config, `sendInvitationEmail` callback (stores invite URL for display in admin UI — no email sending), and `adminUserIds` bootstrap option
- [ ] 6.3 Create Next.js middleware: redirect to `/setup` if zero users exist; redirect unauthenticated users to `/login` for protected routes
- [ ] 6.4 Create Better Auth client (`auth-client.ts`) for use in Server Actions and Server Components
- [ ] 6.5 Verify Better Auth schema matches generated migration (re-generate if needed)

## 7. oRPC API

- [ ] 7.1 Install oRPC in `packages/api`; create base router with API key auth middleware
- [ ] 7.2 Implement auth middleware: extracts Bearer token from `Authorization` header, calls `auth.api.verifyApiKey()`, attaches user to context; returns UNAUTHORIZED on failure
- [ ] 7.3 Implement `builds` router: `createBuild` procedure (Zod input: projectSlug, branch, commitSha, stories array), returns buildId
- [ ] 7.4 Implement `builds` router: `getBuildStatus` procedure (Zod input: buildId), returns build status and review URL
- [ ] 7.5 Mount oRPC router in `apps/web` at `/api/rpc/[...path]`
- [ ] 7.6 Write unit tests for oRPC routers with mocked services; write unit tests for auth middleware (valid key, missing key, invalid key)

## 8. Services Layer

- [ ] 8.1 Implement `packages/services/builds.ts`: `createBuild` (create Build + Snapshot records, enqueue capture jobs), `finalizeBuild` (aggregate diff statuses → update build status)
- [ ] 8.2 Implement `packages/services/snapshots.ts`: `captureSnapshot` (Playwright screenshot + logs → storage), `diffSnapshot` (Pixelmatch vs baseline → storage + Diff record)
- [ ] 8.3 Implement `packages/services/baselines.ts`: `getBaseline(projectId, variantId, storyId)`, `promoteBaseline(diffId)` (only when build is on default branch)
- [ ] 8.4 Implement `packages/services/reviews.ts`: `approveDiff(diffId, reviewerId)`, `rejectDiff(diffId, reviewerId)`, recalculate build status after review action
- [ ] 8.5 Implement `packages/services/invitations.ts`: `createInvitation(email, adminId)`, `acceptInvitation(invitationId, name, password)`
- [ ] 8.6 Implement `packages/services/projects.ts`: `createProject`, `deleteProject` (cascading delete of builds, snapshots, diffs, baselines, storage files), `addVariant`, `removeVariant`
- [ ] 8.7 Write unit tests for all services with mocked repositories; cover happy path, error states, and RBAC enforcement

## 9. Worker

- [ ] 9.1 Install BullMQ and `playwright` in `apps/worker`
- [ ] 9.2 Create worker entrypoint: connects to Valkey, registers job handlers for `snapshot:capture`, `snapshot:diff`, `build:finalize`
- [ ] 9.3 Implement `snapshot:capture` handler: calls `captureSnapshot` service, on completion checks if all captures for build are done, enqueues diff jobs
- [ ] 9.4 Implement `snapshot:diff` handler: calls `diffSnapshot` service, on completion checks if all diffs for build are done, enqueues finalize job
- [ ] 9.5 Implement `build:finalize` handler: calls `finalizeBuild` service
- [ ] 9.6 Configure BullMQ retry policies: `snapshot:capture` — 5 attempts, exponential backoff 2s base; `snapshot:diff` — 3 attempts, exponential backoff 2s base; `build:finalize` — 3 attempts, fixed 1s backoff
- [ ] 9.7 Handle BullMQ `failed` event (all retries exhausted): update Snapshot to `error` or Diff to `error`; re-trigger build finalization check
- [ ] 9.8 Write unit tests for job handlers with mocked services; verify retry policy config and error state transitions
- [ ] 9.9 Add Playwright browser installation step to Dockerfile worker stage

## 10. CLI

- [ ] 10.1 Install `commander`, oRPC client, and `zod` in `apps/cli`
- [ ] 10.2 Create `ovr.config.ts` schema with Zod: `serverUrl`, `apiKey` (optional, falls back to `OVR_API_KEY` env)
- [ ] 10.3 Implement config loader: reads `ovr.config.ts` from project root, validates with Zod
- [ ] 10.4 Implement `ovr snapshot` command: validates `--storybook-dir` exists, reads config, calls `createBuild` oRPC, uploads storybook static to storage, polls `getBuildStatus` every 5s
- [ ] 10.5 Implement polling loop: exits 0 on `passed`, exits 1 on `needs_review` or `error`; prints review URL on non-pass
- [ ] 10.6 Write unit tests for config loader (valid config, missing fields, env var fallback) and polling logic (exit codes, review URL output)
- [ ] 10.7 Add `package.json` build script to produce a standalone CJS bundle; verify `npx @ovr/cli snapshot` works

## 11. Object Storage Image Serving

- [ ] 11.1 Implement `getPresignedUrl(path, ttlSeconds)` in `packages/storage`: generates a presigned GET URL via RustFS S3 API with configurable TTL (default 60s)
- [ ] 11.2 Create Next.js route `app/api/storage/[...path]/route.ts`: validates session, checks project membership from path, calls `getPresignedUrl`, returns 302 redirect to presigned URL
- [ ] 11.3 Write unit tests for storage route: unauthenticated → 401, unauthorized project → 403, valid session → 302 with presigned URL

## 12. UI Primitives (Storybook + design system)

- [ ] 12.1 Install Storybook 10 in `packages/ui` using `pnpm create storybook@latest`; select React Vite framework; configure `.storybook/main.ts` (stories glob: `src/**/*.stories.tsx`, addon-essentials) and `.storybook/preview.ts` (import tokens + globals CSS, dark background decorator)
- [ ] 12.2 Create `src/styles/tokens.css`: full OVR design token set — all CSS custom properties for color (dark + `[data-theme="light"]` overrides), type scale, spacing, radii, shadows, motion, layout (`--topbar-h`, `--sidebar-w`, etc.), and `--pixel-grid` motif. Copy verbatim from `openspec/designs/screens/.../kit/colors_and_type.css`. Copy JetBrains Mono TTF files from `openspec/designs/design-system/.../fonts/` into `packages/ui/src/styles/fonts/` and update `@font-face` paths accordingly
- [ ] 12.3 Create `src/styles/globals.css`: box-sizing reset, `html`/`body` base styles, link/button/input resets, `::selection`, shimmer keyframe + `.shimmer` class, focus-visible outline using `--accent-primary-ring`
- [ ] 12.4 Build `Icon` — thin `lucide-react` wrapper; enforces `strokeWidth={1.5}`, `strokeLinecap="square"`, `strokeLinejoin="miter"`; accepts any `LucideIcon` + `size`; write story showing all icons in use
- [ ] 12.5 Build `StatusIcon` — maps `StatusKind` (`changed` | `passed` | `pending` | `stale` | `approved` | `rejected`) to Lucide icon + CSS token color (`AlertCircle`/amber, `CircleCheck`/green, `LoaderCircle`/blue, `TriangleAlert`/grey, `CircleX`/red); write story showing all states
- [ ] 12.6 Build `Button` — variants: `primary` | `secondary` | `ghost` | `destructive`; sizes: `sm` (28px) | `md` (32px) | `lg` (40px); optional `icon` (leading) and `iconRight` (trailing) props; `disabled` state; hover + press colors via JS state (`"use client"`); write story with all variant × size combinations
- [ ] 12.7 Build `Badge` — bracketed status indicator; tones: `pass` | `fail` | `pending` | `stale` | `accent` | `neutral`; `filled` boolean; 2px radius; 10px 600-weight uppercase letter-spacing 0.08em; write story with all tones, both filled and outlined
- [ ] 12.8 Build `KeyHint` — keyboard shortcut chip; 18px height, `--bg-inset` background, `--border-subtle` border, 2px radius; write story with single-key and multi-char examples
- [ ] 12.9 Build `Field` — labeled input; `label` (uppercase 10px), 32px input, focus ring using `--accent-primary-ring` + `--accent-primary` border, optional `error` string shown below; `"use client"` for focus state; write story (default, focused, error)
- [ ] 12.10 Build `DiffStrip` — 3px `alignSelf: stretch` colored bar; statuses: `changed` (amber) | `pass` (green) | `fail` (red) | `pending` (blue) | `stale` (grey); write story showing all statuses in a row context
- [ ] 12.11 Build `OvrMark` — amber vertical bar SVG; `size` prop controls height; width = `Math.max(3, Math.round(size / 6))`; write story at sizes 16/22/32/48
- [ ] 12.12 Build `Alert` — inline feedback banner; tones: `success` | `accent` | `destructive` | `neutral`; `title` prop + `children` body; optional `dismissable` (default true); write story with all tones
- [ ] 12.13 Build `Toast` — bottom-positioned notification card; tones: `success` | `accent` | `neutral`; `title` + `children`; optional `action` (`{ label, onClick }`); auto-dismiss after 4s (cancellable); `"use client"`; write story with all tones + action variant
- [ ] 12.14 Build `SegmentedProgress` — horizontal bar split into colored segments by `segments` array (`{ label, count, color }`); `title`, `subtitle`, `summary` text props; configurable `height` (default 8px); write story with pass/changed/failed/pending breakdown
- [ ] 12.15 Create `src/index.ts` barrel exporting all primitives and their TypeScript types; add `storybook` and `build-storybook` scripts to package; verify `pnpm storybook` starts clean

## 13. First-Run Wizard

- [ ] 13.1 Create `/setup` page: form for org name, admin email, admin password
- [ ] 13.2 Create `actions.ts` co-located with `/setup`: validate input, create organization via Better Auth, create admin user, sign in, redirect to dashboard
- [ ] 13.3 Update middleware: detect zero users by querying DB; if none, redirect to `/setup`
- [ ] 13.4 Write component tests for setup page: form validation, successful submission flow, redirect when setup already complete

## 14. Auth UI

- [ ] 14.1 Create `/login` page with email + password form and Server Action
- [ ] 14.2 Create `/invite/[invitationId]` page: validate invitation (not expired, not used), show "Create account" form
- [ ] 14.3 Create invite acceptance Server Action: `createUser` + `signIn` + `acceptInvitation` atomically; redirect to dashboard
- [ ] 14.4 Create sign-out Server Action; add sign-out button to app layout
- [ ] 14.5 Write component tests for login page and invite page (expired token, already-used token, valid token)

## 15. User Management UI

- [ ] 15.1 Create `/admin/users` page (RSC): settings layout with sub-nav rail; users table (monogram avatar, name, email, role badge, joined, last-seen, actions menu); pending invitations table (email, invited-by, issued, expiry with `△` near-expiry warning, copy/cancel)
- [ ] 15.2 Create invite user modal + co-located Server Action: email field, role toggle (user/admin); on success display one-time invite URL in accent-tone Alert banner; banner states no email is sent
- [ ] 15.3 Create cancel invitation Server Action; copy invite URL action (client-side clipboard)
- [ ] 15.4 Create change role Server Action: promote/demote user; block self-role-change
- [ ] 15.5 Create deactivate user Server Action: bans user via Better Auth Admin plugin; block self-deactivation; deactivated rows shown at 50% opacity with `DEACTIVATED` fail-tone badge
- [ ] 15.6 Write component tests for user management page; write unit tests for role-change and deactivation service guards

## 16. API Key Management UI

- [ ] 16.1 Create `/settings/api-keys` page (RSC) inside settings layout: API keys table (name, `ovr_pk_•••` prefix, created, last-used; stale `△` indicator when never used)
- [ ] 16.2 Create API key generation form + Server Action: calls Better Auth API Key plugin; show full key (`ovr_pk_live_...`) once in accent-tone Alert reveal banner with copy button and CLI usage hint; banner states key cannot be retrieved again
- [ ] 16.3 Create revoke API key Server Action (X button per row)
- [ ] 16.4 Write component tests: key value shown once on creation, not shown on list view

## 17. Project Management UI

- [ ] 17.1 Create `/projects` page (RSC): responsive card grid (`minmax(320px, 1fr)`); cards show name, description, changed-count badge (filled amber), run count, baseline branch; empty state with dashed border + pixel-grid + `∅` glyph + "create first project" CTA
- [ ] 17.2 Create `/projects/new` page + co-located Server Action: name, slug (with `/` prefix, inline conflict error + disabled submit on duplicate), default branch; "next step" hint post-creation; redirect to settings on success
- [ ] 17.3 Create `/projects/[slug]/settings` page (RSC): tab nav (runs / settings / api / logs); settings tab shows general form (name, slug, default branch, diff threshold %) + variants table (name, browser, viewport, remove X); inline "add variant" row (name, browser select, w×h inputs)
- [ ] 17.4 Create add variant Server Action; delete variant Server Action
- [ ] 17.5 Create delete project confirmation dialog: shows build/snapshot/baseline/storage counts; requires typing project slug to enable confirm button; delete Server Action calls `deleteProject` service
- [ ] 17.6 Write component tests for project creation (duplicate slug error), settings tab navigation, and delete confirmation flow

## 18. Review UI

- [ ] 18.1 Create `/projects/[slug]/builds` page (RSC): table with DiffStrip, StatusIcon, run id, commit+message, branch, author, status text, age; filter tabs (all / changed / pass / fail / pending) with counts; baseline info line
- [ ] 18.2 Create `/projects/[slug]/builds/[buildId]` page (RSC): run header with DiffStrip, StatusIcon, id, badges, commit, branch, author, duration, age; `SegmentedProgress` bar; snapshot card grid (`minmax(280px, 1fr)`), 160px thumbnail with pixel-grid, `Δ N.NN%` badge; filter tabs (all / changed / pass); approve-all + reject-all buttons
- [ ] 18.3 Add Tanstack Query polling on build detail: polls `getBuildStatus` every 5s in non-terminal state, updates `SegmentedProgress` and snapshot cards live
- [ ] 18.4 Create diff viewer page `/projects/[slug]/builds/[buildId]/diffs/[diffId]`: toolbar with mode switcher (side / overlay / slider), overlay toggle (eye icon), approve/reject buttons; pixel-grid canvas; footer with `N of M changed`, J/K/A/R `KeyHint` chips, prev/next buttons
- [ ] 18.5 Implement all three diff modes: side-by-side (baseline shows `remove` regions, current shows `change`+`add`), overlay (all regions), slider (draggable amber divider, clip-path split)
- [ ] 18.6 Create approve diff Server Action + reject diff Server Action (co-located with diff page)
- [ ] 18.7 Add keyboard shortcut handler (J/K/A/R) in diff viewer client component
- [ ] 18.8 Write component tests for diff viewer (approve/reject, no-baseline state, render error panel); write unit tests for `approveDiff` and `rejectDiff` build status recalculation

## 19. Docker Compose + Deployment

- [ ] 19.1 Write `Dockerfile`: four stages — `deps` (pnpm install), `builder` (compile all apps + packages), `app` (Next.js standalone + migrate + rustfs-init scripts, no Playwright), `worker` (BullMQ dist + Playwright browser install); each final stage has its own `entrypoint.sh`
- [ ] 19.2 Write `docker-compose.yml`: seven services (app, worker, migrate, postgres, valkey, rustfs, rustfs-init); `app`/`migrate`/`rustfs-init` use `ovr-app` image; `worker` uses `ovr-worker` image; wire `DATABASE_URL` from parts
- [ ] 19.3 Write `scripts/rustfs-init.js`: creates the OVR bucket on first start using S3 API
- [ ] 19.4 Write `packages/db/migrate.ts`: runs Drizzle migrations and exits; used as the `migrate` container entrypoint
- [ ] 19.5 Create `.env.example` with all variables documented and sensible defaults
- [ ] 19.6 Add `depends_on` with health checks: `app` and `worker` wait for `postgres`, `valkey`, `rustfs`; `migrate` runs before `app`
- [ ] 19.7 Verify cold-start: `docker compose up` with only `POSTGRES_PASSWORD` and `BETTER_AUTH_SECRET` set reaches `/setup` successfully
