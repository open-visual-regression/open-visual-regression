# 46 · docker-compose.yml

> Status: SUPERSEDED / mostly delivered — a production `docker-compose.yml` ships with
> db · valkey · rustfs · createbuckets · migrate · web · worker · bull-board · adminer, health
> checks, and `depends_on` ordering (migrate/createbuckets gate web+worker). A rich `.env.example`
> ships (task 1.4 done). Differences from the tasks below: storage is `rustfs/rustfs` (not minio),
> bucket bootstrap is a `createbuckets` (aws-cli) service (not `rustfs-init`), migration runs via
> `node dist/migrate.js` (not an `OVR_ROLE` switch), and there is **no `/api/health` route** (task
> 1.3 not done — compose uses per-service healthchecks instead), and the dev compose was not split
> into `docker-compose.dev.yml` (task 1.1 not done). Recommend archiving as superseded.

Gate: `docker compose up` starts all 7 services; app service passes health check; migrate service exits 0 before app starts.

The existing `docker-compose.yml` is a dev-only file (postgres, adminer, valkey). Rename it and add the production compose alongside it.

- [ ] 1.1 Rename `docker-compose.yml` → `docker-compose.dev.yml`

- [ ] 1.2 Create `docker-compose.yml` (7 services):
  ```yaml
  services:
    postgres:
      image: postgres:16-alpine
      environment: { POSTGRES_USER: "${POSTGRES_USER:-ovr}", POSTGRES_PASSWORD, POSTGRES_DB: "${POSTGRES_DB:-ovr}" }
      volumes: [postgres_data:/var/lib/postgresql/data]
      healthcheck: { test: "pg_isready -U ovr", interval: 5s, retries: 10 }

    valkey:
      image: valkey/valkey:8-alpine
      healthcheck: { test: "valkey-cli ping", interval: 5s, retries: 10 }

    rustfs:
      image: minio/minio:latest
      command: server /data
      environment: { MINIO_ROOT_USER: "${STORAGE_ACCESS_KEY:-ovr}", MINIO_ROOT_PASSWORD: "${STORAGE_SECRET_KEY}" }
      volumes: [rustfs_data:/data]
      healthcheck: { test: "curl -f http://localhost:9000/minio/health/live", interval: 10s }

    rustfs-init:
      image: "ovr-app:${OVR_VERSION:-latest}"
      environment: { OVR_ROLE: rustfs-init, STORAGE_ENDPOINT, STORAGE_ACCESS_KEY, STORAGE_SECRET_KEY }
      depends_on: { rustfs: { condition: service_healthy } }
      restart: "no"

    migrate:
      image: "ovr-app:${OVR_VERSION:-latest}"
      environment: { OVR_ROLE: migrate, DATABASE_URL }
      depends_on: { postgres: { condition: service_healthy } }
      restart: "no"

    app:
      image: "ovr-app:${OVR_VERSION:-latest}"
      ports: ["3000:3000"]
      environment: { DATABASE_URL, BETTER_AUTH_SECRET, BASE_URL, STORAGE_ENDPOINT, STORAGE_ACCESS_KEY, STORAGE_SECRET_KEY, VALKEY_URL: "redis://valkey:6379" }
      depends_on:
        postgres: { condition: service_healthy }
        valkey: { condition: service_healthy }
        rustfs: { condition: service_healthy }
        migrate: { condition: service_completed_successfully }
      healthcheck: { test: "curl -f http://localhost:3000/api/health", interval: 10s }

    # NOTE: in production, place the worker on a network with no egress beyond
    # postgres, valkey, and rustfs. It runs Playwright against uploaded Storybook
    # builds (untrusted content). See DEPLOYMENT.md.
    worker:
      image: "ovr-worker:${OVR_VERSION:-latest}"
      environment: { DATABASE_URL, VALKEY_URL: "redis://valkey:6379", STORAGE_ENDPOINT, STORAGE_ACCESS_KEY, STORAGE_SECRET_KEY }
      depends_on:
        postgres: { condition: service_healthy }
        valkey: { condition: service_healthy }
        migrate: { condition: service_completed_successfully }

  volumes:
    postgres_data:
    rustfs_data:
  ```

- [ ] 1.3 Create `apps/web/app/api/health/route.ts`:
  - `GET` → `SELECT 1` from DB; 200 `{ status: "ok" }` on success; 503 on DB error

- [ ] 1.4 Create `.env.example`:
  ```
  POSTGRES_PASSWORD=          # required
  BETTER_AUTH_SECRET=         # required — run: openssl rand -hex 32
  BASE_URL=http://localhost:3000
  POSTGRES_USER=ovr
  POSTGRES_DB=ovr
  STORAGE_ENDPOINT=http://rustfs:9000
  STORAGE_ACCESS_KEY=ovr
  STORAGE_SECRET_KEY=         # required
  VALKEY_URL=redis://valkey:6379
  OVR_VERSION=latest
  ```

- [ ] 1.5 Verify: `docker compose config` validates without errors
