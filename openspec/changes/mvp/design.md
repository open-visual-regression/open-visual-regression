## Context

OVR is a self-hosted visual regression testing platform for Storybook. This design covers the initial implementation: auth, user management, projects, build pipeline, review UI, and Docker Compose deployment.

## Goals / Non-Goals

**Goals:**
- Monorepo structure, toolchain, and package boundaries
- Invite-only auth with first-run wizard
- Project and variant management
- CLI-triggered build pipeline: Playwright capture → Pixelmatch diff → review queue
- Review UI: diff viewer with approve/reject
- Single-command Docker Compose deployment

**Non-Goals:**
- Storybook hosting and permalinks
- Team management UI
- ProductArea, CODEOWNERS, review routing
- Helm chart
- Async CLI mode
- SSO / OIDC
- Email sending
- Multi-tenancy

## Decisions

### D1: Monorepo package boundaries

```
apps/
  web/        Next.js App Router — UI, Server Actions, auth flows
  worker/     BullMQ consumer — Playwright, Pixelmatch
  cli/        @ovr/cli — published to npm

packages/
  db/         Drizzle schema, repositories, migrations
  services/   Business logic shared between web and worker
  api/        oRPC routers + auth middleware (CLI-facing only)
  queue/      BullMQ job type definitions and producers
  storage/    RustFS / S3 client
  ui/         shadcn/ui + Base UI components
  typescript-config/
```

All packages use the `@ovr/*` scope. The `web` app does not depend on `packages/api` — oRPC is exclusively the CLI's transport.

**Why separate worker**: Playwright is memory-heavy. A worker crash must not take down the review UI, and the two processes have different resource profiles.

**Why `packages/services`**: Worker jobs and Server Actions share business logic. Services are framework-agnostic and do not import Next.js.

### D2: Two Docker image targets from one Dockerfile

Multi-stage build produces two final images from shared `deps` and `builder` stages:

```
deps      pnpm install
builder   compile all apps and packages
app       Next.js standalone, migrate script, rustfs-init — no Playwright
worker    BullMQ worker dist + Playwright browser binaries
```

`OVR_ROLE` selects the entrypoint within each image:

```bash
# app image entrypoint
case "$OVR_ROLE" in
  migrate)     exec node packages/db/migrate.js ;;
  rustfs-init) exec node scripts/rustfs-init.js ;;
  *)           exec node apps/web/.next/standalone/server.js ;;
esac

# worker image entrypoint
exec node apps/worker/dist/index.js
```

Docker Compose references `ovr-app` and `ovr-worker`, both on the same release tag.

**Why two targets**: The app container does not use Playwright. Bundling ~1.5GB of browser binaries into the web server adds weight and attack surface for no benefit.

### D3: Layer architecture

```
Route / Server Action  →  Service  →  Repository  →  Drizzle  →  Postgres
oRPC Router            →  Service  →  Repository  →  Drizzle  →  Postgres
Worker Job             →  Service  →  Repository  →  Drizzle  →  Postgres
```

Routes and actions are thin — they validate input and call a service. Services own all business logic. Repositories contain only Drizzle queries.

### D4: Auth

**Better Auth plugins**: Admin, API Key, Organization, Rate Limiting.

**Roles**: `admin` and `user` (Better Auth defaults). `admin` manages users, projects, and settings. `user` can view builds and approve/reject diffs. All invited users default to `user`.

**Invite flow**: Admin creates an invitation in the admin UI. Better Auth's Organization plugin generates a token. The resulting invite URL is displayed in the admin UI for the admin to copy and share via any channel. The `/invite/[invitationId]` page validates the token and presents a "Create account" form. A single server action runs `createUser` + `signIn` + `acceptInvitation` atomically. Tokens expire after 48 hours and are single-use.

**First-run wizard**: Middleware detects zero users and redirects all requests to `/setup`, which creates the organization and first admin account.

**CLI auth**: All oRPC procedures run through middleware that calls `auth.api.verifyApiKey()`. Invalid or missing key returns `UNAUTHORIZED`.

**RBAC enforcement**: Role checks happen in the service layer, not in routes or UI.

### D5: Object storage

All snapshots, diffs, and Storybook builds are stored in RustFS with no public bucket policy. Image access goes through a Next.js route that validates the session and project membership, generates a short-lived presigned URL (60s TTL), and redirects the browser to fetch directly from RustFS.

```
GET /api/storage/[...path]
  → validate session + project membership
  → generate presigned URL (60s TTL)
  → 302 redirect to presigned URL
```

**Why presigned URLs**: Proxying image bytes through Next.js wastes server memory and CPU for what is essentially a pass-through operation.

### D6: Build pipeline

```
createBuild (oRPC)
  → Build record (pending), Snapshot records (one per story × variant)
  → Upload Storybook static to RustFS
  → Enqueue snapshot:capture jobs in parallel

snapshot:capture
  → Playwright screenshot at configured viewport
  → Capture console output and errors → SnapshotLog
  → Upload screenshot to RustFS
  → Update Snapshot (captured)
  → All captures done → enqueue snapshot:diff jobs

snapshot:diff
  → Fetch capture + baseline from RustFS
  → Pixelmatch comparison
  → No baseline → needs_review
  → Within threshold → auto_approved
  → Exceeds threshold → needs_review + upload diff image
  → All diffs done → enqueue build:finalize

build:finalize
  → Any snapshot error → Build: error
  → Any diff needs_review → Build: needs_review
  → All diffs auto_approved or approved → Build: passed
```

