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

# Installation dependencies first, so the layer above only reruns when a
# dependency actually changes, not on every source edit.
COPY --from=pruner /app/out/json/ .
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

COPY --from=pruner /app/out/full/ .
# pnpm hard-links workspace packages that resolve as peer-dependency variants
# into its virtual store at install time. Since that ran before the source
# above existed, any such link points at a package.json-only stub; relink now
# that the real source is present. --offline is safe and fast: the store
# cache mount above already fetched everything pnpm needs from the registry.
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    rm -rf node_modules apps/*/node_modules packages/*/node_modules && \
    pnpm install --frozen-lockfile --offline
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
