# BuildMyHouse Codebase Reference for ChatGPT

Last updated: 2026-03-23  
Scope: `apps/admin-dashboard`, `apps/mobile-homeowner`, `apps/mobile-contractor`, `apps/backend`, and shared monorepo packages.

Use this document as an attached source in your BuildMyHouse ChatGPT project so answers can stay grounded in the actual implementation.

---

## 1) What BuildMyHouse Is

BuildMyHouse is a monorepo for a construction ecosystem with four shipped app surfaces:

- Homeowner app (`apps/mobile-homeowner`) for project setup, marketplace, payment, and communication.
- GC app (`apps/mobile-contractor`) for general contractor onboarding, verification, requests, delivery, and payouts/bank details.
- Admin dashboard (`apps/admin-dashboard`) for operations, trust/safety, listing moderation, disputes, and monitoring.
- Backend API (`apps/backend`) for auth, data, business logic, notifications, and integrations.

There are also shared packages:

- `packages/shared-types`
- `packages/shared-ui`
- `packages/shared-utils`

Monorepo/workspace is managed with `pnpm` (`package.json`, `pnpm-workspace.yaml`).

---

## 2) Monorepo and Runtime Foundations

### Tooling and runtime

- Node baseline: `>=18` (root and backend workflows/scripts).
- Package manager: `pnpm@9.14.2`.
- Workspace globs: `apps/*`, `packages/*`, `services/*`.

### Core scripts (root)

- `pnpm dev:homeowner`
- `pnpm dev:contractor`
- `pnpm dev:backend`
- `pnpm dev:admin`
- `pnpm build:all`
- `pnpm test:all`
- `pnpm lint:all`

### Shared packages (current practical use)

- `@buildmyhouse/shared-types`: common TS models (roles, project/stage/payment/message/api response contracts).
- `@buildmyhouse/shared-ui`: shared component export (currently `ImageCarousel`).
- `@buildmyhouse/shared-utils`: utility helpers (`formatCurrency`, `formatDate`, validation, progress math).

---

## 3) System Architecture (High-Level)

### Client applications

1. **Homeowner app** (Expo + React Native + Expo Router + React Query + NativeWind)
2. **GC app** (Expo + React Native + Expo Router + React Query + NativeWind)
3. **Admin dashboard** (Next.js 14 App Router + React Query + Tailwind)

### Backend

- **NestJS API** with global prefix `/api`.
- **Prisma + PostgreSQL** as the source of truth.
- **JWT-based auth** + role checks.
- **WebSocket gateway** (Socket.IO) for realtime notifications/chat events.
- **3rd-party integrations**: Stripe, AWS S3, Resend email, Google OAuth, OpenAI service.

---

## 4) Backend Deep Reference (`apps/backend`)

### Tech stack

- NestJS 10, Prisma 5, PostgreSQL
- JWT/passport auth
- Socket.IO gateway
- Stripe payments/webhooks
- S3 upload support
- Resend email
- Scheduler (`@nestjs/schedule`)
- Rate limiting (`@nestjs/throttler`)

### Main module map

- `auth/`
- `admin/`
- `projects/`
- `chat/`
- `marketplace/`
- `payments/`
- `plans/`
- `contractors/`
- `designs/`
- `houses/`
- `lands/`
- `rentals/`
- `users/`
- `notifications/`
- `push-tokens/`
- `upload/`
- `websocket/`
- `email/`
- `openai/`
- `prisma/`

### Authentication and authorization model

- JWT payload includes `sub`, `email`, `role`.
- `JwtAuthGuard` protects authenticated routes.
- Role access via `RolesGuard` and `@Roles(...)`.
- Google OAuth:
  - Browser flow (`/auth/google`, callback)
  - Mobile exchange (`/auth/google/mobile`)
- Admin routes enforce `role=admin` where applicable.

### Core domain model (Prisma)

Key entities and relationships in `prisma/schema.prisma`:

- **User** (role-based actor model)
- **Project** with optional assigned GC
- **Stage** (project breakdown)
- **Payment** (project/stage-linked transactions)
- **Conversation / Message** (chat)
- **Contractor** (GC profile + verification + bank/connect details)
- **Design / DesignImage** (design catalog + moderation status)
- **HouseForSale / LandForSale / RentalListing**
- **HouseViewingInterest / LandViewingInterest / RentalViewingInterest**
- **ProjectRequest** (homeowner/GC request workflow)
- **ProjectStageDispute**
- **PushToken / Notification**
- Marketplace entities: **Material**, **Order**, **OrderItem**, **Review**

### API capability map (by module)

