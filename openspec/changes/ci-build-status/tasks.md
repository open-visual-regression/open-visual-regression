# CI build status — publish OVR verdict as a git commit status

Gate: a build created from CI posts a `pending` commit status to its project's
configured git provider; when the build resolves and when a reviewer later
approves/rejects in the OVR UI, the same commit status updates
(`success`/`failure`) with no CI re-run; the token is stored encrypted, never
returned, never queued, never logged; publish outcomes are recorded per build
and surfaced in settings and the build detail page. Whether the check blocks
merge is left to the repo's branch protection.

## Context — why this exists

Today CI's only OVR signal is the CLI exit code: `ovr snapshot storybook`
blocks and polls until the build resolves (`apps/cli/src/commands/snapshot`),
so the CI job is the check. That stalls the pipeline during human review and
cannot reflect a later approval without re-running CI. This change adds a
server-side commit-status publisher (Chromatic-style, async) built generically
across providers via a `StatusPublisher` adapter, so OVR reports the verdict and
the repo decides enforcement. See `design.md`.

## Slice 1 — data layer (`packages/db`)

- [ ] 1.1 Add `packages/db/src/schemas/gitIntegrations.ts`:
  `gitProviderEnum` (`github`, `github_enterprise`, `gitea`, `forgejo`,
  `gitlab`), `gitStatusStateEnum` (`pending`, `success`, `failure`, `error`),
  `gitPublicationOutcomeEnum` (`ok`, `error`); `gitIntegrations` table
  (projectId unique FK cascade, provider, baseUrl nullable, repoIdentifier,
  encryptedToken, checkContext default `ovr/visual-review`, timestamps);
  `gitStatusPublications` table (buildId FK cascade, commitSha, context, state,
  outcome, httpStatus nullable, error nullable, createdAt)
- [ ] 1.2 Export both schemas from `packages/db/src/schema.ts`
- [ ] 1.3 Add repositories `repository/gitIntegrations.ts`
  (`findByProject`, `upsert`, `remove`) and `repository/gitStatusPublications.ts`
  (`record`, `findLatestByBuild`, `findLatestFailureByProject`); register both
  in `repository`/`client.ts`
- [ ] 1.4 `pnpm --filter @ovr/db db:generate` to produce the migration
- [ ] 1.5 Integration test: upsert is idempotent per project; publication
  records cascade-delete with the build

## Slice 2 — `@ovr/git-status` package

- [ ] 2.1 Scaffold package (package.json, tsconfig, `.oxlintrc.json`, vitest
  configs) mirroring `packages/builds`
- [ ] 2.2 `crypto.ts`: AES-256-GCM `encryptToken`/`decryptToken` +
  `assertEncryptionKey()` reading required `OVR_GIT_TOKEN_ENCRYPTION_KEY`
- [ ] 2.3 `publisher.ts`: `StatusPublisher` interface + neutral
  `GitStatusState` + build-status → state mapping
- [ ] 2.4 `adapters/githubFamily.ts`, `adapters/gitlab.ts`, `adapters/index.ts`
  (resolve adapter by provider); classify 4xx terminal vs 5xx/429 retryable
- [ ] 2.5 `publishBuildStatus.ts` orchestrator: load build/project/integration,
  decrypt, map, post, record publication
- [ ] 2.6 Unit tests: crypto round-trip + tamper detection; adapter URL/state
  mapping and error classification; orchestrator with a fake publisher

## Slice 3 — queue + worker + hooks

- [ ] 3.1 `packages/queue`: add `QueueName.GIT_STATUS_PUBLISH`,
  `GitStatusPublishJobPayload = { buildId }`, JOB_OPTIONS entry,
  `enqueuePublishStatus` in `index.ts` + `producer.ts`
- [ ] 3.2 `apps/worker/src/handlers/publishStatus.ts` (`run`/`failed`); wire a
  Worker + `guard(publishStatus.failed)` in `apps/worker/src/index.ts`; assert
  encryption key at boot
- [ ] 3.3 `packages/builds/src/builds.ts`: enqueue in `createBuild`; enqueue in
  `finalizeBuild` only when reviewStatus/processingStatus changed
- [ ] 3.4 Integration test: transition enqueues once; no-op finalize does not

## Slice 4 — API contract + router

- [ ] 4.1 `packages/api/src/contracts/gitIntegrations.ts` (get/upsert/remove/
  testConnection); register in `contract.ts`
- [ ] 4.2 `apps/web/lib/router/gitIntegrations.ts` (authenticated + admin
  middleware, `.actionable()`); token write-only, response exposes `hasToken`
  not the token; register in router `index.ts`
- [ ] 4.3 Integration test: admin gating; token never returned; upsert/remove

## Slice 5 — UI + surfacing

- [ ] 5.1 `GitIntegrationSection` under project settings `_components`; add to
  `settings/page.tsx`; mock in `packages/mocks`
- [ ] 5.2 Build detail: show latest publication status
- [ ] 5.3 Settings health signal from latest failed publication

## Slice 6 — env + docs

- [ ] 6.1 Add required `OVR_GIT_TOKEN_ENCRYPTION_KEY` to `.env.example` and
  `docker-compose.yml`; boot validation in web + worker
- [ ] 6.2 Document the CI status flow and the CLI fallback for unsupported
  providers
