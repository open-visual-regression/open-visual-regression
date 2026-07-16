---
name: app-testing
description: How to stand up the full OVR stack locally with Docker Compose and drive its core happy path (setup, project + API key, Storybook ingest, review) to verify a change actually works end to end. Apply whenever validating a UI, API, or workflow change against the running app rather than trusting unit tests or a screenshot alone.
license: MIT
metadata:
  author: claude
  version: "1.0.0"
---

# App Testing — End-to-End Verification

Unit and integration tests check that code behaves correctly in isolation. They
don't confirm a change actually renders and works when a real user clicks
through the real app. This skill covers driving the full stack — Postgres,
Redis, object storage, the web app, and the worker — to verify a change the
way a user would experience it.

## Rules

### `stand-up-the-stack` — CRITICAL

```bash
cp .env.example .env
# Required secrets: generate real values, the app refuses to boot with empty ones.
sed -i "s|^BETTER_AUTH_SECRET=.*|BETTER_AUTH_SECRET=$(openssl rand -base64 32)|" .env
sed -i "s|^OVR_GIT_TOKEN_ENCRYPTION_KEY=.*|OVR_GIT_TOKEN_ENCRYPTION_KEY=$(openssl rand -base64 32)|" .env

docker compose up -d
docker compose ps   # wait until db/valkey report "healthy" and migrate/createbuckets have "Exited (0)"
```

By default `docker compose up` **builds** the `web` and `worker` images from
your current working tree (`IMAGE_PREFIX=ovr`, `IMAGE_TAG=latest` in
`.env.example`). That's what you want when testing a code change — it's
useless to test a change against a pre-built published image. Only set
`IMAGE_PREFIX` to a registry path if you deliberately want to test a published
release instead of local source.

### `registry-and-network-troubleshooting` — HIGH

Sandboxed/CI environments often restrict outbound network access. If
`docker pull` or `docker compose up` fails partway through an image pull
(succeeds on the manifest, fails on the blob download), or `docker build`
can't reach the package registry:

- Check whether a registry mirror is configured or reachable
  (`docker info | grep -A2 "Registry Mirror"`); a pull-through cache such as
  `mirror.gcr.io` often succeeds where the origin registry is blocked, since
  it fronts Docker Hub through different infrastructure.
- For local image builds that need to reach the package registry
  (`pnpm install` inside the Dockerfile), build with `--network host` so the
  build container shares the host's network path, and make sure any
  environment-provided CA bundle is trusted inside the build (e.g. via
  `NODE_EXTRA_CA_CERTS`) if the environment intercepts and re-terminates TLS.
- Don't fight a hard policy denial (an explicit 403 on a specific host) by
  routing around it — that's the environment operator's decision. Look for an
  already-permitted alternative path (a mirror, a different registry) instead.
- If your environment restarts mid-session, any local proxy or daemon config
  can silently change (e.g., a forward proxy coming back on a different
  port). Don't assume a working setup from ten minutes ago is still working —
  see `verify-deployed-not-just-built` below.

### `first-run-setup` — HIGH

The web app requires a one-time setup wizard before anything else works:

1. Visit `http://localhost:3000` — it redirects to `/setup` on a fresh
   database.
2. Create the organization, then the first admin account (this becomes the
   only user until you invite more).
3. You're redirected to `/login` — sign in with the account you just created.

### `create-project-and-api-key` — HIGH

Ingesting anything requires a project and an API key scoped to it:

1. From `/projects`, create a new project (name, description, git main
   branch).
2. Open the project → **settings** → **new api key**. Name it and copy the
   key immediately — it is shown exactly once.
3. Note the project's required-reviewers count in settings; it determines how
   many approvals a build needs before it's no longer "needs review".

### `produce-something-to-ingest` — MEDIUM

OVR ingests a Storybook static build. `packages/ui` already has a full
Storybook you can use as a ready-made target:

```bash
pnpm --filter @ovr/ui build-storybook   # outputs packages/ui/storybook-static
```

