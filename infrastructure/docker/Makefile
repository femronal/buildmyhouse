.PHONY: up down restart logs ps build clean migrate studio

# Start all services
up:
	docker-compose up -d

# Start services in foreground
up-fg:
	docker-compose up

# Stop all services
down:
	docker-compose down

# Stop and remove volumes (⚠️ deletes data)
clean:
	docker-compose down -v

# Restart services
restart:
	docker-compose restart

# View logs
logs:
	docker-compose logs -f

# View logs for specific service
logs-backend:
	docker-compose logs -f backend

logs-postgres:
	docker-compose logs -f postgres

logs-redis:
	docker-compose logs -f redis

# Check service status
ps:
	docker-compose ps

# Build backend image
build:
	docker-compose build backend

# Rebuild and restart backend
rebuild:
	docker-compose build backend
	docker-compose up -d backend

# Run database migrations
migrate:
	docker-compose exec backend pnpm prisma migrate deploy

# Generate Prisma Client
generate:
	docker-compose exec backend pnpm prisma generate

# Open Prisma Studio
studio:
	docker-compose exec backend pnpm prisma studio

# Access PostgreSQL
psql:
	docker-compose exec postgres psql -U buildmyhouse -d buildmyhouse

# Access Redis CLI
redis-cli:
	docker-compose exec redis redis-cli

# Development mode (database and Redis only)
dev:
	docker-compose -f docker-compose.dev.yml up -d postgres redis

# Stop development services
dev-down:
	docker-compose -f docker-compose.dev.yml down

# Health check
health:
	@echo "Checking service health..."
	@docker-compose ps
	@echo "\nBackend health:"
	@curl -s http://localhost:3001/api/health || echo "Backend not responding"
	@echo "\nPostgreSQL:"
	@docker-compose exec -T postgres pg_isready -U buildmyhouse || echo "PostgreSQL not ready"
	@echo "\nRedis:"
	@docker-compose exec -T redis redis-cli ping || echo "Redis not responding"

