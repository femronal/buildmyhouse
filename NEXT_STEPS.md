# Next Steps - BuildMyHouse Development Roadmap

## 🚀 Immediate Setup (Do This First)

### 1. Install Dependencies

```bash
# From root directory
pnpm install
```

This will install all dependencies for all apps and packages in the monorepo.

### 2. Set Up Backend Database

#### Install PostgreSQL
- **macOS**: `brew install postgresql@14` or use Postgres.app
- **Linux**: `sudo apt-get install postgresql`
- **Windows**: Download from postgresql.org

#### Create Database
```bash
# Connect to PostgreSQL
psql postgres

# Create database
CREATE DATABASE buildmyhouse;

# Exit psql
\q
```

#### Configure Backend Environment
Create `apps/backend/.env`:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/buildmyhouse"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
PORT=3001
ALLOWED_ORIGINS="http://localhost:3000,http://localhost:8081,exp://localhost:8081"
NODE_ENV=development
```

#### Run Database Migrations
```bash
cd apps/backend
pnpm prisma:generate
pnpm prisma:migrate
```

### 3. Test Each App

#### Homeowner Mobile App
```bash
# From root
pnpm dev:homeowner

# Or from app directory
cd apps/mobile-homeowner
pnpm start
```
Then press `w` for web, `i` for iOS simulator, or `a` for Android emulator.

#### Contractor Mobile App
```bash
pnpm dev:contractor
```

#### Backend API
```bash
pnpm dev:backend
```
Should see: `🚀 Backend API running on: http://localhost:3001/api`

#### Admin Dashboard
```bash
pnpm dev:admin
```
Open http://localhost:3000

---

## 📱 Mobile App Configuration

### 1. Update API Endpoints

In both mobile apps, you'll need to create an API client:

**Create `apps/mobile-homeowner/lib/api.ts`:**
```typescript
const API_BASE_URL = __DEV__ 
  ? 'http://localhost:3001/api' 
  : 'https://api.buildmyhouse.com/api';

export const api = {
  get: async (endpoint: string) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`);
    return response.json();
  },
  // Add post, put, delete methods
};
```

Do the same for `apps/mobile-contractor/lib/api.ts`.

### 2. Set Up TanStack Query

Install in mobile apps:
```bash
cd apps/mobile-homeowner
pnpm add @tanstack/react-query
```

Create query hooks for data fetching.

### 3. Add React Hook Form + Zod

```bash
cd apps/mobile-homeowner
pnpm add react-hook-form zod @hookform/resolvers
```

---

## 🔐 Authentication Setup

### 1. Choose Auth Provider

**Option A: Clerk (Recommended for MVP)**
```bash
cd apps/backend
pnpm add @clerk/clerk-sdk-node
```

**Option B: Custom JWT (More control)**
Already set up in backend structure - implement auth module.

### 2. Implement RBAC

Create `apps/backend/src/auth/rbac.guard.ts`:
- Homeowner can only access their projects
- GC can manage assigned projects
- Vendors can only manage their catalog
- Admin has full access

---

## 🔌 Connect Mobile Apps to Backend

### 1. Create API Service Layer

**Example: `apps/mobile-homeowner/services/projectService.ts`**
```typescript
import { api } from '@/lib/api';
import { Project } from '@buildmyhouse/shared-types';

export const projectService = {
  getProjects: async (): Promise<Project[]> => {
    return api.get('/projects');
  },
  getProject: async (id: string): Promise<Project> => {
    return api.get(`/projects/${id}`);
  },
  // Add more methods
};
```

### 2. Use TanStack Query

```typescript
import { useQuery } from '@tanstack/react-query';
import { projectService } from '@/services/projectService';

export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: projectService.getProjects,
  });
}
```

---

## 📦 Shared Packages Setup

### 1. Use Shared Types

Update imports in mobile apps:
```typescript
// Instead of local types
import { User, Project, Stage } from '@buildmyhouse/shared-types';
```

### 2. Use Shared Utils

```typescript
import { formatCurrency, calculateProgress } from '@buildmyhouse/shared-utils';
```

### 3. Use Shared UI Components

```typescript
import { ImageCarousel } from '@buildmyhouse/shared-ui';
```

---

## 🗄️ Database Development

### 1. Add More Models to Prisma Schema

Edit `apps/backend/prisma/schema.prisma`:
- Add Material model
- Add Contractor model
- Add Order model
- Add Review model

### 2. Create Migrations

```bash
cd apps/backend
pnpm prisma:migrate dev --name add_materials_table
```

### 3. Seed Database (Optional)

Create `apps/backend/prisma/seed.ts` for test data.

---

## 🔔 Real-time Features

### 1. Set Up Socket.io

Backend already has socket.io in dependencies. Implement:
- Real-time project updates
- Chat messages
- Stage completion notifications

### 2. Push Notifications

Set up Firebase Cloud Messaging:
```bash
cd apps/mobile-homeowner
pnpm add @react-native-firebase/app @react-native-firebase/messaging
```

---

## 🛒 Marketplace Implementation

### 1. Create Marketplace Module

In `apps/backend/src/marketplace/`:
- Materials controller
- Contractors controller
- Search functionality
- Reviews/ratings

### 2. Integrate Search

Add Meilisearch or Elasticsearch for product/contractor search.

---

## 💳 Payments Integration

### 1. Set Up Stripe

```bash
cd apps/backend
pnpm add stripe
```

Add to `.env`:
```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 2. Implement Payment Endpoints

