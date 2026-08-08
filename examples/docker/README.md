# Docker examples

Each directory is a standalone, copy-and-go deployment: a `docker-compose.yml` pulling the published `ghcr.io/open-visual-regression` images, plus an `.env.example`. None of them need this repository checked out to run.

| Example | Postgres | Redis | Object storage |
|---------|----------|-------|-----------------|
| [`fully-self-hosted`](./fully-self-hosted) | bundled | bundled | bundled |
| [`external-storage`](./external-storage) | bundled | bundled | external (S3) |
| [`external-postgres`](./external-postgres) | external | bundled | bundled |
| [`external-redis`](./external-redis) | bundled | external | bundled |
| [`fully-external`](./fully-external) | external | external | external |

Pick whichever combination matches your infrastructure; mixing and matching beyond these five is a matter of taking the `x-app-env` block from the closest example and pointing the relevant variable at your own service.

The repository root also has its own [`docker-compose.yml`](../../docker-compose.yml), used for local development. It builds images from source rather than pulling published ones; see [`CONTRIBUTING.md`](../../CONTRIBUTING.md).