**Baselines** are always sourced from the most recent approved build on the project's default branch. Feature branch builds compare against that baseline, never against previous builds on the same branch. Approving a diff on the default branch promotes that snapshot to the new baseline for its story × variant. Feature branch approvals do not update baselines.

### D7: Job retries

| Job | Attempts | Backoff | On exhaustion |
|---|---|---|---|
| `snapshot:capture` | 5 | Exponential, 2s base | Snapshot → `error` |
| `snapshot:diff` | 3 | Exponential, 2s base | Diff → `error` |
| `build:finalize` | 3 | Fixed, 1s | Build → `error` |

`snapshot:capture` gets more attempts because Playwright crashes transiently under load. On exhaustion the worker catches the BullMQ `failed` event, marks the record, and re-triggers build finalization. BullMQ retains failed jobs in a `failed` state for operator inspection — no separate dead-letter queue.

### D8: Rendering

Server Components for all data display. Server Actions for mutations, co-located with the routes that use them. Tanstack Query for client-side polling (build status while a build is in progress). `"use client"` only when state, event handlers, or browser APIs are required.

### D9: Toolchain

Oxlint with `react`, `typescript`, `import`, and `unicorn` plugins. Oxfmt with Tailwind class sorting. Both configured at monorepo root.

### D10: Testing

| Type | Tools | Scope |
|---|---|---|
| Unit | Vitest | Services (mocked repos), oRPC routers, CLI logic |
| Integration | Vitest + Testcontainers | Repositories (real Postgres), queue producers (real Valkey), storage client (real MinIO) |
| Component | Vitest + Testing Library | React components, Server Actions |

Unit and component tests are co-located with source files. Integration tests live in `__tests__/integration/` within each package.

### D11: CI

GitHub Actions workflow on push to `main` and PRs targeting `main`. Five jobs: `lint`, `format-check`, `type-check`, `build`, `test`. All must pass to merge. `ubuntu-latest` runners provide Docker for Testcontainers.

### D12: Environment configuration

Two required values: `POSTGRES_PASSWORD`, `BETTER_AUTH_SECRET`. Docker Compose constructs `DATABASE_URL` internally.

```
POSTGRES_USER=ovr             default: ovr
POSTGRES_PASSWORD=            required
POSTGRES_DB=ovr               default: ovr
BETTER_AUTH_SECRET=           required
BASE_URL=http://localhost:3000 default
```

### D13: UI design system

**Reference implementation**: All design files are committed at `openspec/designs/`. Read these before implementing any UI task:

| File | Purpose |
|---|---|
| `designs/screens/.../kit/colors_and_type.css` | Canonical design tokens |
| `designs/screens/.../kit/components.jsx` | Primitive components (Button, Badge, Icon, etc.) |
| `designs/screens/.../kit/components-alerts.jsx` | Alert, AlertDialog |
| `designs/screens/.../kit/components-feedback.jsx` | Toast, SegmentedProgress, CodeBlock |
| `designs/screens/.../kit/chrome.jsx` | Desktop TopBar + Sidebar |
| `designs/screens/.../kit/chrome-mobile.jsx` | Mobile chrome (drawer, tab bar) |
| `designs/screens/.../kit/chrome-tablet.jsx` | Tablet collapsed sidebar |
| `designs/screens/.../kit/screens-builds.jsx` | Runs list, run detail, diff viewer |
| `designs/screens/.../kit/screens-auth.jsx` | Setup, login, invite pages |
| `designs/screens/.../kit/screens-projects.jsx` | Project list, new project, settings |
| `designs/screens/.../kit/screens-admin.jsx` | Users, invite modal, API keys |
| `designs/screens/.../kit/screens-states.jsx` | Empty states, pending, error states |
| `designs/screens/.../kit/screens-mobile.jsx` | All screens at 375×812 |
| `designs/screens/.../kit/screens-tablet.jsx` | All screens at 768×1024 |
| `designs/design-system/.../fonts/` | JetBrains Mono TTF (self-hosted) |



The web app follows the OVR design system: dark-first, mono-forward, hairline-dense.

**Typeface**: JetBrains Mono everywhere (display, body, code, labels). No second family. `--font-mono` CSS variable; Berkeley Mono is the long-term target if a license is acquired.

**Color**: oklch-based design tokens. Brand accent is warm amber (`oklch(0.78 0.18 75)`). Diff semantics: add=green, remove=red, change=amber. Status: pass=green, fail=red, pending=blue, stale=grey. Light theme opt-in via `[data-theme="light"]`, used only for printable report embeds.

**Radii**: 2px for buttons/badges/inputs, 4px for cards/panels, 6px for modals. No fully-rounded capsule shapes.