- `auth`: register/login, Google auth, profile, password, picture upload.
- `admin`: admin dashboard aggregate metrics.
- `projects`: lifecycle, stages, stage docs/media/materials, disputes, status/risk/review workflows.
- `chat`: conversations/messages/read state.
- `payments`: intents/history/payout/stripe webhook.
- `marketplace`: materials, contractors, reviews, search endpoints.
- `contractors`: profile, verification docs, bank accounts, connect/account operations.
- `designs`: create/list/review/approve/reject.
- `houses` / `lands` / `rentals`: listing management + viewing interest handling.
- `users`: admin user views/verification updates.
- `notifications`: user notifications read/mark endpoints.
- `push-tokens`: device token registration.
- `upload`: image/document upload endpoints.

### Realtime and background processing

- Socket gateway validates identity and serves conversation/project rooms.
- Realtime events are emitted for notifications/chat/project updates.
- Scheduled reminder for GC verification (`notifications` scheduler).

### Operational and deployment details

- Local env template: `apps/backend/.env.example`.
- Prisma migrations under `apps/backend/prisma/migrations`.
- Seed flow: `apps/backend/prisma/seed.ts`.
- Docker production image runs migrations (`prisma migrate deploy`) then boots app.
- Health endpoint: `/api/health`.

### Observed implementation notes

- `AuthService` uses direct `new PrismaClient()` while many modules use `PrismaService` (consistency risk).
- Some docs mention TODOs not fully implemented (for example OpenAI PDF extraction comments).
- Dependency list includes libraries that may not all be actively used in current runtime paths.

---

## 5) Admin Dashboard Deep Reference (`apps/admin-dashboard`)

### Stack and architecture

- Next.js 14 App Router
- React Query data layer
- Tailwind styling
- Client-side auth gate pattern
- Standalone output build for Docker deploy

### Auth/session behavior

- Token stored in `localStorage` as `auth_token`.
- Login hits backend `/auth/login`.
- `ProtectedRoute` redirects unauthenticated users to `/login`.
- API layer attaches `Authorization: Bearer <token>`.
- 401 responses clear auth token and redirect to login.

### Route/page map and purpose

- `/` -> redirects to `/dashboard`
- `/login` -> admin sign-in
- `/dashboard` -> operational stats and activity
- `/homeowners` -> homeowner list/review
- `/contractors` -> contractor list/review + bank details modal
- `/projects` -> project monitoring and status workflows
- `/verification` -> GC verification + project docs verification
- `/disputes` -> dispute review and status actions
- `/land` -> land listing operations and viewing interests
- `/houses` -> house listing operations and viewing interests
- `/rentals` -> rental listing operations and viewing interests
- `/users` -> redirect to `/homeowners`
- `/health` -> health response route

### Important component/hook layers

- Components:
  - `ProtectedRoute`
  - `Sidebar`
  - `NotificationBell`
  - `HomeownerViewModal`
  - `ContractorViewModal`
  - `BankDetailsModal`
  - `AdminViewingInterestAvatar`
- Hooks cover each admin domain: users, homeowners, contractors, projects, disputes, notifications, and listing/viewing-interest modules.
- API helper centralizes base URL + auth headers + upload behavior.

### Test and CI status

- Playwright E2E setup exists in `e2e/` with route/auth/navigation/project/homeowner coverage.
- Root CI workflow runs lint/test/build across apps; some jobs are `continue-on-error`.

---

## 6) Homeowner App Deep Reference (`apps/mobile-homeowner`)

### Stack and runtime

- Expo 54 + React Native + React 19
- Expo Router for file-based navigation
- React Query for remote state
- NativeWind styling
- Socket client + push notification hooks

### Main product flows

- Authentication (email and Google; Apple sign-in support in auth utility).
- Homeowner onboarding and project creation journey.
- Marketplace browsing: houses, land, rentals.
- Viewing/inspection interests for property flows.
- Project tracking and stage-related activity.
- Payments/billing flows with Stripe support.
- Chat and notifications.
- Profile/settings routes.

### Platform-specific behavior

- Separate web location implementation in `app/location.web.tsx` (no native map rendering).
- Native map/location flow in `app/location.tsx`.
- Stripe provider split across native and web adapters (`lib/stripe.native.tsx`, `lib/stripe.web.tsx`).
- Push registration avoids web token flow where unsupported.

### Environment expectations

- `.env.example` includes API URL, Stripe key, maps key, Google auth values.
- API base expects `/api` suffix.

---

## 7) GC App Deep Reference (`apps/mobile-contractor`)

### Stack and runtime

- Expo 54 + React Native + Expo Router + React Query + NativeWind
- Similar auth/token/socket architecture to homeowner app

