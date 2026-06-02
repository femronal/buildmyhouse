# ECS networking and cost architecture (BuildMyHouse prod)

Region: `eu-north-1` · VPC: `vpc-0271c530819067781` · Cluster: `buildmyhouse-prod`

## Current design (intentional)

| Component | Public IPv4 | Why |
|-----------|-------------|-----|
| ALB (`buildmyhouse-alb`) | Yes (3 AZ ENIs) | Internet-facing API + admin; required for HTTPS from users |
| ECS `backend-service` | `assignPublicIp=ENABLED` | Outbound to Stripe, OpenAI, Google OAuth, Resend, etc. |
| ECS `admin-service` | `assignPublicIp=ENABLED` | Same VPC path as backend; image pull + logs via execution role |
| RDS `buildmyhouse-prod` | No (private) | Reachable inside VPC; tasks do **not** need a public IP for DB |

## Why we keep ECS public IPs (cost analysis)

Removing task public IPs without breaking the app requires **either**:

1. **NAT Gateway** — ~\$32+/month fixed in `eu-north-1` before data transfer, or  
2. **Interface VPC endpoints** (ECR, Logs, SSM, …) — ~\$7.30/AZ/endpoint/month  

Two Fargate tasks with public IPs cost roughly **~\$7–8/month** in VPC “in-use public IPv4” charges. NAT or a minimal private endpoint set costs **more** than the IPv4 line we would remove. **Do not disable `assignPublicIp` unless outbound architecture is redesigned and modeled.**

## Safe optimizations (applied / recommended)

| Action | Risk | Typical savings |
|--------|------|-----------------|
| Delete unused RDS (`buildmyhouse-prod-db`) | Low (after snapshot + SSM check) | ~\$33/mo |
| Right-size Fargate (admin 256/512; backend 256/512 when metrics allow) | Low–medium | ~\$10–15/mo combined CPU+memory |
| ECR lifecycle + log retention | Low | Small, prevents drift |
| **S3 gateway VPC endpoint** | None | \$0; improves S3 path for tasks/ECR layers |
| ALB 3 AZ → 2 AZ | Medium (ECS/ALB subnet alignment) | ~\$3–4/mo IPv4; caused deploy issues in May 2026 |
| Backend CPU 512 → 256 | Medium (deploy/migrate spikes) | ~\$8–12/mo possible; validate after memory change |

## CloudWatch sizing guardrails (14-day)

Before changing task CPU/memory:

- **Memory**: proceed only if `MemoryUtilization` max stays **&lt; 40%** of allocated MiB for 7+ days.  
- **CPU**: average may be low (&lt;10%) while deploy spikes hit 100%; treat CPU reductions as **second step** after memory is stable.

## Rollout order for task definition changes

1. `admin-service` → wait `services-stable` → `https://admin.buildmyhouse.app/health`  
2. `backend-service` → wait `services-stable` → `https://api.buildmyhouse.app/api/health`  
3. Keep ECS subnets aligned with ALB AZ subnets:  
   `subnet-00fb7485f72995ab1`, `subnet-0eb92b333573c3f61`, `subnet-0166b67ca807c5fee`

## Rollback

Re-register task definition from git with previous `cpu`/`memory`, `update-service --force-new-deployment`, wait stable.
