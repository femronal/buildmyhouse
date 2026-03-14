# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files for monorepo
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/admin-dashboard/package.json ./apps/admin-dashboard/
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/shared-ui/package.json ./packages/shared-ui/
COPY packages/shared-utils/package.json ./packages/shared-utils/

# Install pnpm
RUN npm install -g pnpm

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY packages/ ./packages/
COPY apps/admin-dashboard/ ./apps/admin-dashboard/

WORKDIR /app

# Build admin dashboard - MUST pass NEXT_PUBLIC_API_URL for production (e.g. https://api.buildmyhouse.app/api)
ARG NEXT_PUBLIC_API_URL=http://localhost:3001/api
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN pnpm --filter @buildmyhouse/admin-dashboard build

# Production stage - use standalone output
FROM node:18-alpine AS production

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
