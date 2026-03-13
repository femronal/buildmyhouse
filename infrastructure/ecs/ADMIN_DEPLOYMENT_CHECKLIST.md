# Admin Dashboard ECS Deployment – Complete Checklist

Follow these steps **in order**. Skipping or misconfiguring any step causes health check failures and 504 errors.

## Prerequisites

- [ ] Backend API is deployed and reachable at `https://api.buildmyhouse.app`
- [ ] DNS: `admin.buildmyhouse.app` CNAME → `buildmyhouse-alb-2062754361.eu-north-1.elb.amazonaws.com`
- [ ] IAM role `ecsTaskExecutionRole-buildmyhouse` exists with correct trust policy

---

## Step 1: Build the Image (with Production API URL)

```bash
cd /Users/mac/Desktop/Entrepreneurship/BuildMyHouse

docker build --platform linux/amd64 \
  -f apps/admin-dashboard/Dockerfile \
  --build-arg NEXT_PUBLIC_API_URL=https://api.buildmyhouse.app/api \
  -t 399095821429.dkr.ecr.eu-north-1.amazonaws.com/buildmyhouse-admin:latest .
```

**Important:** `NEXT_PUBLIC_API_URL` is baked at build time. Use your actual API domain (with `/api` suffix).

---

## Step 2: Push to ECR

```bash
aws ecr get-login-password --region eu-north-1 | \
  docker login --username AWS --password-stdin 399095821429.dkr.ecr.eu-north-1.amazonaws.com

docker push 399095821429.dkr.ecr.eu-north-1.amazonaws.com/buildmyhouse-admin:latest
```

---

## Step 3: ALB Target Group – Health Check

In **EC2 → Target Groups → tg-admin → Health checks**:

- **Path:** `/health` (not `/`)
- **Success codes:** `200`
- **Healthy threshold:** 2
- **Unhealthy threshold:** 2
- **Timeout:** 5 seconds
- **Interval:** 30 seconds

Click **Save**.

---

## Step 4: ECS Service – Health Check Grace Period

In **ECS → Clusters → buildmyhouse-prod → admin-service → Update**:

- **Health check grace period:** **120** seconds

This is critical. With 0 seconds, the ALB marks tasks unhealthy before the app finishes starting.

---

## Step 5: Security Group – Allow ALB to Reach Tasks

The `ecs-backend` security group (sg-05969d49d932773d7) must allow inbound port 3000 from the ALB:

```bash
aws ec2 authorize-security-group-ingress \
  --group-id sg-05969d49d932773d7 \
  --protocol tcp \
  --port 3000 \
  --source-group sg-0465ba6e1c6cced11 \
  --region eu-north-1
```

(Use `--source-group` for the ALB security group; or temporarily use `--cidr 0.0.0.0/0` for debugging, then remove.)

---

## Step 6: Register Task Definition & Update Service

```bash
cd /Users/mac/Desktop/Entrepreneurship/BuildMyHouse

aws ecs register-task-definition \
  --cli-input-json file://infrastructure/ecs/admin-task-definition.json \
  --region eu-north-1

TASK_REV=$(aws ecs describe-task-definition --task-definition buildmyhouse-admin --region eu-north-1 --query 'taskDefinition.revision' --output text)

aws ecs update-service \
  --cluster buildmyhouse-prod \
  --service admin-service \
  --task-definition buildmyhouse-admin:${TASK_REV} \
  --health-check-grace-period-seconds 120 \
  --force-new-deployment \
  --region eu-north-1
```

---

## Step 7: Verify (Wait 3–5 Minutes)

```bash
# Check deployment
aws ecs describe-services --cluster buildmyhouse-prod --services admin-service \
  --region eu-north-1 \
  --query 'services[0].{running:runningCount,deployments:deployments[*].{running:runningCount,rollout:rolloutState}}'
```

- Look for `running: 1` and `rolloutState: "COMPLETED"`.
- In ECS console, target health should show **1 Healthy**.

---

## Step 8: Access

- **http://admin.buildmyhouse.app** (HTTP works)
- **https://admin.buildmyhouse.app** (HTTPS may show 504 until certificate/listener is fixed)

---

## Common Mistakes

| Mistake | Result |
|---------|--------|
| Health check grace period = 0 | Tasks marked unhealthy before app starts |
| ALB path = `/` instead of `/health` | 302 redirect fails health check |
| Missing security group rule | ALB cannot reach tasks → 504 |
| Building without `NEXT_PUBLIC_API_URL` | Admin calls localhost, API fails |
| Backend not deployed | Admin loads but login/API calls fail |

---

## Backend Dependency

The admin dashboard calls `NEXT_PUBLIC_API_URL` for auth and data. If the backend is not deployed at `api.buildmyhouse.app`, the admin will load but login and all data operations will fail. Ensure the backend ECS service is running first.
