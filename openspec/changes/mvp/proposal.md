## Why

Commercial visual regression tools charge per snapshot, forcing teams to cap coverage and create blind spots exactly where AI-generated UI code introduces the most unintended changes. OVR provides a self-hosted, open source alternative with no per-snapshot pricing, deployable with a single `docker compose up`.

## What Changes

- **New**: Turborepo monorepo scaffold with `apps/web`, `apps/worker`, `apps/cli`, and shared packages (`db`, `services`, `api`, `queue`, `storage`, `ui`)
- **New**: Auth system — invite-only registration, first-run wizard, Better Auth with Admin + API Key + Organization plugins, `admin`/`user` roles
- **New**: User management UI — admin can invite users, view/manage accounts
- **New**: Project management — create projects, configure browser/viewport variants
- **New**: CLI (`@ovr/cli`) — `ovr snapshot` triggers a blocking build, polls until resolved, exits with pass/fail code
- **New**: Build pipeline — Playwright capture → Pixelmatch diff → BullMQ worker jobs, all parallel per story × variant
- **New**: Review UI — view builds, diff viewer (baseline vs capture), approve/reject diffs
- **New**: Docker Compose deployment — single image, seven services, two required secrets
- **New**: Oxlint + Oxfmt replacing ESLint + Prettier
- **New**: Teams data model (schema + Better Auth Organization plugin, no UI — deferred to v0.2)

## Capabilities

### New Capabilities

- `monorepo-scaffold`: Turborepo monorepo structure, shared packages, Oxlint/Oxfmt toolchain, Docker Compose single-image setup
- `auth`: Better Auth-powered auth — invite-only signup, first-run wizard, session management, API key issuance for CLI
- `user-management`: Admin UI for inviting users, viewing accounts, and managing roles
- `projects`: Create and configure projects (name, slug, default branch, browser/viewport variants)
- `build-pipeline`: CLI-triggered build — Playwright capture, Pixelmatch diffing, BullMQ job orchestration, baseline management
- `review-ui`: Build list, build detail, side-by-side diff viewer, approve/reject actions

### Modified Capabilities

## Impact

- **New packages**: `@ovr/web`, `@ovr/worker`, `@ovr/cli`, `@ovr/db`, `@ovr/services`, `@ovr/api`, `@ovr/queue`, `@ovr/storage`, `@ovr/ui`
- **New dependencies**: Next.js, Better Auth, Drizzle ORM, BullMQ, Valkey, Playwright, Pixelmatch, oRPC, Tanstack Query, shadcn/ui, Tailwind, Oxlint, Oxfmt
- **Infrastructure**: Postgres 17, Valkey 8, RustFS — all bundled in Docker Compose
- **Published package**: `@ovr/cli` to npm
- **Deleted**: `apps/docs` (default Turborepo template, not needed)
