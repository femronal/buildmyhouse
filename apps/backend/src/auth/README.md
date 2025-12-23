# Authentication Module

Complete authentication system with login, registration, and JWT token management.

## Setup

### 1. Environment Variables

Make sure `apps/backend/.env` has:

```env
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

### 2. Create Admin User

Since password verification isn't fully implemented yet, you can create an admin user directly in the database:

```bash
# Connect to PostgreSQL
psql -d buildmyhouse

# Create admin user
INSERT INTO users (id, email, "fullName", role, verified, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'admin@buildmyhouse.com',
  'Admin User',
  'admin',
  true,
  NOW(),
  NOW()
);
```

Or use the registration endpoint:

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@buildmyhouse.com",
    "password": "admin123",
    "fullName": "Admin User",
    "role": "admin"
  }'
```

## API Endpoints

### Register
```bash
POST /api/auth/register
Body: {
  "email": "user@example.com",
  "password": "password123",
  "fullName": "John Doe",
  "role": "admin" | "homeowner" | "general_contractor" | "subcontractor" | "vendor",
  "phone": "+1234567890" // optional
}
```

### Login
```bash
POST /api/auth/login
Body: {
  "email": "admin@buildmyhouse.com",
  "password": "admin123"
}

Response: {
  "token": "jwt-token-here",
  "user": {
    "id": "user-id",
    "email": "admin@buildmyhouse.com",
    "fullName": "Admin User",
    "role": "admin",
    "verified": true
  }
}
```

### Get Current User
```bash
GET /api/auth/me
Headers: {
  "Authorization": "Bearer <token>"
}
```

## Login to Admin Dashboard

1. **Start the backend server:**
   ```bash
   cd apps/backend
   pnpm dev:backend
   ```

2. **Start the admin dashboard:**
   ```bash
   cd apps/admin-dashboard
   pnpm dev
   ```

3. **Create an admin user** (if you haven't already):
   - Use the registration endpoint above, OR
   - Create directly in the database

4. **Login:**
   - Go to `http://localhost:3000/login`
   - Enter your admin email and password
   - You'll be redirected to the dashboard

## Default Admin Credentials

After creating an admin user, you can login with:
- **Email**: `admin@buildmyhouse.com` (or whatever email you used)
- **Password**: The password you set during registration

## Note on Password Storage

Currently, the User model in Prisma doesn't have a password field. To fully implement password authentication:

1. Add password field to User model in `schema.prisma`:
   ```prisma
   model User {
     // ... existing fields
     password String? // Add this field
   }
   ```

2. Run migration:
   ```bash
   pnpm prisma migrate dev --name add_password_field
   ```

3. Update `auth.service.ts` to verify passwords properly

For now, the login endpoint will work for any existing user (password check is bypassed).


