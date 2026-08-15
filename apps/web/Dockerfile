# syntax=docker/dockerfile:1
#
# Build from the repository root:
#   docker build -f apps/web/Dockerfile -t open-visual-regression/web .

ARG NODE_VERSION=24.16.0
# Keep in sync with the "turbo" devDependency in the root package.json.
ARG TURBO_VERSION=2.10.8

FROM node:${NODE_VERSION}-slim AS pruner
ARG TURBO_VERSION
WORKDIR /app
RUN npm install -g turbo@${TURBO_VERSION}
COPY . .
RUN turbo prune @ovr/web --docker

FROM node:${NODE_VERSION}-slim AS builder
ENV HUSKY=0 \
    CI=1 \
    NEXT_TELEMETRY_DISABLED=1
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
# Throwaway secret so Better Auth's prod init does not throw; not baked in, real one is set at runtime.
RUN BETTER_AUTH_SECRET="$(node -e 'process.stdout.write(require("crypto").randomBytes(32).toString("base64url"))')" \
    pnpm exec turbo run build --filter=@ovr/web

FROM node:${NODE_VERSION}-slim AS runner
ARG UID=1001
ARG GID=1001
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
WORKDIR /app
RUN groupadd --system --gid ${GID} nodejs && \
    useradd --system --uid ${UID} --gid ${GID} nextjs

COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

USER nextjs
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
