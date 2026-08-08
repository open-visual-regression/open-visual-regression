# External Redis

Redis is a managed instance (Upstash, ElastiCache, Memorystore, or anything else reachable over `redis://`/`rediss://`) instead of a bundled container.

Redis backs the build queue (BullMQ); the worker won't process anything without a reachable Redis.

## Run it

```sh
cp .env.example .env
# set REDIS_URL to your provider's connection string
# set BETTER_AUTH_SECRET and OVR_GIT_TOKEN_ENCRYPTION_KEY (each: openssl rand -base64 32)

docker compose up -d
```
