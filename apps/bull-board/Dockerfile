# syntax=docker/dockerfile:1
#
# Build from the repository root:
#   docker build -f apps/bull-board/Dockerfile -t open-visual-regression/bull-board .

ARG NODE_VERSION=24.16.0

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
RUN pnpm exec turbo run build --filter=@ovr/bull-board
RUN pnpm --filter @ovr/bull-board deploy --prod --legacy /prod

FROM node:${NODE_VERSION}-slim AS runner
ARG UID=1001
ARG GID=1001
ENV NODE_ENV=production \
    BULL_BOARD_PORT=3001
WORKDIR /app
RUN groupadd --system --gid ${GID} nodejs && \
    useradd --system --uid ${UID} --gid ${GID} nodejs

COPY --from=builder --chown=nodejs:nodejs /prod/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/apps/bull-board/dist ./dist

USER nodejs
EXPOSE 3001
CMD ["node", "dist/index.js"]
