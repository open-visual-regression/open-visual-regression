# External Postgres

Redis and object storage are still bundled containers; Postgres is a managed instance (Neon, RDS, Cloud SQL, or anything else reachable over `postgresql://`) instead of the bundled container.

## Run it

```sh
cp .env.example .env
# set DATABASE_URL to your provider's connection string
# set BETTER_AUTH_SECRET and OVR_GIT_TOKEN_ENCRYPTION_KEY (each: openssl rand -base64 32)

docker compose up -d
```

The `migrate` service runs schema migrations against `DATABASE_URL` on every startup; make sure the credentials in the connection string can create and alter tables.
