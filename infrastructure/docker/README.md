# Docker Setup

Docker Compose configuration for BuildMyHouse services.

## Services

- **PostgreSQL** - Database (port 5432)
- **Redis** - Caching and session storage (port 6379)
- **Backend** - NestJS API (port 3001)

## Quick Start

### Production

1. **Copy environment file:**
   ```bash
   cp .env.example .env
   # Edit .env with your values
   ```

2. **Start all services:**
   ```bash
   docker-compose up -d
   ```

3. **Run database migrations:**
   ```bash
   docker-compose exec backend pnpm prisma migrate deploy
   ```

4. **Check services:**
   ```bash
   docker-compose ps
   ```

### Development

1. **Start services (database and Redis only):**
   ```bash
   docker-compose -f docker-compose.dev.yml up -d postgres redis
   ```

2. **Run backend locally with hot reload:**
   ```bash
   cd ../../apps/backend
   pnpm dev:backend
   ```

   Or use the dev docker-compose:
   ```bash
   docker-compose -f docker-compose.dev.yml up
   ```

## Commands

### Start services
```bash
docker-compose up -d
```

### Stop services
```bash
docker-compose down
```

### View logs
```bash
docker-compose logs -f backend
docker-compose logs -f postgres
docker-compose logs -f redis
```

### Stop and remove volumes (⚠️ deletes data)
```bash
docker-compose down -v
```

### Rebuild backend
```bash
docker-compose build backend
docker-compose up -d backend
```

### Access PostgreSQL
```bash
docker-compose exec postgres psql -U buildmyhouse -d buildmyhouse
```

### Access Redis CLI
```bash
docker-compose exec redis redis-cli
```

### Run Prisma migrations
```bash
docker-compose exec backend pnpm prisma migrate deploy
```

### Run Prisma Studio
```bash
docker-compose exec backend pnpm prisma studio
# Then access at http://localhost:5555
```

## Environment Variables

Create `.env` file in this directory:

```env
JWT_SECRET=your-secret-key
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## Database Connection

From host machine:
- Host: `localhost`
- Port: `5432`
- User: `buildmyhouse`
- Password: `buildmyhouse_password`
- Database: `buildmyhouse`

From within Docker network:
- Host: `postgres`
- Port: `5432`
- User: `buildmyhouse`
- Password: `buildmyhouse_password`
- Database: `buildmyhouse`

## Redis Connection

From host machine:
- Host: `localhost`
- Port: `6379`

From within Docker network:
- Host: `redis`
- Port: `6379`
- URL: `redis://redis:6379`

## Health Checks

All services include health checks:
- PostgreSQL: `pg_isready`
- Redis: `redis-cli ping`
- Backend: HTTP GET to `/api/health` (you may need to add this endpoint)

## Volumes

Data is persisted in Docker volumes:
- `postgres_data` - PostgreSQL data
- `redis_data` - Redis data

To backup:
```bash
docker run --rm -v buildmyhouse_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres-backup.tar.gz /data
```

## Troubleshooting

### Port already in use
Change ports in `docker-compose.yml`:
```yaml
ports:
  - "5433:5432"  # Use 5433 instead of 5432
```

### Database connection errors
- Check if PostgreSQL container is running: `docker-compose ps`
- Check logs: `docker-compose logs postgres`
- Verify DATABASE_URL in backend environment

### Backend won't start
- Check logs: `docker-compose logs backend`
- Ensure migrations are run: `docker-compose exec backend pnpm prisma migrate deploy`
- Verify Prisma Client is generated: `docker-compose exec backend pnpm prisma generate`

### Permission errors
On Linux, you may need to fix permissions:
```bash
sudo chown -R $USER:$USER .
```

## Production Considerations

1. **Change default passwords** in production
2. **Use secrets management** (Docker secrets, AWS Secrets Manager, etc.)
3. **Enable SSL/TLS** for database connections
4. **Set up backups** for PostgreSQL
5. **Configure resource limits** in docker-compose.yml
6. **Use reverse proxy** (nginx, Traefik) for production
7. **Set up monitoring** (Prometheus, Grafana)

## Health Check Endpoint

The backend includes a health check endpoint at `/api/health` that returns:
```json
{
  "status": "ok",
  "timestamp": "2024-12-15T..."
}
```

This endpoint is used by Docker health checks to verify the backend is running.
