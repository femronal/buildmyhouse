# GitHub Actions CI/CD Workflows

This directory contains GitHub Actions workflows for continuous integration and deployment.

## Workflows

### 1. CI Pipeline (`.github/workflows/ci.yml`)

Runs on every push and pull request to `main` and `develop` branches.

**Jobs:**
- **Lint**: Lints all apps (backend, admin dashboard, mobile apps)
- **Test Backend**: Runs Jest tests with PostgreSQL service
- **Test Admin Dashboard**: Runs Playwright E2E tests
- **Test Mobile Apps**: Runs Jest tests for mobile apps
- **Build**: Builds all apps after tests pass
- **Type Check**: Validates TypeScript types across all apps

**Triggers:**
- Push to `main` or `develop`
- Pull requests to `main` or `develop`

### 2. Deploy to Staging (`.github/workflows/deploy-staging.yml`)

Deploys to staging environment on pushes to `develop` branch.

**Jobs:**
- **Deploy Backend**: Builds and deploys backend to staging
- **Deploy Admin Dashboard**: Builds and deploys admin dashboard to staging

**Triggers:**
- Push to `develop` branch
- Manual trigger via `workflow_dispatch`

**Environment:**
- Uses `staging` environment with protection rules
- Requires secrets: `STAGING_API_URL`

### 3. Deploy to Production (`.github/workflows/deploy-production.yml`)

Deploys to production environment on pushes to `main` branch or version tags.

**Jobs:**
- **Pre-Deployment Checks**: Verifies deployment confirmation and runs tests
- **Deploy Backend**: Builds and deploys backend to production
- **Deploy Admin Dashboard**: Builds and deploys admin dashboard to production
- **Notify**: Sends deployment status notifications

**Triggers:**
- Push to `main` branch
- Version tags (`v*.*.*`)
- Manual trigger with confirmation (`workflow_dispatch`)

**Environment:**
- Uses `production` environment with protection rules
- Requires manual approval (if configured)
- Requires secrets: `PRODUCTION_API_URL`

## Required Secrets

Configure these secrets in GitHub repository settings:

### CI Pipeline
- `TEST_ADMIN_EMAIL`: Admin email for E2E tests
- `TEST_ADMIN_PASSWORD`: Admin password for E2E tests

### Staging Deployment
- `STAGING_API_URL`: Backend API URL for staging
- `STAGING_DATABASE_URL`: Database connection string (if needed)
- `STAGING_JWT_SECRET`: JWT secret for staging
- `STAGING_STRIPE_SECRET_KEY`: Stripe secret key for staging
- `STAGING_STRIPE_WEBHOOK_SECRET`: Stripe webhook secret for staging

### Production Deployment
- `PRODUCTION_API_URL`: Backend API URL for production
- `PRODUCTION_DATABASE_URL`: Database connection string (if needed)
- `PRODUCTION_JWT_SECRET`: JWT secret for production
- `PRODUCTION_STRIPE_SECRET_KEY`: Stripe secret key for production
- `PRODUCTION_STRIPE_WEBHOOK_SECRET`: Stripe webhook secret for production

## Environment Protection Rules

Configure environment protection rules in GitHub:

1. Go to Settings → Environments
2. Create `staging` and `production` environments
3. Configure:
   - **Required reviewers**: Add team members who must approve deployments
   - **Wait timer**: Optional delay before deployment
   - **Deployment branches**: Restrict which branches can deploy

## Customizing Deployment

The deployment workflows include placeholder commands. Customize them based on your infrastructure:

### Backend Deployment Options

**Docker Registry:**
```yaml
- name: Push to Docker Hub
  run: |
    echo "${{ secrets.DOCKER_PASSWORD }}" | docker login -u "${{ secrets.DOCKER_USERNAME }}" --password-stdin
    docker push buildmyhouse-backend:latest
```

**AWS ECS:**
```yaml
- name: Deploy to ECS
  run: |
    aws ecs update-service --cluster buildmyhouse --service backend --force-new-deployment
```

**Kubernetes:**
```yaml
- name: Deploy to Kubernetes
  run: |
    kubectl set image deployment/backend backend=buildmyhouse-backend:${{ github.sha }}
```

### Admin Dashboard Deployment Options

**Vercel:**
```yaml
- name: Deploy to Vercel
  run: |
    npm i -g vercel
    vercel --prod --token ${{ secrets.VERCEL_TOKEN }}
```

**Netlify:**
```yaml
- name: Deploy to Netlify
  run: |
    npm i -g netlify-cli
    netlify deploy --prod --dir=.next --auth=${{ secrets.NETLIFY_AUTH_TOKEN }}
```

**AWS S3 + CloudFront:**
```yaml
- name: Deploy to S3
  run: |
    aws s3 sync .next/static s3://buildmyhouse-admin/static
    aws cloudfront create-invalidation --distribution-id ${{ secrets.CLOUDFRONT_ID }} --paths "/*"
```

## Database Migrations

Add database migration steps to deployment workflows:

```yaml
- name: Run database migrations
  run: |
    pnpm --filter @buildmyhouse/backend prisma migrate deploy
  env:
    DATABASE_URL: ${{ secrets.PRODUCTION_DATABASE_URL }}
```

## Monitoring and Notifications

### Slack Notification Example

```yaml
- name: Notify Slack
  uses: slackapi/slack-github-action@v1
  with:
    webhook-url: ${{ secrets.SLACK_WEBHOOK_URL }}
    payload: |
      {
        "text": "🚀 Deployment to production completed successfully!"
      }
```

### Discord Notification Example

```yaml
- name: Notify Discord
  run: |
    curl -X POST ${{ secrets.DISCORD_WEBHOOK_URL }} \
      -H "Content-Type: application/json" \
      -d '{"content": "🚀 Deployment to production completed!"}'
```

## Testing Locally

Use [act](https://github.com/nektos/act) to test workflows locally:

```bash
# Install act
brew install act

# Run CI workflow
act push

# Run deployment workflow
act workflow_dispatch -W .github/workflows/deploy-staging.yml
```

## Troubleshooting

### Tests Failing
- Check test logs in Actions tab
- Verify environment variables are set correctly
- Ensure database service is healthy

### Build Failures
- Check build logs for TypeScript errors
- Verify all dependencies are installed
- Check for missing environment variables

### Deployment Failures
- Verify secrets are configured correctly
- Check deployment target accessibility
- Review environment protection rules

## Best Practices

1. **Always run tests before deployment**: CI pipeline must pass
2. **Use environment protection**: Require approvals for production
3. **Tag releases**: Use semantic versioning (v1.0.0)
4. **Monitor deployments**: Set up health checks and notifications
5. **Rollback plan**: Keep previous versions available for quick rollback
6. **Database migrations**: Test migrations in staging first
7. **Secrets management**: Never commit secrets, use GitHub Secrets
8. **Artifact retention**: Configure appropriate retention periods



