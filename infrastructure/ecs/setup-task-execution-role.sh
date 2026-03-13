#!/bin/bash
# Fix ecsTaskExecutionRole - ECS cannot assume it without proper trust policy
# Run with: bash infrastructure/ecs/setup-task-execution-role.sh
# Requires IAM admin permissions

set -e
cd "$(dirname "$0")/../.."

ROLE_NAME="ecsTaskExecutionRole"
AWS_ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
REGION="${AWS_REGION:-eu-north-1}"

echo "Account: $AWS_ACCOUNT"

# Create role if it doesn't exist, or update trust policy
if ! aws iam get-role --role-name "$ROLE_NAME" 2>/dev/null; then
  echo "Creating role $ROLE_NAME..."
  aws iam create-role \
    --role-name "$ROLE_NAME" \
    --assume-role-policy-document file://infrastructure/ecs/ecs-task-execution-trust-policy.json \
    --description "Allows ECS tasks to pull images and write logs"
else
  echo "Updating trust policy for $ROLE_NAME..."
  aws iam update-assume-role-policy \
    --role-name "$ROLE_NAME" \
    --policy-document file://infrastructure/ecs/ecs-task-execution-trust-policy.json
fi

# Attach managed policy (ECR pull, CloudWatch logs)
echo "Attaching AmazonECSTaskExecutionRolePolicy..."
aws iam attach-role-policy \
  --role-name "$ROLE_NAME" \
  --policy-arn "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"

echo "Done. Force new ECS deployment:"
echo "  aws ecs update-service --cluster buildmyhouse-prod --service admin-service --force-new-deployment --region $REGION"