If a story references a named viewport via `parameters.ovr.viewports`, that
name must be declared in an `ovr.config.ts` next to the package (see
`packages/ui/ovr.config.ts`) — otherwise ingestion fails with
`Unknown viewport "<name>" referenced in story parameters`. The CLI only
picks up `ovr.config.ts` when invoked from the directory containing it (or
via `--config`), so run the ingest from inside that package.

### `build-and-run-the-cli` — MEDIUM

```bash
pnpm --filter @ovr/cli build   # produces apps/cli/bin/ovr.mjs + dist/

cd packages/ui   # wherever ovr.config.ts and storybook-static/ live
OVR_API_KEY=<key from settings> node ../../apps/cli/bin/ovr.mjs snapshot storybook \
  --dir storybook-static \
  --server-url http://localhost:3000 \
  --branch main --commit "$(printf 'a%.0s' {1..40})" \
  --name "baseline" --author "you" \
  --timeout 600
```

The first ingest on a project's main branch becomes the baseline (status
`unchanged`) — there's nothing to diff against yet. To actually exercise
review, make a visible change (e.g. tweak a component's styling), rebuild
the Storybook, and ingest again on a **different branch/commit** — that run
will report `needs_review` with a diff per changed story.

### `review-in-the-ui` — MEDIUM

Open the build from the project page → click a snapshot with a diff →
**approve** / **reject**. Expand the sidebar to see the **Reviews** tab,
which lists every reviewer's vote and (if applicable) an action to remove a
vote and re-open the snapshot for review.

### `test-multi-role-behavior-with-separate-sessions` — HIGH

Many OVR features are role- or ownership-gated (e.g. only the reviewer or an
admin can remove a given review). A single logged-in browser tab can't
exercise both sides of that gate. Use one browser profile/session per
identity you need:

- Invite additional users from **settings → users → invite user** (as the
  admin). Read the invitation link/id from the `invitation` table if there's
  no email transport configured in your environment
  (`select id, email from invitation`), then open
  `/invitations/<id>` in a **separate, logged-out** browser session to accept
  it and set a password.
- Keep one browser instance per identity (admin, regular member, a
  non-participating user) so you can compare what each role actually sees —
  don't rely on a single tab and mentally track "what would X see", verify it
  directly.

### `verify-deployed-not-just-built` — CRITICAL

A build finishing with exit code 0 is not proof your latest change is what's
actually running. Before trusting any UI check (screenshot, click-through) of
a rebuilt image:

- Confirm the running container's image ID actually matches the tag you just
  built: `docker inspect <container> --format '{{.Image}}'` vs.
  `docker images <tag> --no-trunc --format '{{.ID}}'`. If they differ, the
  container was never recreated.
- Grep the built output for something unique to your change (a new string
  literal, a new prop/attribute name) to be sure it's really compiled in —
  e.g. `docker exec <container> grep -rl "<marker>" /app/apps/web/.next/server`.
  Absence of the marker after a "successful" build means the build didn't
  actually pick up your source, not that your fix is wrong.
- Treat a screenshot as a hypothesis, not a conclusion, when something looks
  subtly off (spacing, an element that "should" be gone). Cross-check the
  live DOM (`element.getBoundingClientRect()`, a data attribute count) before
  concluding the behavior is correct or incorrect.

### `cleanup` — LOW

```bash
docker compose down        # stop, keep data volumes for next run
docker compose down -v     # stop and wipe all data (db, storage, redis)
```

## Quick Reference

| Task | Command |
|------|---------|
| First-time env setup | `cp .env.example .env` + fill required secrets |
| Bring up the stack (builds local images) | `docker compose up -d` |
| Check service health | `docker compose ps` |
| Build a Storybook target | `pnpm --filter @ovr/ui build-storybook` |
| Build the CLI | `pnpm --filter @ovr/cli build` |
| Ingest a build | `node apps/cli/bin/ovr.mjs snapshot storybook --dir <path> --server-url <url> --branch <b> --commit <sha>` |
| Read a pending invite (no email transport) | `docker compose exec db psql -U postgres -d open_visual_regression -c "select id, email from invitation"` |
| Confirm a rebuilt image is actually deployed | `docker inspect <container> --format '{{.Image}}'` vs. `docker images <tag> --no-trunc` |
| Tear down | `docker compose down` (add `-v` to wipe data) |
