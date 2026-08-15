# syntax=docker/dockerfile:1
#
# Build from the repository root:
#   docker build -f apps/worker/Dockerfile -t open-visual-regression/worker .

ARG NODE_VERSION=24.16.0
# Keep in sync with the pinned "playwright" version in apps/worker + packages/capture.
ARG PLAYWRIGHT_VERSION=1.61.0
# Keep in sync with the "turbo" devDependency in the root package.json.
ARG TURBO_VERSION=2.10.8

FROM node:${NODE_VERSION}-slim AS pruner
ARG TURBO_VERSION
WORKDIR /app
RUN npm install -g turbo@${TURBO_VERSION}
COPY . .
RUN turbo prune @ovr/worker --docker

FROM node:${NODE_VERSION}-slim AS builder
ENV HUSKY=0 \
    CI=1
WORKDIR /app
RUN corepack enable && \
    apt-get update && \
    apt-get install -y --no-install-recommends python3 make g++ ca-certificates && \
    rm -rf /var/lib/apt/lists/*

COPY --from=pruner /app/out/json/pnpm-lock.yaml .
RUN pnpm fetch

COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/full/ .
RUN pnpm install --frozen-lockfile --offline
RUN pnpm exec turbo run build --filter=@ovr/worker

RUN cp -r packages/db/src/migrations apps/worker/dist/migrations
RUN pnpm --filter @ovr/worker deploy --prod /prod

FROM mcr.microsoft.com/playwright:v${PLAYWRIGHT_VERSION}-noble AS runner
ARG UID=1001
ARG GID=1001
ENV NODE_ENV=production \
    OVR_MIGRATIONS_DIR=/app/dist/migrations
WORKDIR /app

RUN groupmod --gid ${GID} pwuser && usermod --uid ${UID} --gid ${GID} pwuser

# Reaps orphaned Chromium children — otherwise they zombie and exhaust the pids cgroup.
RUN apt-get update && \
    apt-get install -y --no-install-recommends tini && \
    rm -rf /var/lib/apt/lists/*

COPY --from=builder --chown=pwuser:pwuser /prod/node_modules ./node_modules
COPY --from=builder --chown=pwuser:pwuser /app/apps/worker/dist ./dist

USER pwuser
ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["node", "dist/index.js"]
