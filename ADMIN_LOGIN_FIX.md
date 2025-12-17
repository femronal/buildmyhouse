# 🔐 Admin Login Fix

## ❌ Error

```
Failed to fetch
POST http://localhost:3001/api/auth/login net::ERR_CONNECTION_REFUSED
```

**This means the backend server is not running!**

---

## ✅ Solution: Start the Backend

### Option 1: From Root Directory (Recommended)

```bash
# From the root of the project
pnpm dev:backend
```

### Option 2: From Backend Directory

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

1. **Check health endpoint:**
   - Open: http://localhost:3001/api/health
   - Should show: `{"status":"ok","timestamp":"..."}`

2. **Or test in terminal:**
   ```bash
   curl http://localhost:3001/api/health
   ```

---

## 📝 Admin Credentials

After seeding the database:

- **Email:** `admin@buildmyhouse.com`
- **Password:** `password123`

### If Admin User Doesn't Exist

Seed the database:

```bash
cd apps/backend
pnpm prisma:seed
```

This creates all test users including the admin.

---

## 🐛 Troubleshooting

### Backend Won't Start?

1. **Check if database is running:**
   ```bash
   # macOS
   brew services list | grep postgresql
   ```

2. **Check if .env file exists:**
   ```bash
   ls apps/backend/.env
   ```

3. **Check database connection:**
   - Make sure `DATABASE_URL` in `.env` is correct
   - Make sure PostgreSQL is running
   - Make sure database `buildmyhouse` exists

4. **Check port 3001 is free:**
   ```bash
   lsof -i :3001
   ```
   If something is using it, kill it or change PORT in `.env`

---

## ✅ Quick Checklist

- [ ] Backend server is running (`pnpm dev:backend`)
- [ ] Health check works: http://localhost:3001/api/health
- [ ] Database is seeded: `pnpm prisma:seed` (if needed)
- [ ] Try login again with admin credentials

---

## 🎯 Once Backend is Running

1. Go to admin dashboard login page
2. Enter:
   - Email: `admin@buildmyhouse.com`
   - Password: `password123`
3. Click login
4. Should work! 🎉

---

**The backend must be running for the admin login to work!**