### Main product flows

- GC login and role-gated session bootstrap.
- GC dashboard and request management.
- Project/stage detail workflows.
- Onboarding and verification screens.
- Earnings/bank account related operations.
- Chat and notifications.

### Notable differences vs homeowner app

- No homeowner marketplace surface (houses/land/rent listings).
- No Stripe client integration package path like homeowner app.
- OAuth role targeting is GC-specific in mobile Google auth exchange.

### Environment expectations

- `.env.example` centered on API URL and Google OAuth client IDs/redirect URI.

---

## 8) Cross-App Shared Patterns

### Authentication

- Mobile apps store token in AsyncStorage (`auth_token`).
- Admin stores token in browser localStorage (`auth_token`).
- All clients rely on backend JWT bearer validation.

### API communication

- All clients call backend using `EXPO_PUBLIC_API_URL` or `NEXT_PUBLIC_API_URL`.
- Expected production API shape includes `/api` suffix.

### Realtime

- Mobile apps have socket service/hooks and notification listeners.
- Backend emits realtime events for chat and notification updates.

### Notifications and push

- Device token registration endpoint exists in backend (`push-tokens`).
- Notification listing/read actions exist in backend and are consumed in clients.

---

## 9) Deployment and Ops Snapshot

### CI

Root workflow (`.github/workflows/ci.yml`) includes:

- Lint jobs
- Backend tests with PostgreSQL service + Prisma generate/migrate
- Admin Playwright E2E run
- Mobile test/build tasks
- Type checks

Some non-critical jobs use `continue-on-error`, so green pipelines may still hide partial failures.

### Production deployment

`deploy-production.yml` deploys:

- Backend to ECS (Docker image in ECR)
- Admin dashboard to ECS (Docker image in ECR)
- Homeowner web export to S3 (+ optional CloudFront invalidation)
- GC web export to S3 (+ optional CloudFront invalidation)

Referenced production domains in workflow:

- `https://api.buildmyhouse.app`
- `https://admin.buildmyhouse.app`
- `https://buildmyhouse.app`
- `https://gc.buildmyhouse.app`

---

## 10) Environment Variable Cheat Sheet (Categories)

Do not store raw secrets in this document. Keep values in app-specific `.env` files or deployment secrets.

### Backend categories

- Database: `DATABASE_URL`
- Auth/security: `JWT_SECRET`
- Stripe: `STRIPE_*`
- OpenAI: `OPENAI_API_KEY`
- Google OAuth: `GOOGLE_*`
- AWS/S3: `AWS_*`
- Email: `RESEND_API_KEY`, `EMAIL_FROM`
- Runtime/cors: `PORT`, `ALLOWED_ORIGINS`

### Frontend/mobile categories

- API URL:
  - `NEXT_PUBLIC_API_URL` (admin)
  - `EXPO_PUBLIC_API_URL` (mobile apps)
- OAuth client IDs and redirects
- Homeowner-specific keys: Stripe publishable key, Google Maps key

---

## 11) Canonical Reality Notes for ChatGPT

When answering BuildMyHouse questions, prioritize these truths:

1. This is a role-based multi-app platform, not a single frontend.
2. Backend is the system of record and business rules engine.
3. Admin panel is operational tooling; users do not use it directly.
4. Homeowner and GC apps share architecture but have different goals and feature surfaces.
5. Listings and viewing-interest workflows (house/land/rental) are first-class product areas.
6. Realtime chat/notifications exist and matter to user experience.
7. Payments are Stripe-backed with webhook-driven state transitions.
8. Project lifecycle and stage documentation are core to construction execution.

---

## 12) Recommended Use in Your BuildMyHouse ChatGPT

Attach this file as a source and ask questions like:

- "Based on our actual codebase, explain how admin verification works end-to-end."
- "How does homeowner auth differ from contractor auth in our implementation?"
- "What backend modules are involved when a payment is created and confirmed?"
- "Give me an operations checklist for production issues using our current architecture."

For best quality, keep this file updated when:

- New modules/routes are added.
- Auth/payment/deployment logic changes.
- Data model migrations introduce new entities or relationships.

---

## 13) Quick Update Procedure

When you need to refresh this document:

1. Re-scan route trees in each app (`app/` or `src/app/`).
2. Re-scan backend modules/controllers/services and `prisma/schema.prisma`.
3. Re-scan workflows and Dockerfiles.
4. Update sections 4-10 first (they change most often).
5. Keep this file factual (implementation-first, not roadmap-first).

---

This reference is intended to be the single high-context attachment for BuildMyHouse product, engineering, operations, and strategy conversations in ChatGPT.
