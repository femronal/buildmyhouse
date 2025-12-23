# Admin Dashboard

Admin dashboard for BuildMyHouse platform built with Next.js, TanStack Query, and Tailwind CSS.

## Features

- ✅ Dashboard overview with statistics
- ✅ User management with verification
- ✅ Project monitoring and status management
- ✅ Verification workflow for users, materials, and contractors
- ✅ Dispute resolution interface
- ✅ JWT authentication
- ✅ Advanced filtering, sorting, and search
- ✅ Clean UI with Lucide React icons
- ✅ Poppins font (matching homeowner app)

## Setup

### 1. Environment Variables

Create `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Run Development Server

```bash
pnpm dev
```

The dashboard will be available at `http://localhost:3000`

## Authentication

The dashboard uses JWT token-based authentication:

1. Login page at `/login`
2. Tokens stored in `localStorage`
3. Automatic token injection in API requests
4. Protected routes redirect to login if not authenticated

## API Integration

All API endpoints are configured in `src/lib/api.ts`:

- **Users**: `/users`, `/users/:id`
- **Projects**: `/projects`, `/projects/:id`
- **Payments**: `/payments`, `/payments/my`
- **Marketplace**: `/marketplace/materials`, `/marketplace/contractors`, `/marketplace/reviews`
- **Search**: `/marketplace/search`

## Features by Page

### Dashboard (`/dashboard`)
- Overview statistics
- Recent activity feed
- Quick action buttons

### Users (`/users`)
- User listing with pagination
- Search by name/email
- Filter by role and verification status
- Role management
- One-click verification

### Projects (`/projects`)
- Project listing with pagination
- Search functionality
- Filter by status
- Sort by date, name, budget, progress
- Status management

### Verification (`/verification`)
- Pending user verifications
- Pending material verifications
- Pending contractor verifications
- Batch verification actions

### Disputes (`/disputes`)
- Dispute listing
- Status tracking
- Resolution interface
- Dispute statistics

## Tech Stack

- **Next.js 14** - React framework
- **TanStack Query** - Data fetching and caching
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **Poppins Font** - Typography (matching homeowner app)

## Backend Endpoints Required

The dashboard expects these backend endpoints:

### Users
- `GET /api/users` - List users (with pagination, filters)
- `GET /api/users/:id` - Get user details
- `PATCH /api/users/:id` - Update user (role, verified status)

### Projects
- `GET /api/projects` - List projects (with pagination, filters, sorting)
- `GET /api/projects/:id` - Get project details
- `PATCH /api/projects/:id` - Update project status

### Payments
- `GET /api/payments/my` - Get user payments
- `GET /api/payments/project/:projectId` - Get project payments

### Marketplace
- `GET /api/marketplace/materials` - List materials
- `GET /api/marketplace/contractors` - List contractors
- `PATCH /api/marketplace/materials/:id` - Update material
- `PATCH /api/marketplace/contractors/:id` - Update contractor

### Auth
- `POST /api/auth/login` - Login endpoint
- `GET /api/auth/me` - Get current user

## Next Steps

1. **Implement Backend Endpoints**: Create the actual API endpoints in the backend
2. **Add Real Authentication**: Connect to your auth service
3. **Add More Features**: Analytics, reports, export functionality
4. **Add Real-time Updates**: WebSocket integration for live data


