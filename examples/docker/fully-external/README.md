# Fully external

Postgres, Redis, and object storage are all managed services. This compose file only runs the OVR `web` and `worker` images, nothing else.

Use this once you'd rather not operate any stateful containers yourself, for example running `web`/`worker` on a platform like ECS or Cloud Run in front of Neon, Upstash, and S3.

## Before you run it

- A Postgres database the `migrate` service can create and alter tables in
- A Redis instance for the build queue
- An S3-compatible bucket that already exists

## Run it

```sh
cp .env.example .env
# fill in DATABASE_URL, REDIS_URL, and the STORAGE_* variables
# set BETTER_AUTH_SECRET and OVR_GIT_TOKEN_ENCRYPTION_KEY (each: openssl rand -base64 32)

docker compose up -d
```
