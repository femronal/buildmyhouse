# 🚀 How to Start the Backend Server

## ❌ Error You're Seeing

```
Failed to fetch
POST http://localhost:3001/api/auth/login net::ERR_CONNECTION_REFUSED
```

This means the backend server is **not running**. Let's fix it!

---

## ✅ Quick Start (3 Steps)

### Step 1: Check Database is Running

Make sure PostgreSQL is running:

```bash
# Check if PostgreSQL is running (macOS)
brew services list | grep postgresql

# Or check if you can connect
psql postgres -c "SELECT version();"
```

If PostgreSQL is not running:
```bash
# Start PostgreSQL (macOS)
brew services start postgresql@14

# Or use Postgres.app
```

### Step 2: Check Backend Environment File

Make sure `apps/backend/.env` exists and has these variables:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/buildmyhouse"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
PORT=3001
ALLOWED_ORIGINS="http://localhost:3000,http://localhost:8081,exp://localhost:8081"
NODE_ENV=development
GOOGLE_CLIENT_ID="your-google-client-id-from-console"
GOOGLE_CLIENT_SECRET="your-google-client-secret-from-console"
GOOGLE_CALLBACK_URL="http://localhost:3001/api/auth/google/callback"
```

**Replace `username` and `password` with your PostgreSQL credentials!**

### Step 3: Start the Backend

From the **root directory**:

```bash
pnpm dev:backend
```

Or from the backend directory:

```bash
cd apps/backend
pnpm start:dev
```

You should see:
```
🚀 Backend API running on: http://localhost:3001/api
🔌 WebSocket server ready for real-time connections
💚 Health check available at: http://localhost:3001/api/health
```

---

## 🔍 Verify Backend is Running

Open in your browser:
- http://localhost:3001/api/health

You should see:
```json
{
  "status": "ok",
  "timestamp": "2024-..."
}
```

---

## 🗄️ Database Setup (If Not Done)

If you haven't set up the database yet:

### 1. Create Database

```bash
psql postgres

# In psql:
CREATE DATABASE buildmyhouse;
\q
```

### 2. Run Migrations

```bash
cd apps/backend
pnpm prisma:generate
pnpm prisma:migrate
```

### 3. Seed Database (Optional - Creates Test Users)

```bash
cd apps/backend
pnpm prisma:seed
```

This creates the admin user:
- **Email:** `admin@buildmyhouse.com`
- **Password:** `password123`

---

## 🐛 Troubleshooting

### Backend Won't Start

1. **Check if port 3001 is already in use:**
   ```bash
   lsof -i :3001
   ```
   If something is using it, kill it or change the port in `.env`

2. **Check database connection:**
   ```bash
   psql postgres -c "\l" | grep buildmyhouse
   ```
   If database doesn't exist, create it (see above)

3. **Check .env file exists:**
   ```bash
   ls apps/backend/.env
   ```
   If it doesn't exist, create it (see Step 2)

4. **Check dependencies are installed:**
   ```bash
   cd apps/backend
   pnpm install
   ```

### Still Having Issues?

1. **Check backend logs** for error messages
2. **Verify DATABASE_URL** in `.env` is correct
3. **Make sure PostgreSQL is running**
4. **Try restarting PostgreSQL:**
   ```bash
   brew services restart postgresql@14
   ```

---

## 📝 Admin Login Credentials

After seeding the database:

- **Email:** `admin@buildmyhouse.com`
- **Password:** `password123`

---

## ✅ Complete Setup Checklist

- [ ] PostgreSQL is installed and running
- [ ] Database `buildmyhouse` exists
- [ ] `apps/backend/.env` file exists with correct values
- [ ] Dependencies installed: `pnpm install`
- [ ] Database migrations run: `pnpm prisma:migrate`
- [ ] Database seeded (optional): `pnpm prisma:seed`
- [ ] Backend started: `pnpm dev:backend`
- [ ] Backend health check works: http://localhost:3001/api/health
- [ ] Admin dashboard can connect to backend

---

## 🎯 Quick Commands Reference

```bash
# Start backend (from root)
pnpm dev:backend

# Start backend (from apps/backend)
cd apps/backend
pnpm start:dev

# Check backend health
curl http://localhost:3001/api/health

# Seed database
cd apps/backend
pnpm prisma:seed

# View database
cd apps/backend
pnpm prisma:studio
```

---

Once the backend is running, try logging in again! 🎉

