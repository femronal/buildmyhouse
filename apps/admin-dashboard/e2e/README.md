# E2E Testing with Playwright

End-to-end tests for the admin dashboard using Playwright.

## Setup

Playwright is already installed. If you need to reinstall browsers:

```bash
pnpm exec playwright install
```

## Running Tests

### Run all tests
```bash
pnpm test:e2e
```

### Run tests in UI mode (interactive)
```bash
pnpm test:e2e:ui
```

### Run tests in headed mode (see browser)
```bash
pnpm test:e2e:headed
```

### Debug tests
```bash
pnpm test:e2e:debug
```

### Run specific test file
```bash
pnpm exec playwright test e2e/auth.spec.ts
```

### Run tests in specific browser
```bash
pnpm exec playwright test --project=chromium
```

## Test Files

- `auth.spec.ts` - Authentication flow (login, logout, errors)
- `dashboard.spec.ts` - Dashboard overview and stats
- `navigation.spec.ts` - Navigation between pages
- `users.spec.ts` - User management functionality
- `projects.spec.ts` - Project monitoring features

## Configuration

Tests are configured in `playwright.config.ts`:
- Base URL: `http://localhost:3000` (or `PLAYWRIGHT_TEST_BASE_URL`)
- Automatically starts dev server before tests
- Screenshots on failure
- HTML report generated after tests

## Environment Variables

Set these for tests that require authentication:

```bash
export TEST_ADMIN_EMAIL=admin@buildmyhouse.com
export TEST_ADMIN_PASSWORD=admin123
```

Or create `.env.test`:
```
TEST_ADMIN_EMAIL=admin@buildmyhouse.com
TEST_ADMIN_PASSWORD=admin123
```

## Writing Tests

Example test structure:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup: login, navigate, etc.
    await page.goto('/dashboard');
  });

  test('should do something', async ({ page }) => {
    // Test implementation
    await expect(page.getByText('Expected Text')).toBeVisible();
  });
});
```

## Best Practices

1. **Use data-testid attributes** for stable selectors
2. **Wait for elements** instead of fixed timeouts
3. **Use page object model** for complex pages
4. **Keep tests independent** - each test should be able to run alone
5. **Clean up** - reset state between tests if needed

## CI/CD

Tests run automatically on:
- Push to main/develop branches
- Pull requests

See `.github/workflows/playwright.yml` for CI configuration.

## Debugging

1. **Use `--debug` flag** to step through tests
2. **Use `--headed` flag** to see browser
3. **Check `playwright-report/`** for HTML reports
4. **Use `page.pause()`** in test code to pause execution

## Troubleshooting

### Tests fail with "timeout"
- Check if backend is running
- Verify test user exists in database
- Increase timeout in test or config

### Browser not found
```bash
pnpm exec playwright install chromium
```

### Port already in use
- Change port in `playwright.config.ts`
- Or stop other dev servers

