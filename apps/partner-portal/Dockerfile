# Build stage — Debian slim (glibc). Alpine/musl cannot run pnpm@9.14.2's official binary.
FROM node:18-slim AS builder

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/partner-portal/package.json ./apps/partner-portal/
COPY apps/admin-dashboard/package.json ./apps/admin-dashboard/
COPY apps/backend/package.json ./apps/backend/
COPY apps/mobile-homeowner/package.json ./apps/mobile-homeowner/
COPY apps/mobile-contractor/package.json ./apps/mobile-contractor/
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/shared-ui/package.json ./packages/shared-ui/
COPY packages/shared-utils/package.json ./packages/shared-utils/

ENV COREPACK_ENABLE_STRICT=0
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN npm install -g pnpm@9.14.2 \
  && pnpm config set package-manager-strict false

RUN pnpm --filter @buildmyhouse/partner-portal... install --frozen-lockfile

COPY packages/ ./packages/
COPY apps/partner-portal/ ./apps/partner-portal/

ARG NEXT_PUBLIC_API_URL=https://api.buildmyhouse.app/api
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN pnpm --filter @buildmyhouse/partner-portal build

FROM node:18-slim AS production

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

COPY --from=builder /app/apps/partner-portal/.next/standalone ./
COPY --from=builder /app/apps/partner-portal/.next/static ./apps/partner-portal/.next/static
COPY --from=builder /app/apps/partner-portal/public ./apps/partner-portal/public

RUN echo '#!/bin/sh' > /start.sh && \
    echo 'export HOSTNAME=0.0.0.0' >> /start.sh && \
    echo 'export PORT=3000' >> /start.sh && \
    echo 'cd /app/apps/partner-portal && exec node server.js' >> /start.sh && \
    chmod +x /start.sh

EXPOSE 3000

ENTRYPOINT ["/start.sh"]
