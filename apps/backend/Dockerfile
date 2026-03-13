# Build stage - use Debian (slim) instead of Alpine for Prisma/QEMU compatibility on Mac
FROM node:18-slim AS builder
RUN apt-get update -qq && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/*/package.json ./packages/*/

# Install pnpm
RUN npm install -g pnpm

# Install dependencies (--no-frozen-lockfile avoids lockfile sync issues in monorepo)
RUN pnpm install --no-frozen-lockfile

# Copy source code
COPY . .

# Generate Prisma Client (dummy DATABASE_URL - generate doesn't connect to DB)
WORKDIR /app/apps/backend
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
RUN pnpm prisma:generate

# Build the application (from monorepo root for correct workspace resolution)
WORKDIR /app
RUN pnpm --filter @buildmyhouse/backend build

# Production stage
FROM node:18-slim AS production
RUN apt-get update -qq && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/*/package.json ./packages/*/

# Install production dependencies only (--no-frozen-lockfile avoids lockfile sync issues)
RUN pnpm install --prod --no-frozen-lockfile

# Copy built application and Prisma files
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/apps/backend/prisma ./apps/backend/prisma

WORKDIR /app/apps/backend
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
RUN pnpm prisma:generate

# Expose port
EXPOSE 3001

# Run migrations then start the application
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/main.js"]