**Borders**: Hairline 1px. `--border-subtle` for table rules; `--border-default` for card edges; `--border-strong` for focus/emphasis. Borders separate; padding alone does not.

**Status icons** (Lucide React, `currentColor`, 1.5px stroke, 14–16px):

| Semantic | Lucide icon | Color token |
|---|---|---|
| changed / needs review | `AlertCircle` | `--accent-primary` (amber) |
| passed / clean | `CircleCheck` | `--diff-add` (green) |
| pending / running | `LoaderCircle` | `--status-pending` (blue) |
| stale | `TriangleAlert` | `--status-stale` (grey) |
| approved (diff-level) | `CircleCheck` | `--diff-add` (green) |
| rejected (diff-level) | `CircleX` | `--diff-remove` (red) |

`Δ` (delta) remains as a unicode text prefix before percentage values (e.g. `Δ 0.12%`) — it is a unit marker, not a status indicator.

**Copy voice**: terse, lowercase, mechanical. No emoji, no exclamation marks. Status badges (`PASS`, `FAIL`, `PENDING`, `CHANGED`) are uppercase because they are CLI states. Buttons and nav items are lowercase.

**Run vs build**: The URL path uses `/builds/[id]` but the UI labels everything as "runs". The design system README uses "run" throughout. Implement URL as `/builds` but display text as "run"/"runs".

**Build status mapping** (DB → UI display):
- `pending` → "running…" with `LoaderCircle` icon (blue)
- `needs_review` → "N changed" with `AlertCircle` icon (amber)
- `passed` → "pass" with `CircleCheck` icon (green)
- `error` → "fail" with `AlertCircle` icon (red)

**Responsive breakpoints**:

| Breakpoint | Width | Chrome |
|---|---|---|
| Desktop | ≥1024px | Fixed 48px topbar + 240px sidebar |
| Tablet | 768–1023px | Fixed 48px topbar + 48px collapsed icon-only sidebar (expand toggle) |
| Mobile | <768px | Fixed 48px topbar with hamburger + 280px drawer overlay + 56px bottom tab bar |

Mobile bottom tabs: projects · runs · settings.

Tablet sidebar shows project monograms (2-letter initials), amber dot for changed count, glyph stack for recent runs.

**App chrome dimensions** (CSS variables):
- `--topbar-h: 48px`
- `--sidebar-w: 240px` (desktop)
- Tablet sidebar: 48px (hardcoded, not a CSS variable)
- Mobile tab bar: 56px (hardcoded)

**Diff viewer**: Three modes selectable from the toolbar:
- `side` — baseline and current shown side-by-side, each ~320px wide at 1280 viewport. Baseline shows `remove` regions; current shows `change` + `add` regions.
- `overlay` — single full-width frame showing current with all diff regions overlaid.
- `slider` — draggable vertical divider, baseline on left / current on right with clip-path. Divider is 2px amber with a 28×28 amber handle showing `↔`.

**Diff overlay**: Changed pixel regions rendered as colored rectangles at 40% opacity with a 2px solid outline: green for add, red for remove, amber for change. Toggle shown via eye/eyeOff button.

**Keyboard shortcuts in diff viewer**: `J` next changed snapshot, `K` prev changed snapshot, `A` approve, `R` reject. Shown as `KeyHint` chips in the footer.

**Snapshot thumbnail**: 160px tall preview area with `--bg-inset` + pixel-grid texture. Diff overlay rendered as colored region rectangles. Changed snapshots show `Δ N.NN%` badge (filled amber) in top-left corner.

**Segmented progress bar**: Used on run detail to show snapshot status breakdown. Colored segments (green=pass, amber=changed, red=fail, blue=pending) proportional to count. `SegmentedProgress` component with title, subtitle, summary text, and configurable height (8px default).

**DiffStrip**: 3px wide vertical bar flush to the left edge of run rows and run detail headers. Color: amber for `needs_review`/changed, green for pass, red for fail/error, blue for pending, grey for stale.

**Empty states**: Dashed 1px border + `--pixel-grid` background texture + centered ∅ glyph (or unicode equivalent) + explanatory text + primary CTA. Used on: projects list (no projects), runs list (no runs in filter).

**Toast notifications**: Bottom-right fixed position, stacked. Tones: success (green border), accent (amber border), neutral (default border). Auto-dismiss or persistent. Always include a title.

**Alert component**: Inline feedback banner above content. Tones: success, accent, destructive, neutral. Used for invite URL reveal and API key reveal-once.

**Settings layout**: `/settings` routes use a two-column layout: 200px left sub-nav rail + scrollable content area. Sub-nav sections:
- Personal: profile · api keys · sessions
- Admin (heading): users · invitations · instance

## Risks

**Worker image size** — Playwright browser binaries add ~1.5GB to the worker image. The app image is unaffected. Document in deployment guide.

**Organization plugin requires org before invites** — First-run wizard must complete before any invites can be issued. Middleware enforces this.

**Baseline race on concurrent default-branch builds** — Last-writer-wins if two builds finalize simultaneously. Acceptable at this scale; address with optimistic locking when needed.
