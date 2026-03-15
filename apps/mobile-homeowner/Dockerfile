# Build stage - Expo static export
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files for monorepo
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/mobile-homeowner/package.json ./apps/mobile-homeowner/
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/shared-ui/package.json ./packages/shared-ui/
COPY packages/shared-utils/package.json ./packages/shared-utils/

# Install pnpm
RUN npm install -g pnpm

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY packages/ ./packages/
COPY apps/mobile-homeowner/ ./apps/mobile-homeowner/

WORKDIR /app

# API URL for build (override for local Docker; default for production)
ARG EXPO_PUBLIC_API_URL=https://api.buildmyhouse.app/api
ENV EXPO_PUBLIC_API_URL=$EXPO_PUBLIC_API_URL

# Build for web (static export)
RUN pnpm --filter mobile-homeowner build

# Production stage - nginx serves static files
FROM nginx:alpine AS production

# Copy built static files
COPY --from=builder /app/apps/mobile-homeowner/dist /usr/share/nginx/html

# SPA routing - fallback to index.html for client-side routes
COPY apps/mobile-homeowner/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
