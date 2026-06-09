# 46 · docker-compose.yml

Gate: `docker compose up` starts all 7 services; app service passes health check; migrate service exits 0 before app starts.

- [ ] 1.1 Create `docker-compose.yml`:
  ```yaml
  services:
    postgres:
      image: postgres:16-alpine
      environment: { POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB: ovr }
      volumes: [postgres_data:/var/lib/postgresql/data]
      healthcheck: { test: pg_isready -U ovr, interval: 5s, retries: 10 }

    valkey:
      image: valkey/valkey:8-alpine
      healthcheck: { test: valkey-cli ping, interval: 5s, retries: 10 }

    rustfs:
      image: rustfs/rustfs:latest  # or minio/minio for dev
      command: server /data
      environment: { MINIO_ROOT_USER: ovr, MINIO_ROOT_PASSWORD: ... }
      volumes: [rustfs_data:/data]
      healthcheck: { test: curl -f http://localhost:9000/minio/health/live, interval: 10s }

    rustfs-init:
      image: ovr-app:${OVR_VERSION:-latest}
      environment: { OVR_ROLE: rustfs-init, STORAGE_ENDPOINT, STORAGE_ACCESS_KEY, STORAGE_SECRET_KEY }
      depends_on: { rustfs: { condition: service_healthy } }
      restart: "no"

    migrate:
      image: ovr-app:${OVR_VERSION:-latest}
      environment: { OVR_ROLE: migrate, DATABASE_URL }
      depends_on: { postgres: { condition: service_healthy } }
      restart: "no"

    app:
      image: ovr-app:${OVR_VERSION:-latest}
      ports: ["3000:3000"]
      environment: { DATABASE_URL, BETTER_AUTH_SECRET, BASE_URL, STORAGE_ENDPOINT, STORAGE_ACCESS_KEY, STORAGE_SECRET_KEY, VALKEY_URL: redis://valkey:6379 }
      depends_on:
        postgres: { condition: service_healthy }
        valkey: { condition: service_healthy }
        rustfs: { condition: service_healthy }
        migrate: { condition: service_completed_successfully }
      healthcheck: { test: curl -f http://localhost:3000/api/health, interval: 10s }

    worker:
      image: ovr-worker:${OVR_VERSION:-latest}
      environment: { DATABASE_URL, VALKEY_URL: redis://valkey:6379, STORAGE_ENDPOINT, STORAGE_ACCESS_KEY, STORAGE_SECRET_KEY }
      depends_on:
        postgres: { condition: service_healthy }
        valkey: { condition: service_healthy }
        migrate: { condition: service_completed_successfully }

  volumes: { postgres_data, rustfs_data }
  ```

- [ ] 1.2 Create `apps/web/app/api/health/route.ts`:
  - `GET` → query `SELECT 1` from DB; if ok → `{ status: "ok" }` 200; if DB fail → 503

- [ ] 1.3 Create `.env.example`:
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

- [ ] 1.4 Verify: `docker compose config` validates without errors

- [ ] 1.5 Add a comment block above the `worker` service in `docker-compose.yml` noting that in production deployments the worker should be placed on a network with no route to internal services beyond `postgres`, `valkey`, and `rustfs` — it executes Playwright against uploaded build artifacts, which are untrusted content. See `DEPLOYMENT.md`.