- Create payment intent
- Handle webhooks
- Process payouts to contractors

---

## 📊 Admin Dashboard Development

### 1. Build Admin UI

In `apps/admin-dashboard/src/app/`:
- Dashboard overview
- User management
- Project monitoring
- Verification workflow
- Dispute resolution

### 2. Connect to Backend

Use TanStack Query to fetch data from backend API.

---

## 🧪 Testing Setup

### 1. Unit Tests

```bash
cd apps/backend
pnpm test
```

### 2. E2E Tests

Set up Playwright or Cypress for admin dashboard.

### 3. Mobile App Testing

Use React Native Testing Library:
```bash
cd apps/mobile-homeowner
pnpm test
```

---

## 🚢 Deployment Preparation

### 1. Environment Variables

Create `.env.example` files in each app:
- `apps/backend/.env.example`
- `apps/mobile-homeowner/.env.example`
- `apps/admin-dashboard/.env.example`

### 2. Docker Setup

Create `infrastructure/docker/docker-compose.yml`:
- PostgreSQL service
- Backend service
- Redis service (for caching)

### 3. CI/CD Pipeline

Set up GitHub Actions (`.github/workflows/ci.yml`):
- Run tests
- Build apps
- Deploy to staging/production

---

## 📋 Development Priorities

### Phase 1: Core Functionality (Week 1-2)
- [x] Backend authentication
- [x] User registration/login
- [x] Project CRUD operations
- [x] Basic mobile app → backend connection

### Phase 2: Project Management (Week 3-4)
- [x] Stage management
- [x] Timeline tracking
- [x] File uploads (plans, photos)
- [x] Real-time updates

### Phase 3: Marketplace (Week 5-6)
- [x] Material catalog
- [x] Contractor listings
- [x] Search functionality
- [x] Reviews/ratings

### Phase 4: Payments (Week 7-8)
- [ ] Payment processing
- [ ] Invoice generation
- [ ] Payouts to contractors
- [ ] Financial tracking

### Phase 5: Advanced Features (Week 9+)
- [ ] Chat/messaging
- [ ] Push notifications
- [ ] BOQ intelligence service
- [ ] Analytics dashboard

---

## 🐛 Common Issues & Solutions

### Issue: "Cannot find module @buildmyhouse/shared-*"
**Solution**: Run `pnpm install` from root, ensure workspace packages are linked.

### Issue: Metro bundler cache errors
**Solution**: 
```bash
cd apps/mobile-homeowner
pnpm start --clear
```

### Issue: Prisma client not generated
**Solution**:
```bash
cd apps/backend
pnpm prisma:generate
```

### Issue: Port already in use
**Solution**: Change PORT in `.env` or kill process using that port.

---

## 📚 Resources

- [NestJS Documentation](https://docs.nestjs.com/)
- [Expo Documentation](https://docs.expo.dev/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [TanStack Query](https://tanstack.com/query/latest)
- [pnpm Workspaces](https://pnpm.io/workspaces)

---

## ✅ Quick Start Checklist

- [ ] Install dependencies: `pnpm install`
- [ ] Set up PostgreSQL database
- [ ] Create backend `.env` file
- [ ] Run database migrations
- [ ] Test backend: `pnpm dev:backend`
- [ ] Test homeowner app: `pnpm dev:homeowner`
- [ ] Test contractor app: `pnpm dev:contractor`
- [ ] Test admin dashboard: `pnpm dev:admin`
- [ ] Set up authentication
- [ ] Connect mobile apps to backend
- [ ] Start building features!

---

**Ready to build! 🚀**

Start with Phase 1 and work through the priorities. The foundation is solid - now it's time to add the features that make BuildMyHouse great!

