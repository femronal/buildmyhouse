# Backend ECS Deployment Checklist

Follow these steps to create `backend-service` in the `buildmyhouse-prod` cluster. The backend API runs on port 3001 and serves `api.buildmyhouse.app`.

## Prerequisites

- [ ] Database (RDS PostgreSQL or similar) reachable from ECS
- [ ] ECR repository `buildmyhouse-backend` exists (create in eu-north-1)
- [ ] Docker image built and pushed to ECR
- [ ] ALB `buildmyhouse-alb` with HTTPS listener
- [ ] Target group `tg-backend` for port 3001 (create if missing)
- [ ] Security group `sg-05969d49d932773d7` allows inbound port **3001** from ALB `sg-0465ba6e1c6cced11`

---

## Step 1: Create ECR Repository (if not exists)

```bash
aws ecr create-repository --repository-name buildmyhouse-backend --region eu-north-1
```

---

## Step 2: Create CloudWatch Log Group

```bash
aws logs create-log-group --log-group-name /ecs/buildmyhouse-backend --region eu-north-1
```

---

## Step 3: Create SSM Parameters (Required – fixes "Can't reach database server at localhost:5432")

The task definition expects these parameters. Create them **before** registering the task definition:

```bash
# Replace with your actual RDS/PostgreSQL connection string
# Format: postgresql://USER:PASSWORD@HOST:5432/DATABASE?schema=public
aws ssm put-parameter \
  --name /buildmyhouse/production/database-url \
  --value "postgresql://user:password@your-rds-endpoint.eu-north-1.rds.amazonaws.com:5432/buildmyhouse?schema=public" \
  --type SecureString \
  --region eu-north-1

# Strong random string for JWT signing (e.g. openssl rand -base64 32)
aws ssm put-parameter \
  --name /buildmyhouse/production/jwt-secret \
  --value "your-secure-jwt-secret" \
  --type SecureString \
  --region eu-north-1

# Google OAuth web client (must match EXPO_PUBLIC_GOOGLE_CLIENT_ID used by homeowner/GC web apps)
aws ssm put-parameter \
  --name /buildmyhouse/production/google-client-id \
  --value "your-google-web-client-id.apps.googleusercontent.com" \
  --type SecureString \
  --region eu-north-1

# Google OAuth client secret from the same Google web OAuth app
aws ssm put-parameter \
  --name /buildmyhouse/production/google-client-secret \
  --value "your-google-client-secret" \
  --type SecureString \
  --region eu-north-1

# S3 bucket name for persistent uploads (images, documents, profile pictures)
aws ssm put-parameter \
  --name /buildmyhouse/production/s3-bucket \
  --value "buildmyhouse-prod-uploads" \
  --type SecureString \
  --region eu-north-1
```

**Note:** Your database must be reachable from the ECS tasks (same VPC or peered, security group allows port 5432 from the task security group).

---

## Step 3b: Grant task execution role access to SSM

The ECS task execution role must be able to read these parameters. Attach the SSM policy:

```bash
aws iam put-role-policy \
  --role-name ecsTaskExecutionRole-buildmyhouse \
  --policy-name ECS-SSM-Parameters \
  --policy-document file://infrastructure/ecs/ecs-ssm-policy.json
```

## Step 3c: Grant ECS task role S3 upload permissions

The backend now stores uploads in S3 (required for persistent files on ECS). Attach this inline policy to the task role:

```bash
cat > /tmp/ecs-s3-uploads-policy.json <<'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:AbortMultipartUpload"
      ],
      "Resource": "arn:aws:s3:::buildmyhouse-prod-uploads/uploads/*"
    }
  ]
}
EOF

aws iam put-role-policy \
  --role-name ecsTaskExecutionRole-buildmyhouse \
  --policy-name ECS-S3-Uploads \
  --policy-document file:///tmp/ecs-s3-uploads-policy.json
```

If you use KMS encryption on the bucket, add `kms:Encrypt` for the same role/key.

---

## Step 4: Register Task Definition (after creating SSM parameters)

```bash
cd /Users/mac/Desktop/Entrepreneurship/BuildMyHouse

aws ecs register-task-definition \
  --cli-input-json file://infrastructure/ecs/backend-task-definition.json \
  --region eu-north-1
```

### Prisma migrations on AWS

- Migrations live under `apps/backend/prisma/migrations/` and ship inside the Docker image.
- On each task start, the container runs **`pnpm prisma:generate && npx prisma migrate deploy`** (see `backend-task-definition.json` `command` — must match `apps/backend/Dockerfile` `CMD`).
- **Production deploy:** pushing to `main` runs `.github/workflows/deploy-production.yml`, which registers this task definition and rolls `backend-service` to the new revision so the start command stays correct.
- To run `prisma migrate deploy` from your laptop, `DATABASE_URL` must reach RDS (VPN/bastion/security group). RDS is often private; migrations normally apply when new ECS tasks start after deploy.

---

## Step 5: Create Target Group (if not exists)

In **EC2 → Target Groups → Create target group**:

