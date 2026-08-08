# External object storage

Postgres and Redis are still bundled containers; object storage is a real S3 bucket instead of the bundled `rustfs` container. Use this if you already have an AWS account (or another S3-compatible provider: R2, Spaces, GCS with S3 interop) and would rather not run object storage yourself.

## Before you run it

Create the bucket first; this example doesn't create it for you the way the fully self-hosted one does. Grant the credentials you use read/write access to that bucket.

## Run it

```sh
cp .env.example .env
# fill in STORAGE_BUCKET, STORAGE_REGION, and credentials
# set BETTER_AUTH_SECRET and OVR_GIT_TOKEN_ENCRYPTION_KEY (each: openssl rand -base64 32)

docker compose up -d
```

## Non-AWS S3-compatible providers

Set `STORAGE_ENDPOINT` and `STORAGE_PUBLIC_ENDPOINT` to the provider's endpoint, and set `STORAGE_FORCE_PATH_STYLE=true` (Cloudflare R2 and most self-hosted S3-compatible services need path-style addressing; AWS S3 doesn't).
