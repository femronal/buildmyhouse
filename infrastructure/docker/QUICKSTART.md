# Docker Quick Start Guide

## Prerequisites

- Docker Desktop installed and running
- Docker Compose v2+

## Quick Start

### 1. Set Up Environment

Create `.env` file in `infrastructure/docker/`:

```bash
cd infrastructure/docker
cp .env.example .env
# Edit .env with your values
```

### 2. Start All Services

```bash
# From infrastructure/docker directory
docker-compose up -d
```

Or use the Makefile:
```bash
make up
```

### 3. Run Database Migrations

```bash
docker-compose exec backend pnpm prisma migrate deploy
```

Or:
```bash
make migrate
```

### 4. Verify Services

```bash
# Check all services are running
docker-compose ps

# Check health
make health

# Or manually:
curl http://localhost:3001/api/health
```

## Services

| Service | Port | Description |
|---------|------|-------------|
| PostgreSQL | 5432 | Database |
| Redis | 6379 | Cache & sessions |
| Backend | 3001 | NestJS API |

## Development Mode

For development with hot reload:

```bash
# Start only database and Redis
docker-compose -f docker-compose.dev.yml up -d postgres redis

# Run backend locally
cd ../../apps/backend
pnpm dev:backend
```

Or use dev compose:
```bash
docker-compose -f docker-compose.dev.yml up
```

## Common Commands

```bash
# View logs
make logs
make logs-backend
make logs-postgres

# Restart services
make restart

# Stop services
make down

# Clean everything (⚠️ deletes data)
make clean

# Access database
make psql

# Access Redis
make redis-cli

# Prisma Studio
make studio
```

## Troubleshooting

### Port Already in Use

If ports 5432, 6379, or 3001 are already in use:

1. Stop existing services using those ports
2. Or modify ports in `docker-compose.yml`:
   ```yaml
   ports:
     - "5433:5432"  # Use different host port
   ```

### Backend Won't Start

1. Check logs: `make logs-backend`
2. Ensure migrations ran: `make migrate`
3. Verify Prisma Client: `make generate`
4. Check environment variables in `.env`

### Database Connection Issues

1. Verify PostgreSQL is healthy: `docker-compose ps`
2. Check connection string in backend logs
3. Test connection: `make psql`

### Reset Everything

```bash
# Stop and remove all containers and volumes
make clean

# Start fresh
make up
make migrate
```

## Production Deployment

For production:

1. **Use environment-specific compose files**
2. **Set strong passwords** in `.env`
3. **Use Docker secrets** for sensitive data
4. **Enable SSL/TLS** for database
5. **Set up backups** for PostgreSQL
6. **Configure resource limits**
7. **Use reverse proxy** (nginx/Traefik)

## Next Steps

- Set up CI/CD pipeline
- Configure monitoring
- Set up automated backups
- Add admin dashboard service
- Add mobile app build services

