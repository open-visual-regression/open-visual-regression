# 28 · packages/storage

Gate: all integration tests pass against real MinIO container; upload → download → delete → presigned URL all work.

- [ ] 1.1 Install `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner` in `packages/storage`
- [ ] 1.2 Implement `packages/storage/src/index.ts`:
  - Config (read from env): `STORAGE_ENDPOINT`, `STORAGE_ACCESS_KEY`, `STORAGE_SECRET_KEY`, `STORAGE_BUCKET` (default `ovr`), `STORAGE_REGION` (default `us-east-1`)
  - `uploadFile(key: string, body: Buffer | Readable, contentType: string): Promise<void>`
  - `getFileStream(key: string): Promise<Readable>`
  - `deleteFile(key: string): Promise<void>`
  - `deletePrefix(prefix: string): Promise<void>` — list all keys with prefix → bulk delete (handle >1000 keys in batches)
  - `getPresignedUrl(key: string, ttlSeconds: number): Promise<string>`
- [ ] 1.3 Integration tests (`src/__tests__/integration/storage.test.ts`) using Testcontainers MinIO:
  - Upload a PNG buffer → `getFileStream` returns same bytes
  - `deleteFile` → subsequent `getFileStream` throws NoSuchKey
  - `deletePrefix` removes all keys with that prefix
  - `getPresignedUrl` returns a URL that resolves (HTTP GET returns 200)
