# 45 · Dockerfile

> Status: SUPERSEDED — deployment shipped with a different structure than the tasks below.
> Instead of one root multi-stage Dockerfile with `app`/`worker` targets, the repo ships a
> per-app Dockerfile (`apps/web/Dockerfile`, `apps/worker/Dockerfile`, `apps/bull-board/Dockerfile`).
> `output: "standalone"` is set in `apps/web/next.config.ts` (task 1.4 done). The entrypoint-script
> approach (`scripts/entrypoint-*.sh`, `OVR_ROLE` switch) was replaced by explicit compose
> `command:` overrides. The tasks below describe the abandoned single-Dockerfile design; the
> deployment goal (buildable app + worker images, browsers only in the worker) is met differently.
> Recommend archiving as superseded (or rewriting to match the shipped layout).

Gate: `docker build --target app .` and `docker build --target worker .` both succeed; app image does not contain Playwright browser binaries; worker image does.

- [ ] 1.1 Create `Dockerfile` at repo root with 4 stages:

  **Stage 1: deps**
  ```dockerfile
  FROM node:22-alpine AS deps
  RUN corepack enable && corepack prepare pnpm@11 --activate
  WORKDIR /app
  COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
  COPY packages/*/package.json ./packages/*/  # (multi-copy pattern)
  COPY apps/*/package.json ./apps/*/
  RUN pnpm install --frozen-lockfile
  ```

  **Stage 2: builder**
  ```dockerfile
  FROM deps AS builder
  COPY . .
  RUN pnpm build
  ```

  **Stage 3: app** (Next.js standalone, no Playwright)
  ```dockerfile
  FROM node:22-alpine AS app
  WORKDIR /app
  COPY --from=builder /app/apps/web/.next/standalone ./
  COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
  COPY --from=builder /app/apps/web/public ./apps/web/public
  COPY --from=builder /app/packages/db/src/migrations ./packages/db/src/migrations
  COPY scripts/entrypoint-app.sh ./entrypoint.sh
  RUN chmod +x entrypoint.sh
  ENV NODE_ENV=production PORT=3000
  EXPOSE 3000
  ENTRYPOINT ["./entrypoint.sh"]
  ```

  **Stage 4: worker** (BullMQ + Playwright)
  ```dockerfile
  FROM node:22-bookworm-slim AS worker  # Debian for Playwright deps
  WORKDIR /app
  COPY --from=builder /app/apps/worker/dist ./apps/worker/dist
  COPY --from=builder /app/node_modules ./node_modules
  RUN npx playwright install chromium --with-deps
  COPY scripts/entrypoint-worker.sh ./entrypoint.sh
  RUN chmod +x entrypoint.sh
  ENV NODE_ENV=production
  ENTRYPOINT ["./entrypoint.sh"]
  ```

- [ ] 1.2 Create `scripts/entrypoint-app.sh`:
  ```sh
  #!/bin/sh
  case "$OVR_ROLE" in
    migrate)     exec node packages/db/dist/migrate.js ;;
    rustfs-init) exec node scripts/rustfs-init.js ;;
    *)           exec node apps/web/server.js ;;
  esac
  ```

- [ ] 1.3 Create `scripts/entrypoint-worker.sh`:
  ```sh
  #!/bin/sh
  exec node apps/worker/dist/index.js
  ```

- [ ] 1.4 Add `output: "standalone"` to `apps/web/next.config.ts`

- [ ] 1.5 Verify: `docker build --target app -t ovr-app .` exits 0; `docker run --rm ovr-app node -e "console.log('ok')"` runs; `docker images ovr-app` size < 500MB
- [ ] 1.6 Verify: `docker build --target worker -t ovr-worker .` exits 0; worker image contains chromium binary
