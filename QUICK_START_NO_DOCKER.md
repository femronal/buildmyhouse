# 🚀 Quick Start Without Docker

If you don't have Docker installed or prefer to use PostgreSQL directly, follow this guide.

## 1. Install PostgreSQL

### On macOS (using Homebrew):
```bash
# Install PostgreSQL
brew install postgresql@15

# Start PostgreSQL service
brew services start postgresql@15

# Verify it's running
brew services list | grep postgresql
```

### On Ubuntu/Debian:
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

---

## 2. Create Database

```bash
# Create the database
createdb buildmyhouse

# Verify it was created
psql -l | grep buildmyhouse
```

---

## 3. Configure Backend

```bash
cd /Users/mac/Desktop/Entrepreneurship/BuildMyHouse/apps/backend

# Update .env file with local PostgreSQL connection
# Replace YOUR_USERNAME with your actual username (run: whoami)
```

**Edit `apps/backend/.env`:**
```bash
DATABASE_URL="postgresql://YOUR_USERNAME@localhost:5432/buildmyhouse"
```

**Find your username:**
```bash
whoami
```

Example if your username is "mac":
```bash
DATABASE_URL="postgresql://mac@localhost:5432/buildmyhouse"
```

---

## 4. Run Migrations

```bash
cd /Users/mac/Desktop/Entrepreneurship/BuildMyHouse/apps/backend

# Generate Prisma client
pnpm prisma:generate

# Run migrations
pnpm prisma:migrate dev

# Seed the database
pnpm prisma:seed
```

---

## 5. Start Backend

```bash
cd /Users/mac/Desktop/Entrepreneurship/BuildMyHouse/apps/backend
pnpm dev
```

You should see:
```
🚀 Backend API running on: http://localhost:3001/api
```

---

## 6. Start Mobile App

```bash
# New terminal
cd /Users/mac/Desktop/Entrepreneurship/BuildMyHouse/apps/mobile-homeowner
pnpm start
```

---

## 🧪 Verify It Works

```bash
# Test health endpoint
curl http://localhost:3001/api/health

# Should return:
{"status":"ok","timestamp":"2024-01-..."}
```

---

## 🔧 Troubleshooting

### PostgreSQL not starting?
```bash
# Check if it's running
brew services list

# Stop and restart
brew services stop postgresql@15
brew services start postgresql@15
```

### Can't create database?
```bash
# Make sure PostgreSQL is running first
brew services list | grep postgresql

# Try with full path
/opt/homebrew/bin/createdb buildmyhouse
```

### Connection error?
```bash
# Check your username
whoami

# Make sure DATABASE_URL matches your username
# Example: postgresql://mac@localhost:5432/buildmyhouse
```

### Prisma migration errors?
```bash
# Reset database (WARNING: deletes all data)
cd apps/backend
pnpm prisma:migrate reset

# Then seed again
pnpm prisma:seed
```

---

## 📊 PostgreSQL Management

### Useful Commands

```bash
# Connect to database
psql buildmyhouse

# Inside psql:
\dt              # List tables
\d users         # Describe users table
SELECT * FROM users;  # Query users
\q              # Quit
```

### Stop PostgreSQL

```bash
# Stop the service
brew services stop postgresql@15
```

### Uninstall (if needed)

```bash
# Stop service
brew services stop postgresql@15

# Uninstall
brew uninstall postgresql@15

# Remove data (optional)
rm -rf /opt/homebrew/var/postgresql@15
```

---

## ✅ Success Checklist

- [ ] PostgreSQL installed and running
- [ ] Database "buildmyhouse" created
- [ ] .env file updated with correct DATABASE_URL
- [ ] Migrations run successfully
- [ ] Database seeded with test data
- [ ] Backend starts on port 3001
- [ ] Health check returns {"status":"ok"}
- [ ] Mobile app can connect to backend

---

## 🎯 Next Steps

Once everything is running:

1. **Login** with test credentials:
   - Email: `homeowner@test.com`
   - Password: `password123`

2. **Explore features:**
   - View projects on home screen
   - Check out marketplace in Shop tab
   - Upload files in timeline

3. **Read documentation:**
   - `START_HERE.md` for complete guide
   - `MARKETPLACE_API_GUIDE.md` for API reference

---

## 💡 Pro Tips

### Keep PostgreSQL Running
```bash
# Add to startup (optional)
brew services start postgresql@15
```

### Database Backup
```bash
# Backup
pg_dump buildmyhouse > backup.sql

# Restore
psql buildmyhouse < backup.sql
```

### View Logs
```bash
# PostgreSQL logs
tail -f /opt/homebrew/var/log/postgresql@15.log
```

---

**Status: ✅ Ready to develop without Docker!**

Need Docker later? You can always switch back by:
1. Installing Docker Desktop
2. Running `docker compose up postgres -d`
3. Updating DATABASE_URL back to Docker settings
