# 03 · Testcontainers helpers

Gate: each container helper starts and stops in an integration test; CI test job enabled and green.

- [ ] 1.1 Install `testcontainers` in `packages/db`, `packages/queue`, `packages/storage`
- [ ] 1.2 Create `packages/db/src/__tests__/helpers/containers.ts`:
  - `startPostgres()` → starts `postgres:16-alpine`; returns `{ connectionString: string, stop: () => Promise<void> }`
- [ ] 1.3 Create `packages/queue/src/__tests__/helpers/containers.ts`:
  - `startValkey()` → starts `valkey/valkey:8-alpine`; returns `{ host: string, port: number, stop: () => Promise<void> }`
- [ ] 1.4 Create `packages/storage/src/__tests__/helpers/containers.ts`:
  - `startMinio()` → starts `minio/minio` with default credentials; returns `{ endpoint: string, accessKey: string, secretKey: string, stop: () => Promise<void> }`
- [ ] 1.5 Write one integration test in each package that starts the container, runs a trivial operation (ping / list buckets / PING), and stops it
- [ ] 1.6 Remove `if: false` from the `test` job in `.github/workflows/ci.yml`; add Docker socket access for Testcontainers (`docker: true` or equivalent runner config)
- [ ] 1.7 Push branch; confirm all CI jobs pass including `test`