- **Target type:** IP
- **Target group name:** `tg-backend`
- **Protocol:** HTTP
- **Port:** 3001
- **VPC:** Same as admin (`vpc-0271c530819067781`)
- **Health check path:** `/api/health`
- **Success codes:** 200
- **Health check interval:** 30 seconds
- **Healthy threshold:** 2
- **Unhealthy threshold:** 2

---

## Step 6: Add ALB Listener Rule for API

In **EC2 → Load balancers → buildmyhouse-alb → Listeners**:

1. Select the HTTPS listener (e.g. port 443)
2. **View/edit rules** → **Insert rule**
3. **Condition:** Host header = `api.buildmyhouse.app`
4. **Action:** Forward to `tg-backend`
5. Save

Repeat for HTTP listener (port 80) if you use HTTP for api.

---

## Step 7: Ensure Security Group Allows Port 3001

```bash
aws ec2 authorize-security-group-ingress \
  --group-id sg-05969d49d932773d7 \
  --protocol tcp \
  --port 3001 \
  --source-group sg-0465ba6e1c6cced11 \
  --region eu-north-1
```

(Use `--dry-run` first to check; if "Rule already exists", skip.)

---

## Step 8: Create ECS Service

**Option A: Via Console**

1. Go to **ECS → Clusters → buildmyhouse-prod → Services**
2. Click **Create**
3. **Compute options:** Launch type = Fargate
4. **Task definition:** `buildmyhouse-backend` (latest revision)
5. **Service name:** `backend-service`
6. **Desired tasks:** 1
7. **VPC and subnets:** Same as admin-service
8. **Security group:** `sg-05969d49d932773d7` (ecs-backend)
9. **Public IP:** Turn on if tasks are in public subnets, or use NAT for private
10. **Load balancer:**
    - **Load balancer type:** Application Load Balancer
    - **Load balancer:** buildmyhouse-alb
    - **Container to load balance:** backend:3001
    - **Target group:** tg-backend
    - **Health check grace period:** 120 seconds
11. **Environment variables:** Already configured in the task definition (DATABASE_URL, JWT_SECRET, GOOGLE credentials, `AWS_S3_BUCKET` from SSM; NODE_ENV, PORT, ALLOWED_ORIGINS, AWS_REGION as env).
12. Click **Create**

**Option B: Via CLI**

```bash
# Get subnet IDs and security group from admin-service
aws ecs describe-services --cluster buildmyhouse-prod --services admin-service --region eu-north-1 \
  --query 'services[0].networkConfiguration.awsvpcConfiguration' --output json

# Get tg-backend ARN
TG_ARN=$(aws elbv2 describe-target-groups --names tg-backend --region eu-north-1 --query 'TargetGroups[0].TargetGroupArn' --output text)

# Get ALB ARN
ALB_ARN=$(aws elbv2 describe-load-balancers --names buildmyhouse-alb --region eu-north-1 --query 'LoadBalancers[0].LoadBalancerArn' --output text)

aws ecs create-service \
  --cluster buildmyhouse-prod \
  --service-name backend-service \
  --task-definition buildmyhouse-backend \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx,subnet-yyy],securityGroups=[sg-05969d49d932773d7],assignPublicIp=ENABLED}" \
  --load-balancers "targetGroupArn=$TG_ARN,containerName=backend,containerPort=3001" \
  --health-check-grace-period-seconds 120 \
  --region eu-north-1
```

Replace `subnet-xxx` and `subnet-yyy` with the subnet IDs from admin-service.

---

## Step 9: Optional – Add More Environment Variables

The task definition already includes `DATABASE_URL`, `JWT_SECRET` (from SSM), plus `NODE_ENV`, `PORT`, and `ALLOWED_ORIGINS`. If you need Stripe, Google OAuth, etc., add them as SSM parameters and reference them in the task definition, or add them in **ECS → Task definition → Edit → Environment variables**.

---

## Step 9: Build and Push Image (First Deploy)

```bash
cd /Users/mac/Desktop/Entrepreneurship/BuildMyHouse

docker build --platform linux/amd64 \
  -f apps/backend/Dockerfile \
  --build-arg NODE_ENV=production \
  -t 399095821429.dkr.ecr.eu-north-1.amazonaws.com/buildmyhouse-backend:latest .

aws ecr get-login-password --region eu-north-1 | \
  docker login --username AWS --password-stdin 399095821429.dkr.ecr.eu-north-1.amazonaws.com

docker push 399095821429.dkr.ecr.eu-north-1.amazonaws.com/buildmyhouse-backend:latest
```

---

## Step 10: Verify

```bash
# Check service status
aws ecs describe-services --cluster buildmyhouse-prod --services backend-service --region eu-north-1

# Test health endpoint (after tasks are healthy)
curl https://api.buildmyhouse.app/api/health
```

---

## DNS

Ensure `api.buildmyhouse.app` CNAME points to your ALB: `buildmyhouse-alb-2062754361.eu-north-1.elb.amazonaws.com` (or your ALB DNS name).
