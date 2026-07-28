# syntax=docker/dockerfile:1
#
# Build from the repository root:
#   docker build -f apps/worker/Dockerfile -t open-visual-regression/worker .

ARG NODE_VERSION=24.16.0
# Keep in sync with the pinned "playwright" version in apps/worker + packages/capture.
ARG PLAYWRIGHT_VERSION=1.61.0

FROM node:${NODE_VERSION}-slim AS builder
ENV HUSKY=0 \
    CI=1
WORKDIR /app
RUN corepack enable && \
    apt-get update && \
    apt-get install -y --no-install-recommends python3 make g++ ca-certificates && \
    rm -rf /var/lib/apt/lists/*

COPY . .
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile
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
