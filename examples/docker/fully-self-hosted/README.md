# Fully self-hosted

Everything runs in containers: Postgres, Valkey, and object storage (`rustfs`, S3-compatible) alongside the OVR `web` and `worker` images. No external accounts or services, and no repository checkout, required.

## Run it

```sh
cp .env.example .env
# set BETTER_AUTH_SECRET and OVR_GIT_TOKEN_ENCRYPTION_KEY (each: openssl rand -base64 32)

docker compose up -d
```

The dashboard is at `http://localhost:3000`. First run walks you through creating an organization and admin account.

## Data

All state lives in named volumes (`pgdata`, `valkeydata`, `rustfsdata`, `workertmp`). Back those up the way you'd back up any container volume; there's no separate export step.
