# 28 · packages/storage

Gate: all integration tests pass against real RustFS container; upload → download → delete → presigned URL all work.

- [x] 1.1 Install `testcontainers` in `packages/storage`; create `packages/storage/src/__tests__/helpers/containers.ts`:
  - `startRustfs()` → starts `rustfs/rustfs:latest` with default credentials; returns `{ endpoint: string, accessKey: string, secretKey: string, stop: () => Promise<void> }`
  - Remove `passWithNoTests: true` from `packages/storage/vitest.config.ts`
- [x] 1.2 Install `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner` in `packages/storage`
- [x] 1.3 Implement `packages/storage/src/index.ts`:
  - Config (read from env): `STORAGE_ENDPOINT`, `STORAGE_ACCESS_KEY`, `STORAGE_SECRET_KEY`, `STORAGE_BUCKET` (default `ovr`), `STORAGE_REGION` (default `us-east-1`)
  - `uploadFile(key: string, body: Buffer | Readable, contentType: string): Promise<void>`
  - `getFileStream(key: string): Promise<Readable>`
  - `deleteFile(key: string): Promise<void>`
  - `deletePrefix(prefix: string): Promise<void>` — list all keys with prefix → bulk delete (handle >1000 keys in batches)
  - `getPresignedUrl(key: string, ttlSeconds: number): Promise<string>`
- [x] 1.4 Integration tests (`src/__tests__/integration/storage.test.ts`) using Testcontainers RustFS:
  - Upload a PNG buffer → `getFileStream` returns same bytes
  - `deleteFile` → subsequent `getFileStream` throws NoSuchKey
  - `deletePrefix` removes all keys with that prefix
  - `getPresignedUrl` returns a URL that resolves (HTTP GET returns 200)
