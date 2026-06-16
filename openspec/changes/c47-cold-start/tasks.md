# 47 · Cold-start verification

Gate: `docker compose up` with only `POSTGRES_PASSWORD`, `BETTER_AUTH_SECRET`, `STORAGE_SECRET_KEY` set reaches `/setup` in a browser; completing setup redirects to `/projects`.

Depends on: c45-dockerfile, c46-docker-compose

- [x] `packages/db/src/migrate.ts`: exports `runMigrations(connectionString)` — runs Drizzle migrations programmatically

- [ ] 1.1 Create `packages/db/src/migrate-entrypoint.ts`:
  - Reads `DATABASE_URL` from env; exits with clear message if missing
  - Calls `runMigrations(process.env.DATABASE_URL)`
  - `process.exit(0)` on success; logs to stderr + `process.exit(1)` on error
  - Add to `packages/db` build output so the Dockerfile can invoke it as `node packages/db/dist/migrate-entrypoint.js`

- [ ] 1.2 Create `scripts/rustfs-init.js`:
  - Uses `@aws-sdk/client-s3` to create the `ovr` bucket if it doesn't exist
  - Config from env: `STORAGE_ENDPOINT`, `STORAGE_ACCESS_KEY`, `STORAGE_SECRET_KEY`
  - Idempotent: `BucketAlreadyOwnedByYou` is not an error
  - `process.exit(0)` on success or "already exists"; `process.exit(1)` on real error

- [ ] 1.3 Cold-start verification (manual checklist in PR description):
  1. Copy `.env.example` → `.env`; fill in 3 required secrets
  2. `docker compose build`
  3. `docker compose up`
  4. Wait for app health check to pass (≤ 60s)
  5. Open `http://localhost:3000` → redirects to `/setup` ✓
  6. Complete setup form → redirects to `/projects` ✓
  7. `/projects` shows empty state ✓
  8. `docker compose down -v`

- [ ] 1.4 Create `DEPLOYMENT.md` at repo root:
  - Prerequisites: Docker + Docker Compose
  - Required env vars table with descriptions
  - Quick start: `cp .env.example .env && docker compose up`
  - Note on worker image size (~1.5 GB due to Playwright browser binaries)
  - Upgrade path: pull new image tags → `docker compose up` (migrate runs automatically)
  - **Network isolation (required for production)**: the worker executes Playwright against Storybook builds uploaded by CI — untrusted content. Deploy it with no network path to internal infrastructure beyond `postgres`, `valkey`, and `rustfs`. The route-interception in the capture service (c32) is defense-in-depth, not a substitute for network-level isolation.
