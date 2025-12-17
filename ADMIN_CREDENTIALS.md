# 🔐 Admin Credentials

## Default Admin Account

After running the database seed, you can login with:

- **Email:** `admin@buildmyhouse.com`
- **Password:** `password123`

## How to Seed Database

```bash
cd apps/backend
pnpm prisma:seed
```

This will create all test users including the admin account.

## All Test Credentials

### Admin
- **Email:** `admin@buildmyhouse.com`
- **Password:** `password123`
- **Role:** `admin`

### Homeowner
- **Email:** `homeowner@example.com`
- **Password:** `password123`
- **Role:** `homeowner`

### General Contractor
- **Email:** `gc@example.com`
- **Password:** `password123`
- **Role:** `general_contractor`

### Subcontractor
- **Email:** `sub@example.com`
- **Password:** `password123`
- **Role:** `subcontractor`

### Vendor
- **Email:** `vendor@example.com`
- **Password:** `password123`
- **Role:** `vendor`

---

## 🔒 Security Note

**These are default test credentials. Change them in production!**

To change the admin password, you can:
1. Update the seed file (`apps/backend/prisma/seed.ts`)
2. Or use the admin dashboard to change password (once implemented)
3. Or manually update in the database
