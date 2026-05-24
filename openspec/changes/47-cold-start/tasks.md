# 47 · Cold-start verification

Gate: `docker compose up` with only `POSTGRES_PASSWORD`, `BETTER_AUTH_SECRET`, `STORAGE_SECRET_KEY` set reaches `/setup` in a browser; completing setup redirects to `/projects`.

- [ ] 1.1 Create `packages/db/src/migrate.ts`:
  - Runs all pending Drizzle migrations using `drizzle-kit migrate` or programmatic Drizzle migrator
  - Exits `process.exit(0)` on success; `process.exit(1)` on error (logs error to stderr)
  - Used as `OVR_ROLE=migrate` container entrypoint

- [ ] 1.2 Create `scripts/rustfs-init.js`:
  - Uses `@aws-sdk/client-s3` to create the `ovr` bucket if it doesn't exist
  - Config from env: `STORAGE_ENDPOINT`, `STORAGE_ACCESS_KEY`, `STORAGE_SECRET_KEY`
  - Idempotent: `BucketAlreadyOwnedByYou` error is not an error
  - Exits `process.exit(0)` on success or "already exists"; `process.exit(1)` on real error

- [ ] 1.3 Cold-start test (manual verification checklist in PR description):
  1. Copy `.env.example` → `.env`; fill in 3 required secrets
  2. `docker compose build`
  3. `docker compose up`
  4. Wait for app health check to pass (≤ 60s)
  5. Open `http://localhost:3000` → redirects to `/setup` ✓
  6. Complete setup form → redirects to `/projects` ✓
  7. `/projects` shows empty state ✓
  8. `docker compose down -v` → clean up

- [ ] 1.4 Create `DEPLOYMENT.md` at repo root:
  - Prerequisites: Docker + Docker Compose
  - Required env vars table with descriptions
  - Quick start: `cp .env.example .env && docker compose up`
  - Note on worker image size (~1.5GB due to Playwright browser binaries)
  - Upgrade path: pull new image tags → `docker compose up` (migrate runs automatically)
