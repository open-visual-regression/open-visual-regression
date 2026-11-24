---
name: smoke-testing
description: Smoke test a change by exercising it for real, the way the person it affects would (the app in a browser, the CLI against a running stack, the worker on a real build, a fresh agent session for a skill change, the affected tool for a config change), before calling it done or opening a PR. Use for every change, before writing a PR's Testing section, and whenever you're tempted to write "not tested" or "N/A" for testing.
---

Every change gets smoke tested before it goes up for review: you exercise what you changed the way the person it affects would, and you watch it do the right thing. That person might be a user in the browser, an operator running the CLI or installing the chart, a contributor running lint, or an agent loading a skill. Every change affects someone, so every change has something to exercise. The PR's Testing section is a short account of what you did and what you saw.

## Rules

- **Tests and CI don't count.** Unit and integration tests, typecheck, lint, and builds still have to pass, but CI already runs them, so listing them tells a reviewer nothing new. A smoke test is the step CI doesn't do: running the real thing.
- **Use the real path.** Use the real entry point and realistic data (a real Storybook build, a project with baselines, a build with diffs). Hit the edge cases the change is about, not just the happy path.
- **Test the final state.** Smoke test the branch as it will be reviewed, not an earlier commit. Re-run it if you change things afterwards.
- **No untested PRs.** If you haven't smoke tested it, you aren't done. Don't open the PR, and never write "not tested", "N/A", or "should work" in its place.
- **Blocked means stop and ask.** If something stops you (Docker won't start, an image won't pull, a host is blocked), work through it first. `.agents/skills/pulling-images/skill.md` covers the Docker daemon and image pulls in a sandbox. If you're still blocked after a real attempt, tell the user exactly what's blocking you and what you need, and don't open the PR.

## Bringing the stack up

Most app changes need the full stack. Build it from your working tree so you're testing your change, not already-merged images:

```bash
cp .env.example .env   # once; set BETTER_AUTH_SECRET and OVR_GIT_TOKEN_ENCRYPTION_KEY (openssl rand -base64 32 each)
docker compose up -d --build
```

The web app is then on http://localhost:3000. After changing web, worker, or package code, rebuild with `docker compose up -d --build web worker`. For faster iteration, run the data services in Docker and the apps on the host (see `CONTRIBUTING.md`, "Development").

To get real data in, build the artifacts the CLI ingests:

```bash
pnpm --filter @ovr/ui build-storybook
pnpm --filter @open-visual-regression/cli build
```

Then complete first-run setup in the browser, create a project and an API key, and run the CLI (`apps/cli/bin/ovr.mjs`) against `http://localhost:3000` with the Storybook output. `apps/e2e/tests/auth.setup.ts` shows the exact steps if you want to script them.

## What to exercise, by kind of change

### App code

- **Web UI (`apps/web`, `packages/ui`):** Drive it in a real browser with the `agent-browser` skill or Playwright. Visit the pages you changed, go through the flows, try the edge cases (empty states, errors, long values, a narrow window), and take screenshots for the PR.
- **API or contracts (`packages/api`, route handlers):** Call the endpoint against the running stack through its real client (the CLI or the UI), and check both the response and what the UI shows afterwards.
- **CLI (`apps/cli`):** Build it and run the commands and flags you changed against the running stack, including the error output for bad input.
- **Worker, capture, diffing (`apps/worker`, `packages/capture`, `packages/builds`, `packages/reviews`, `packages/queue`):** Push a real build through the CLI and watch the job run. Check the worker logs and the result in the UI (snapshots captured, diffs computed, statuses right).
- **Database (`packages/db`):** Run the migration against a database that already has data in it, then use the feature that depends on it. Check that the previous release's code still works against the migrated schema.
- **Storage, git status, metrics, logger:** Trigger the code path from the running stack and check the side effect: the object in the bucket, the commit status payload, the metrics endpoint output, the log line.
- **Refactors and dependency bumps:** Exercise the flows that go through the changed code and confirm they behave exactly as before.

### Deployment and CI

- **Docker and compose:** Bring the stack up from scratch with `docker compose up -d --build` and load the app.
- **Helm chart (`charts/`):** Install it into a local cluster (kind or k3d) with realistic values, and check that the pods come up and the app serves.
- **CI workflows (`.github/workflows`):** Run the changed steps locally where you can, then push the branch so the workflow actually runs, and read the logs for the job you changed.

### Tooling config

For config like `turbo.json`, `tsconfig.json`, `.oxlintrc.json`, `.oxfmtrc.json`, `vitest.config.ts`, `pnpm-workspace.yaml`, husky hooks, or `.env.example`, run the tool the config controls and show that the new behavior happens. Use a case that would have behaved differently before the change. For example, a new lint rule flags a file that breaks it, a turbo input change busts the cache when that input changes, a hook blocks the commit it's meant to block, or a fresh stack starts from the new `.env.example`. Throw away any scratch files you make for this.

### Agent instructions

For skills (`.claude/skills`, `.agents/skills`), `CLAUDE.md`, and `.claude/settings.json`, the person affected is an agent. Start a fresh, non-interactive Claude Code session in the repo and give it a realistic task that should be shaped by your change:

```bash
claude -p "<a realistic task the change should affect>" --output-format stream-json --verbose
```

Check in the transcript that the skill was loaded (or the setting took effect), and that the agent did what the new instructions say. Don't let it do anything outward-facing, like pushing or opening a PR. For a description change, also try a task that shouldn't trigger the skill.

### Docs

For `apps/docs`, run `pnpm --filter @ovr/docs dev` and open the changed pages in a browser. Check that they render, the navigation is right, and the links work, and run any commands or code samples you documented.

### E2E tests

For `apps/e2e`, run the specs you added or changed against the stack (see `apps/e2e/README.md`) and watch them pass. Check that a new spec fails when the behavior it covers is broken.
