# BuildMyHouse Monorepo

Complete home construction management platform with separate mobile apps for homeowners and contractors, backend API, and admin dashboard.

## 🏗️ Project Structure

```
BuildMyHouse/
├── apps/
│   ├── mobile-homeowner/      # React Native + Expo (Homeowner app)
│   ├── mobile-contractor/     # React Native + Expo (Contractor/Vendor app)
│   ├── backend/               # NestJS API
│   └── admin-dashboard/        # Next.js Admin Panel
├── packages/
│   ├── shared-types/          # Shared TypeScript types
│   ├── shared-ui/             # Shared React Native components
│   └── shared-utils/           # Shared utilities
└── services/
    └── boq-intelligence/       # Python FastAPI service (future)
```

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- PostgreSQL (for backend)
- Expo CLI (for mobile apps)

### Installation

1. Install pnpm globally (if not already installed):
```bash
npm install -g pnpm
```

2. Install all dependencies:
```bash
pnpm install
```

## 📱 Running the Apps

### Mobile Apps (Homeowner)

```bash
pnpm dev:homeowner
# or
cd apps/mobile-homeowner && pnpm start
```

### Mobile Apps (Contractor)

```bash
pnpm dev:contractor
# or
cd apps/mobile-contractor && pnpm start
```

### Backend API

```bash
pnpm dev:backend
# or
cd apps/backend && pnpm start:dev
```

Make sure to set up your `.env` file in `apps/backend/` with:
```
DATABASE_URL="postgresql://user:password@localhost:5432/buildmyhouse"
PORT=3001
JWT_SECRET=your-secret-key
```

### Admin Dashboard

```bash
pnpm dev:admin
# or
cd apps/admin-dashboard && pnpm dev
```

## 🛠️ Development

### Building All Apps

```bash
pnpm build:all
```

### Running Tests

```bash
pnpm test:all
```

### Linting

```bash
pnpm lint:all
```

## 📦 Shared Packages

### @buildmyhouse/shared-types

Shared TypeScript types used across all apps:
- User types
- Project types
- API response types

### @buildmyhouse/shared-ui

Shared React Native components:
- Reusable UI components
- Form components
- Layout components

### @buildmyhouse/shared-utils

Shared utility functions:
- Formatting utilities
- Validation utilities
- Calculation utilities

## 🏛️ Architecture

### Mobile Apps

- **React Native + Expo**: Cross-platform mobile development
- **Expo Router**: File-based routing
- **NativeWind**: Tailwind CSS for React Native
- **React Hook Form + Zod**: Form handling and validation
- **TanStack Query**: Data fetching and caching

### Backend

- **NestJS**: Scalable Node.js framework
- **PostgreSQL + Prisma**: Database and ORM
- **Socket.io**: Real-time communication
- **JWT**: Authentication
- **RBAC**: Role-based access control

### Admin Dashboard

- **Next.js 14**: React framework with App Router
- **TanStack Query**: Data fetching
- **TypeScript**: Type safety

## 🔐 Environment Variables

Create `.env` files in each app directory:

### Backend (`apps/backend/.env`)
```
DATABASE_URL=postgresql://user:password@localhost:5432/buildmyhouse
JWT_SECRET=your-secret-key
PORT=3001
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8081
```

### Mobile Apps
Use Expo's environment variable system or `.env` files.

## 📝 Database Setup

1. Create a PostgreSQL database
2. Update `DATABASE_URL` in `apps/backend/.env`
3. Run migrations:
```bash
cd apps/backend
pnpm prisma:migrate
pnpm prisma:generate
```

## 🚢 Deployment

Each app can be deployed independently:

- **Mobile Apps**: Expo EAS Build
- **Backend**: Docker container or cloud platform (Railway, Render, etc.)
- **Admin Dashboard**: Vercel or similar

## 📚 Tech Stack

- **Mobile**: React Native, Expo, NativeWind, React Navigation
- **Backend**: NestJS, PostgreSQL, Prisma, Socket.io
- **Admin**: Next.js, TypeScript
- **Shared**: TypeScript, pnpm workspaces

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Run tests and linting
4. Submit a pull request

## 📄 License

Private - All rights reserved

