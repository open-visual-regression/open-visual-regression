# CI build status — design

## Problem

When a build is uploaded from a CI pipeline, the PR owner/reviewer needs to see
OVR's verdict (analyzing / needs review / approved / rejected / error) as a
first-class check on their pull/merge request, and decide in their own branch
protection whether it blocks merge. Today the only signal is the CLI's exit
code: `ovr snapshot storybook` blocks and polls until the build resolves, so
the CI job itself is the check. That blocks the pipeline during human review
(up to the poll timeout) and cannot reflect an approval that happens later
without re-running CI.

## Approach — server-side commit status publisher

OVR posts a commit status to the git provider when a build is created
(`pending`) and re-posts on every review-status transition, so a reviewer
approving in the OVR UI hours later flips the PR check with no CI re-run. This
is the async model (Chromatic-style), built generically like TeamCity's Commit
Status Publisher rather than as a per-provider app.

Providers expose the same primitive — a PAT-authenticated commit-status
endpoint — differing only in host, path, repo identity, auth header, and state
vocabulary. A `StatusPublisher` adapter normalises OVR's neutral state onto each
dialect. v1 ships two adapters:

- **github-family** — GitHub, GitHub Enterprise, Gitea, Forgejo (identical
  `POST {base}/repos/{owner}/{repo}/statuses/{sha}` shape, base-URL/path
  parameterised)
- **gitlab** — `POST {base}/api/v4/projects/{id}/statuses/{sha}`

The richer GitHub Checks API is deliberately not used: it is GitHub-App-only
(PATs cannot call it), which would reintroduce the per-provider-app cost. A
simple status + link back to the OVR build page works across every provider.

## Data model

Two tables, deliberately separating **configuration** from **runtime events**:

- `git_integrations` — one per project: provider, base URL, repo identifier,
  encrypted token, check context. Config lifecycle.
- `git_status_publications` — one row per publish attempt, keyed by build
  (`onDelete: cascade`). Records neutral state posted, outcome, HTTP status,
  error. Event lifecycle. This is what makes per-build/per-PR observability
  possible ("why is PR #123 still pending?") and is naturally retention-bounded
  because rows cascade-delete when the build is purged. A mutable
  `lastError` column on the integration was rejected as a bandaid: it cannot
  express which build's check is stuck, conflates config with events, and loses
  history.

## Token encryption

Tokens are encrypted at rest with AES-256-GCM. The key comes from a
**required** `OVR_GIT_TOKEN_ENCRYPTION_KEY` (base64, 32 bytes) — no fallback to
`BETTER_AUTH_SECRET`, because coupling the two would make rotating the auth
secret silently undecrypt every stored token. Both processes that touch tokens
(web on encrypt, worker on decrypt) validate the key at boot and refuse to
start if it is missing or malformed. The plaintext token is written write-only
over the API (never returned), never placed in a queue payload (so it cannot
leak via Redis or bull-board), and never logged (pino redaction).

## Execution path

- `createBuild` and `finalizeBuild` (`packages/builds`) enqueue a
  `GIT_STATUS_PUBLISH` job carrying only `{ buildId }`. `finalizeBuild` — the
  single choke point through which initial processing, single votes, and bulk
  votes all recompute review status — enqueues only when the status actually
  changed (it already loads the prior build row).
- The worker handler (`apps/worker`) calls `publishBuildStatus(buildId)` in
  `@ovr/git-status`, which reads the current build/project/integration, decrypts
  the token, maps the state, posts via the adapter, and records a
  `git_status_publications` row. Reading state at execution time (not from the
  payload) makes concurrent transitions converge on the latest verdict.
- Error classification drives retries: 4xx config errors (401/403/404) are
  terminal (recorded, surfaced, not retried into exhaustion); 5xx / network /
  429 are retried via BullMQ exponential backoff.

## Surfacing

- Project settings: git integration section (provider, base URL, repo, token
  write-only, test-connection) plus a health signal derived from the latest
  failed publication.
- Build detail: per-build publish status from the latest publication row.

## Provider fallback

Providers without an adapter (obscure/in-house hosts) fall back to the existing
synchronous CLI model, where the pipeline posts the status with its own token.
