# BuildMyHouse Web Deployment Guide

This guide covers deploying the BuildMyHouse MVP ( homeowner app, GC app, admin dashboard, and backend API) to the web.

## Phase 0: Pre-Production Fixes (Do This First)

These are critical issues that can break production if skipped:

### 1. WebSocket Scaling

**Current state:** Socket.IO gateway stores connection state in-memory. Running more than one backend instance will break real-time behavior (notifications, chat, etc.).

**For launch:** Run the backend as **exactly 1 ECS task** (or equivalent single-instance deployment).

**Later:** Add [Redis adapter for Socket.IO](https://socket.io/docs/v4/redis-adapter/) to enable horizontal scaling.

### 2. Stripe Webhook Raw Body

**Status:** Fixed. The Nest app is configured with raw-body support for the webhook route (`/api/payments/webhooks/stripe`). The `express.json` verify callback stores the unparsed body in `req.rawBody` for signature validation.

If webhooks fail signature verification, ensure no other middleware modifies the body before it reaches the webhook controller.

### 3. Uploads Persistence

**Current state:** Backend writes files to local `uploads/` (profiles, plans, images, documents). On Fargate/ECS, container disk is ephemeral—files are lost on deploy or restart.

**For launch (choose one):**
- **EFS mount:** Mount an AWS EFS volume at `/app/apps/backend/uploads` in your ECS task definition.
- **Docker Compose:** The compose file mounts a `backend_uploads` volume for local/dev persistence.

**Later:** Migrate to S3 (or similar) and serve files via presigned URLs or CloudFront.

### 4. Build-Time Environment Variables

`NEXT_PUBLIC_API_URL` and `EXPO_PUBLIC_API_URL` are **baked at build time**. Wrong values cause API calls from admin, homeowner, and contractor apps to hit the wrong backend.

| App | Env Var | Example |
|-----|---------|---------|
| Admin Dashboard | `NEXT_PUBLIC_API_URL` | `https://api.buildmyhouse.app/api` |
| Homeowner (Expo) | `EXPO_PUBLIC_API_URL` | `https://api.buildmyhouse.app/api` |
| Contractor (Expo) | `EXPO_PUBLIC_API_URL` | `https://api.buildmyhouse.app/api` |

Set these as build args in Docker, or as environment variables in your CI/build pipeline **before** running the build. Rebuilding is required after changing them.

### 5. CORS Allowlist

`ALLOWED_ORIGINS` must include **exact production origins** (protocol + domain, no trailing slash).

```
ALLOWED_ORIGINS="https://buildmyhouse.app,https://gc.buildmyhouse.app,https://admin.buildmyhouse.app"
```

- Use `https://` (not `http://`) for production
- No trailing slashes
- Comma-separated, no spaces
- Mobile apps often omit `Origin`; the backend allows requests with no origin

---

## Architecture Overview

| App | Tech | Build Output | Suggested Domain |
|-----|------|--------------|-------------------|
| Homeowner | Expo (React Native Web) | `apps/mobile-homeowner/dist` | buildmyhouse.app |
| GC (Contractor) | Expo (React Native Web) | `apps/mobile-contractor/dist` | gc.buildmyhouse.app |
| Admin Dashboard | Next.js | `apps/admin-dashboard/.next` | admin.buildmyhouse.app |
| Backend API | NestJS | Docker image | api.buildmyhouse.app |

## Local Build & Test

```bash
# Build all web apps locally
pnpm build:homeowner   # Output: apps/mobile-homeowner/dist
pnpm build:contractor   # Output: apps/mobile-contractor/dist
pnpm build:admin        # Output: apps/admin-dashboard/.next

# Test homeowner build locally
cd apps/mobile-homeowner && npx serve dist

# Test contractor build locally
cd apps/mobile-contractor && npx serve dist
```

## Backend Requirements

Before deploying, ensure your backend `.env` includes:

1. **ALLOWED_ORIGINS** – Add your production web URLs (required for CORS):
   ```
   ALLOWED_ORIGINS="https://buildmyhouse.app,https://gc.buildmyhouse.app,https://admin.buildmyhouse.app"
   ```

2. **JWT_SECRET** – Strong random secret (no fallback in production)
3. **DATABASE_URL** – Production PostgreSQL connection string
4. **STRIPE_*** – Live Stripe keys for production payments
5. **GOOGLE_*** – OAuth credentials with production redirect URIs

## Docker Deployment

All apps can be deployed together using Docker Compose:

```bash
cd infrastructure/docker
docker-compose up --build
```

| Service    | URL                | Port |
|------------|--------------------|------|
| Homeowner  | http://localhost:3002 | 3002 |
| GC         | http://localhost:3003 | 3003 |
| Admin      | http://localhost:3000 | 3000 |
| Backend API| http://localhost:3001 | 3001 |

### Build args for production

When deploying to production, pass the production API URL when building:

```bash
docker-compose build \
  --build-arg NEXT_PUBLIC_API_URL=https://api.buildmyhouse.app/api \
  --build-arg EXPO_PUBLIC_API_URL=https://api.buildmyhouse.app/api
```

Or set these in a `.env` file and reference them in `docker-compose.override.yml` for production.

### Individual Dockerfiles

- `apps/backend/Dockerfile` – NestJS API (runs migrations on start)
- `apps/admin-dashboard/Dockerfile` – Next.js standalone
- `apps/mobile-homeowner/Dockerfile` – Expo static → nginx
- `apps/mobile-contractor/Dockerfile` – Expo static → nginx

---

## Deployment Options (non-Docker)

### Option A: Vercel (recommended for Next.js + static sites)

- **Admin**: Connect repo, set root to `apps/admin-dashboard`, add `NEXT_PUBLIC_API_URL` env var
- **Homeowner/GC**: Use *"Other"* framework, set:
  - Build command: `cd ../.. && pnpm install && pnpm --filter mobile-homeowner build` (adjust filter for GC)
  - Output directory: `apps/mobile-homeowner/dist`

### Option B: Netlify

- **Admin**: Build command `pnpm --filter @buildmyhouse/admin-dashboard build`, publish `apps/admin-dashboard/.next`
- **Homeowner/GC**: Build command `pnpm --filter mobile-homeowner build`, publish `apps/mobile-homeowner/dist`

### Option C: AWS / Custom

- Static apps: Upload `dist` (or `.next`) to S3 + CloudFront or your static host
- Backend: Deploy Docker image to ECS, Cloud Run, or your container platform

#### Admin Dashboard on ECS

**Full deployment checklist:** See `infrastructure/ecs/ADMIN_DEPLOYMENT_CHECKLIST.md` for step-by-step instructions.

The admin image uses an ENTRYPOINT that always runs from `/app/apps/admin-dashboard`. **Do not override** the container `command` or `entryPoint` in the ECS task definition.

Reference task definition: `infrastructure/ecs/admin-task-definition.json`. Register with:
```bash
aws ecs register-task-definition --cli-input-json file://infrastructure/ecs/admin-task-definition.json --region eu-north-1
```

**Access URL:** Use **https://admin.buildmyhouse.app**. Ensure DNS CNAME points to `buildmyhouse-alb-2062754361.eu-north-1.elb.amazonaws.com`.

**Direct test (bypasses DNS):** `curl -L -H "Host: admin.buildmyhouse.app" http://buildmyhouse-alb-2062754361.eu-north-1.elb.amazonaws.com/` (use `-L` to follow redirects)

**ALB health check:** The target group `tg-admin` must use `/health` (not `/`). In EC2 → Target Groups → tg-admin → Health checks → Edit: set **Path** to `/health` and **Success codes** to `200`. Save.

**Health check grace period:** The ECS service must have a grace period so the ALB doesn't mark tasks unhealthy before the app starts. In ECS → admin-service → Update → set **Health check grace period** to **120** seconds. Or run:
```bash
aws ecs update-service --cluster buildmyhouse-prod --service admin-service --health-check-grace-period-seconds 120 --force-new-deployment --region eu-north-1
```

**If you get 504 Gateway Timeout:** The ECS task security group must allow inbound traffic from the ALB. Run:
```bash
# Allow ALB to reach admin (port 3000) and backend (port 3001)
aws ec2 authorize-security-group-ingress --group-id sg-05969d49d932773d7 \
  --protocol tcp --port 3000 --source-group sg-0465ba6e1c6cced11 --region eu-north-1
aws ec2 authorize-security-group-ingress --group-id sg-05969d49d932773d7 \
  --protocol tcp --port 3001 --source-group sg-0465ba6e1c6cced11 --region eu-north-1
```

**Troubleshooting health check failures (app starts but tasks show Unhealthy):** Run these diagnostics to narrow down the cause:

```bash
REGION=eu-north-1

# 1. Which security groups are attached to admin tasks?
aws ecs describe-services --cluster buildmyhouse-prod --services admin-service --region $REGION \
  --query 'services[0].networkConfiguration.awsvpcConfiguration.securityGroups' --output text

# 2. Target group health check config (Path must be /health, Matcher 200)
TG_ARN=$(aws elbv2 describe-target-groups --region $REGION --names tg-admin --query 'TargetGroups[0].TargetGroupArn' --output text)
aws elbv2 describe-target-health --target-group-arn $TG_ARN --region $REGION
aws elbv2 describe-target-groups --target-group-arns $TG_ARN --region $REGION \
  --query 'TargetGroups[0].{Port:Port,HealthCheckPath:HealthCheckPath,Matcher:Matcher}'

# 3. Current inbound rules on ecs-backend SG (must allow 3000 from ALB)
aws ec2 describe-security-groups --group-ids sg-05969d49d932773d7 --region $REGION \
  --query 'SecurityGroups[0].IpPermissions' --output json
```

**Check:** If (1) shows a different security group than `sg-05969d49d932773d7`, add the ALB→port 3000 rule to *that* group. If (2) shows Path other than `/health` or Matcher other than `200`, fix the target group in the console. If (3) has no rule for port 3000 from `sg-0465ba6e1c6cced11`, run the `authorize-security-group-ingress` commands above.

**When security groups are ruled out (e.g. 0.0.0.0/0 on 3000 still fails):**

1. **Verify which target group admin-service uses.** In Console: ECS → admin-service → Update → scroll to **Load balancing**. The container port must be **3000** and the target group must be **tg-admin** (not tg-backend). If it points to tg-backend, health checks hit port 3001 and fail.
2. **Check target failure reason.** EC2 → Target Groups → tg-admin → Targets tab → select an unhealthy target → read **Status details** / **Reason** (e.g. "Request timeout", "Health checks failed").
3. **Test /health locally.** Run the image and confirm the endpoint responds: `docker run -p 3000:3000 399095821429.dkr.ecr.eu-north-1.amazonaws.com/buildmyhouse-admin:latest` then `curl -v http://localhost:3000/health` (expect 200 + JSON).
4. **Vercel fallback.** Deploy admin to Vercel, point `admin.buildmyhouse.app` to it; avoids ECS health-check issues entirely.

## GitHub Actions

The `.github/workflows/deploy-production.yml` workflow deploys backend/admin to ECS and homeowner/GC to S3+CloudFront when corresponding AWS secrets are set.

## Pre-Deployment Checklist

- [ ] **Phase 0:** Backend runs as 1 ECS task (WebSocket in-memory)
- [ ] **Phase 0:** Uploads use EFS mount or S3 (Fargate disk is ephemeral)
- [ ] Set `ALLOWED_ORIGINS` with exact production origins (e.g. `https://buildmyhouse.app`)
- [ ] Set `NEXT_PUBLIC_API_URL` and `EXPO_PUBLIC_API_URL` at build time for each app
- [ ] Configure production OAuth redirect URIs in Google Console
- [ ] Run database migrations before first deploy
- [ ] Verify Stripe webhook URL points to production API (`/api/payments/webhooks/stripe`)
- [ ] Add `PRODUCTION_API_URL` secret in GitHub (e.g. `https://api.buildmyhouse.app`)
