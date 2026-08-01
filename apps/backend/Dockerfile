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

# Install deps for backend workspace and its dependency graph
RUN pnpm --filter @buildmyhouse/backend... install --no-frozen-lockfile

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

# Install production deps for backend workspace only (ensures express is present at runtime)
RUN pnpm --filter @buildmyhouse/backend... install --prod --no-frozen-lockfile

# Copy built application and Prisma files
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/apps/backend/prisma ./apps/backend/prisma
# Reuse the Prisma Client generated in the builder (avoids OOM on small Fargate tasks).
COPY --from=builder /app/node_modules/.pnpm ./node_modules/.pnpm
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/.modules.yaml ./node_modules/.modules.yaml

WORKDIR /app/apps/backend
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"

# Expose port
EXPOSE 3001

# Migrations + start only — Prisma Client is baked into the image at build time.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/main.js"]