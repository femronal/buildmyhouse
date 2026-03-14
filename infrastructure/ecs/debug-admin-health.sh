#!/bin/bash
# Debug admin-service 504 / health check failures
# Run: bash infrastructure/ecs/debug-admin-health.sh

set -e
REGION="eu-north-1"
TG_NAME="tg-admin"
ALB_NAME="buildmyhouse-alb"
CLUSTER="buildmyhouse-prod"
SERVICE="admin-service"

echo "=== 1. Target Group Health Check Config ==="
aws elbv2 describe-target-groups --names $TG_NAME --region $REGION \
  --query 'TargetGroups[0].{Path:HealthCheckPath,Protocol:HealthCheckProtocol,Port:HealthCheckPort,Timeout:HealthCheckTimeoutSeconds,Interval:HealthCheckIntervalSeconds}' \
  --output table

echo ""
echo "=== 2. Target Health Status ==="
TG_ARN=$(aws elbv2 describe-target-groups --names $TG_NAME --region $REGION --query 'TargetGroups[0].TargetGroupArn' --output text)
aws elbv2 describe-target-health --target-group-arn $TG_ARN --region $REGION \
  --query 'TargetHealthDescriptions[].{IP:Target.Id,Port:Target.Port,State:TargetHealth.State,Reason:TargetHealth.Reason,Desc:TargetHealth.Description}' \
  --output table

echo ""
echo "=== 3. ECS Service - Running Tasks ==="
aws ecs describe-services --cluster $CLUSTER --services $SERVICE --region $REGION \
  --query 'services[0].{Desired:desiredCount,Running:runningCount,Pending:pendingCount,Events:events[0:3]}' \
  --output json

echo ""
echo "=== 4. Security Groups ==="
echo "ALB Security Group:"
aws elbv2 describe-load-balancers --names $ALB_NAME --region $REGION --query 'LoadBalancers[0].SecurityGroups' --output text
echo "ECS Task Security Group:"
aws ecs describe-services --cluster $CLUSTER --services $SERVICE --region $REGION \
  --query 'services[0].networkConfiguration.awsvpcConfiguration.securityGroups' --output text

echo ""
echo "=== 5. Inbound Rules on ECS Task SG (port 3000) ==="
ECS_SG=$(aws ecs describe-services --cluster $CLUSTER --services $SERVICE --region $REGION \
  --query 'services[0].networkConfiguration.awsvpcConfiguration.securityGroups[0]' --output text)
ALB_SG=$(aws elbv2 describe-load-balancers --names $ALB_NAME --region $REGION --query 'LoadBalancers[0].SecurityGroups[0]' --output text)
echo "ECS SG: $ECS_SG | ALB SG: $ALB_SG"
aws ec2 describe-security-groups --group-ids $ECS_SG --region $REGION \
  --query 'SecurityGroups[0].IpPermissions[?FromPort==`3000` || ToPort==`3000`]' --output table

echo ""
echo "=== 6. Fix Commands (run if needed) ==="
echo "# If HealthCheckProtocol is HTTPS, change to HTTP:"
echo "aws elbv2 modify-target-group --target-group-arn $TG_ARN --health-check-protocol HTTP --health-check-path /health --region $REGION"
echo ""
echo "# If port 3000 rule missing from ECS SG, add it:"
echo "aws ec2 authorize-security-group-ingress --group-id $ECS_SG --protocol tcp --port 3000 --source-group $ALB_SG --region $REGION"
