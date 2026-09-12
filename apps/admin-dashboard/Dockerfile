# Build stage — Debian slim (glibc). Alpine/musl cannot run pnpm@9.14.2's official binary.
FROM node:18-slim AS builder

WORKDIR /app

# Copy workspace manifests so the lockfile importers resolve.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/admin-dashboard/package.json ./apps/admin-dashboard/
COPY apps/backend/package.json ./apps/backend/
COPY apps/mobile-homeowner/package.json ./apps/mobile-homeowner/
COPY apps/mobile-contractor/package.json ./apps/mobile-contractor/
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/shared-ui/package.json ./packages/shared-ui/
COPY packages/shared-utils/package.json ./packages/shared-utils/

# Pin pnpm via npm. Do not let Corepack download a host-specific binary.
ENV COREPACK_ENABLE_STRICT=0
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN npm install -g pnpm@9.14.2 \
  && pnpm config set package-manager-strict false

RUN pnpm --filter @buildmyhouse/admin-dashboard... install --frozen-lockfile

COPY packages/ ./packages/
COPY apps/admin-dashboard/ ./apps/admin-dashboard/

WORKDIR /app

# Build admin dashboard - MUST pass NEXT_PUBLIC_API_URL for production (e.g. https://api.buildmyhouse.app/api)
ARG NEXT_PUBLIC_API_URL=http://localhost:3001/api
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN pnpm --filter @buildmyhouse/admin-dashboard build

# Production stage
FROM node:18-slim AS production

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
# Must bind to 0.0.0.0 so ALB/health checks can reach the container (not 127.0.0.1)
ENV HOSTNAME="0.0.0.0"

# Copy standalone output (monorepo layout: server.js + node_modules in apps/admin-dashboard/)
COPY --from=builder /app/apps/admin-dashboard/.next/standalone ./
COPY --from=builder /app/apps/admin-dashboard/.next/static ./apps/admin-dashboard/.next/static
RUN mkdir -p ./apps/admin-dashboard/public

# Start script: explicitly set host to 0.0.0.0 so ALB health checks reach /health
RUN echo '#!/bin/sh' > /start.sh && \
    echo 'export HOSTNAME=0.0.0.0' >> /start.sh && \
    echo 'export PORT=3000' >> /start.sh && \
    echo 'cd /app/apps/admin-dashboard && exec node server.js' >> /start.sh && \
    chmod +x /start.sh

EXPOSE 3000

ENTRYPOINT ["/start.sh"]
