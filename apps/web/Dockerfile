# syntax=docker/dockerfile:1
#
# Build from the repository root:
#   docker build -f apps/web/Dockerfile -t open-visual-regression/web .

ARG NODE_VERSION=24.16.0

FROM node:${NODE_VERSION}-slim AS builder
ENV HUSKY=0 \
    CI=1 \
    NEXT_TELEMETRY_DISABLED=1
WORKDIR /app
RUN corepack enable && \
    apt-get update && \
    apt-get install -y --no-install-recommends python3 make g++ ca-certificates && \
    rm -rf /var/lib/apt/lists/*

COPY . .
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

# Placeholder secret satisfies the build; the runtime value comes from env.
ARG BETTER_AUTH_SECRET="build-time-placeholder"
ENV BETTER_AUTH_SECRET=${BETTER_AUTH_SECRET}
# NEXT_PUBLIC_* is inlined into the client bundle at build time; override when
# serving from a domain other than http://localhost:3000.
ARG NEXT_PUBLIC_BASE_URL="http://localhost:3000"
ENV NEXT_PUBLIC_BASE_URL=${NEXT_PUBLIC_BASE_URL}
RUN pnpm exec turbo run build --filter=@ovr/web

FROM node:${NODE_VERSION}-slim AS runner
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
WORKDIR /app
RUN groupadd --system --gid 1001 nodejs && \
    useradd --system --uid 1001 --gid nodejs nextjs

COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

USER nextjs
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
