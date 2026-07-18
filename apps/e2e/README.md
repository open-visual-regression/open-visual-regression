# End-to-end tests

Playwright E2E suite for the web app. The suite drives the **full stack** the way
a real deployment runs it (web + worker + db + valkey + storage), because the
first test ingests a build through the CLI and the worker captures it.

## What runs

- `auth.setup.ts` (setup project): completes first-run setup, logs in and saves
  the session to `playwright/.auth/user.json`, then provisions a project
  (`gitMainBranch: "main"`) and an API key, writing them to
  `playwright/.artifacts/seed.json`.
- `ingest-storybook.spec.ts`: runs `ovr snapshot storybook` against the running
  stack to ingest a Storybook build on the **main** branch, then asserts through
  the UI that the build was ingested and resolved to `unchanged`.
- `snapshot-review.spec.ts`: seeds a snapshot that needs review, then drives the
  whole snapshot page — baseline vs new comparison, the diff-overlay toggle, the
  reviews sidebar, and approving the snapshot.

> Ingesting on the project's main branch is deliberate: it promotes baselines and
> resolves the build to a completed state instead of `needs_review`.

> Storybook renders deterministically, so re-ingesting the same build never diffs
> against itself. `snapshot-review.spec.ts` ingests a baseline on main, overwrites
> one target's stored baseline image with another's, then re-ingests on a feature
> branch so that target diverges past the diff threshold and lands in
> `needs_review`. Overwriting the stored image needs S3 access from the host (see
> the `STORAGE_*` env below).

## Running locally

Run the whole thing against the stack **built from your working tree** — this is
what tests your local changes (pulling published images would test already-merged
code instead).

```bash
# 0. one-time: secrets compose needs
cp .env.example .env
# set BETTER_AUTH_SECRET and OVR_GIT_TOKEN_ENCRYPTION_KEY (each: openssl rand -base64 32)

# 1. build + start the full stack from source (web + worker + db + valkey + storage)
docker compose up -d --build

# 2. build the artifacts the CLI ingests
pnpm --filter @ovr/ui build-storybook
pnpm --filter @ovr/cli build

# 3. first time only: get the browser for the test runner
pnpm --filter @ovr/e2e exec playwright install chromium

# 4. run the suite
pnpm --filter @ovr/e2e test:e2e
```

### Iterating

- **Editing the E2E tests** (`apps/e2e/**`): the runner is on the host, so just
  re-run `pnpm --filter @ovr/e2e test:e2e` — no rebuild.
- **Editing app code** (web / worker / packages): rebuild the images first, then
  re-run: `docker compose up -d --build web worker && pnpm --filter @ovr/e2e test:e2e`.

### Running against published images instead of a local build

To smoke-test the actual GHCR artifacts (e.g. what CI runs on merge to main),
point compose at the registry instead of building — this is what the CI `e2e`
job does:

```bash
echo "$CR_PAT" | docker login ghcr.io -u <user> --password-stdin   # PAT needs read:packages
IMAGE_PREFIX=ghcr.io/open-visual-regression IMAGE_TAG=main docker compose pull
IMAGE_PREFIX=ghcr.io/open-visual-regression IMAGE_TAG=main docker compose up -d
pnpm --filter @ovr/e2e test:e2e
```

Point the suite at any running deployment with `PLAYWRIGHT_BASE_URL`. Override the
ingested artifacts with `OVR_CLI_ENTRY` / `OVR_STORYBOOK_DIR` / `OVR_STORYBOOK_PKG_DIR`.

`snapshot-review.spec.ts` also needs S3 access from the host to seed its diff.
With the bundled `docker compose` stack these are the defaults (match your `.env`
if you changed them):

```bash
STORAGE_ENDPOINT=http://localhost:9000 \
STORAGE_ACCESS_KEY=rustfsadmin \
STORAGE_SECRET_KEY=rustfsadmin \
STORAGE_BUCKET=ovr \
  pnpm --filter @ovr/e2e test:e2e
```
