# How to Login to Admin Dashboard

## Quick Start

### Step 1: Register an Admin User

1. **Start the backend:**
   ```bash
   cd apps/backend
   pnpm dev:backend
   ```

2. **Register an admin user** (in a new terminal):
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

   You should get a response with a token and user info.

### Step 2: Start Admin Dashboard

```bash
cd apps/admin-dashboard
pnpm dev
```

### Step 3: Login

1. Go to `http://localhost:3000/login`
2. Enter your credentials:
   - **Email**: `admin@buildmyhouse.com`
   - **Password**: `admin123`
3. Click "Sign In"
4. You'll be redirected to the dashboard

## Alternative: Create Admin via Database

If you prefer to create the user directly in the database:

```bash
# Connect to PostgreSQL
psql -d buildmyhouse

# Create admin user with hashed password
# Password: "admin123" (hashed)
INSERT INTO users (id, email, password, "fullName", role, verified, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'admin@buildmyhouse.com',
  '$2b$10$PIzLBpdhtPbZ6gCnhT7OXe5xn.Y604IGzayL0zP.318fB046MJgVy',
  'Admin User',
  'admin',
  true,
  NOW(),
  NOW()
);
```

Then login with:
- **Email**: `admin@buildmyhouse.com`
- **Password**: `admin123`

## Default Password for Existing Users

If you had users created before the password field was added, they have a default password:
- **Password**: `temp123`

⚠️ **Important**: Change this password after first login!

## Troubleshooting

### "Invalid credentials" error
- Make sure the user exists in the database
- Verify the password is correct
- Check that the backend is running on port 3001
- Ensure the email is correct

### Can't connect to backend
- Check `NEXT_PUBLIC_API_URL` in `.env.local` is set to `http://localhost:3001/api`
- Make sure backend is running: `pnpm dev:backend`
- Verify backend is accessible: `curl http://localhost:3001/api/auth/login`

### Token not working
- Check that `JWT_SECRET` is set in backend `.env`
- Try logging out and logging back in
- Clear browser localStorage and try again

### Migration errors
If you get migration errors:
```bash
cd apps/backend
pnpm prisma migrate reset  # WARNING: This deletes all data
pnpm prisma migrate dev
```

## Security Notes

✅ **Password verification is now fully implemented!**
- Passwords are hashed with bcrypt
- Password verification happens on every login
- Tokens expire after 7 days

For production:
- Use strong passwords
- Implement password reset functionality
- Add rate limiting to login endpoint
- Use HTTPS
- Consider 2FA for admin accounts



