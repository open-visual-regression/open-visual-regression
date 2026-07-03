# syntax=docker/dockerfile:1
#
# Build from the repository root:
#   docker build -f apps/worker/Dockerfile -t open-visual-regression/worker .

ARG NODE_VERSION=24.16.0
# Keep in sync with the "playwright" version in pnpm-lock.yaml.
ARG PLAYWRIGHT_VERSION=1.60.0

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

# Ship the SQL migrations next to the bundled migrate entrypoint, and produce a
# lean production node_modules with just the worker's runtime dependencies.
RUN cp -r packages/db/src/migrations apps/worker/dist/migrations
RUN pnpm --filter @ovr/worker deploy --prod --legacy /prod

FROM mcr.microsoft.com/playwright:v${PLAYWRIGHT_VERSION}-noble AS runner
ENV NODE_ENV=production \
    OVR_MIGRATIONS_DIR=/app/dist/migrations
WORKDIR /app

COPY --from=builder /prod/node_modules ./node_modules
COPY --from=builder /app/apps/worker/dist ./dist

USER pwuser
CMD ["node", "dist/index.js"]
