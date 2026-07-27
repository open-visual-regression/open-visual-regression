# End-to-end tests

Playwright E2E suite for the web app. The specs drive the **full stack** the way
a real deployment runs it (web + worker + db + valkey + storage): they ingest
Storybook builds through the CLI and exercise the resulting UI.

`auth.setup.ts` (the setup project) runs first: it completes first-run setup, logs
in and saves the session to `playwright/.auth/user.json`, then provisions a project
(`gitMainBranch: "main"`) and an API key, writing them to
`playwright/.artifacts/seed.json` for the specs to use.

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
pnpm --filter @open-visual-regression/cli build

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
