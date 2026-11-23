---
name: smoke-testing
description: Smoke test a change by running it for real (the app in a browser, the CLI against a running stack, the worker on a real job, the chart in a cluster, the docs site rendered) before committing it as done or opening a PR. Use after every code, config, CI, chart, or docs change, before writing a PR's Testing section, and whenever you're tempted to write "not tested", "untested", or "N/A" for testing.
---

Every change gets smoke tested in a realistic scenario before it goes up for review. That means running the thing you changed the way a user or operator would and watching it do the right thing. A PR that says it wasn't tested, or that only lists typecheck, lint, unit tests, or a build, is not ready to open.

## Rules

- **No untested PRs.** Never open a PR, or describe one, with "not tested", "untested", "didn't test", "couldn't test", "should work", or "N/A" in the Testing section. If you haven't smoke tested it, you aren't done.
- **Tests and CI aren't smoke tests.** Unit and integration tests, typecheck, lint, and builds are required, but they don't count. Run the real thing.
- **Realistic means the real path.** Use the running stack, real data shapes (a real Storybook build, a project with baselines, a build with diffs), and the entry point a user would use. Hit the edge cases the change is about, not just the happy path.
- **Blocked is not a pass.** If something stops you (Docker won't start, an image won't pull, a host is blocked), work through it first: `.agents/skills/pulling-images/skill.md` covers the Docker daemon and image pulls in a sandbox. If you're still blocked after a real attempt, stop and tell the user exactly what's blocking you and what you need. Don't open the PR and don't write the gap into the description.
- **Report what happened.** Write down what you ran and what you saw, so the PR's Testing section describes something that actually happened.

## Bringing the stack up

The full stack is what most smoke tests need. Build it from your working tree so you're testing your change, not already-merged images:

```bash
cp .env.example .env   # once; set BETTER_AUTH_SECRET and OVR_GIT_TOKEN_ENCRYPTION_KEY (openssl rand -base64 32 each)
docker compose up -d --build
```

The web app is then on http://localhost:3000. After changing web, worker, or package code, rebuild what changed with `docker compose up -d --build web worker`. For faster iteration, run the data services in Docker and the apps on the host (see `CONTRIBUTING.md`, "Development").

To get real data into it, build the artifacts the CLI ingests and push a build:

```bash
pnpm --filter @ovr/ui build-storybook
pnpm --filter @open-visual-regression/cli build
```

Then complete first-run setup in the browser, create a project and an API key, and run the CLI (`apps/cli/bin/ovr.mjs`) against `http://localhost:3000` with the Storybook output. `apps/e2e/tests/auth.setup.ts` shows the exact steps if you want to script them.

## What to smoke test, by kind of change

- **Web UI (`apps/web`, `packages/ui`):** Drive it in a real browser with the `agent-browser` skill or Playwright. Visit the pages you changed, go through the flows, try the edge cases (empty states, errors, long values, a narrow window), and take screenshots for the PR.
- **API or contracts (`packages/api`, route handlers):** Call the endpoint against the running stack the way its real client does (through the CLI or the UI), and check both the response and what the UI shows afterwards.
- **CLI (`apps/cli`):** Build it and run the actual commands and flags you changed against the running stack, including the failure output for bad input.
- **Worker, capture, diffing (`apps/worker`, `packages/capture`, `packages/builds`, `packages/reviews`, `packages/queue`):** Push a real build through the CLI and watch the job run. Check the worker logs and check the result in the UI (snapshots captured, diffs computed, statuses right).
- **Database (`packages/db`):** Run the migration against a database that already has data in it, then exercise the feature that uses it. Check that the previous release's code still works against the migrated schema.
- **Storage, git status, metrics, logger:** Trigger the code path from the running stack and check the side effect: the object in the bucket, the commit status payload, the metrics endpoint output, the log line.
- **Helm chart (`charts/`):** `helm lint` and `helm template` with realistic values, then install it into a local cluster (kind or k3d) and check the pods come up and the app serves.
- **Docker / compose:** Build the images and bring the stack up from scratch with `docker compose up -d --build`, then load the app.
- **CI workflows (`.github/workflows`):** Run the changed steps locally where you can, and push the branch so the workflow actually runs, then check its logs for the job you changed.
- **Docs (`apps/docs`):** Run `pnpm --filter @ovr/docs dev`, open the changed pages in a browser, and check they render, the navigation is right, and the links work. Run any commands or code samples you documented.
- **Refactors with no behavior change:** Smoke test the flows that go through the refactored code and confirm they behave exactly as before.
- **E2E tests (`apps/e2e`):** Run the specs you added or changed against the stack (see `apps/e2e/README.md`) and watch them pass. Check that a new spec fails when the behavior it covers is broken.

## Before you open the PR

1. Smoke test the final state of the branch, not an earlier commit.
2. Keep notes on what you did and saw, plus screenshots for UI changes.
3. Write the PR with the `pr-description` skill, using those notes for the Testing section.
