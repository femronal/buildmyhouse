import { test, expect } from '@playwright/test';

async function signIn(page: import('@playwright/test').Page) {
  const email = process.env.TEST_ADMIN_EMAIL || 'admin@buildmyhouse.com';
  const password = process.env.TEST_ADMIN_PASSWORD || 'admin123';
  await page.goto('/login');
  await page.getByPlaceholder(/admin@buildmyhouse.com/i).fill(email);
  await page.getByPlaceholder(/Enter your password/i).fill(password);
  await page.getByRole('button', { name: /Sign In/i }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
}

test.describe('Partnership lead tracker', () => {
  test('adds a lead, logs a follow-up, and blocks a duplicate email', async ({ page }) => {
    await signIn(page);
    const stamp = Date.now();
    await page.goto('/growth/partnerships');
    await page.getByRole('button', { name: /Add lead/i }).click();
    await page.getByLabel(/Company name/i).fill(`Test QS ${stamp}`);
    await page.getByLabel(/^Email$/i).fill(`ada-${stamp}@example.test`);
    await page.getByRole('button', { name: /Save lead/i }).click();
    await expect(page).toHaveURL(/\/growth\/partnerships\/leads\//);
    const leadUrl = page.url();
    const stageOptions = await page.getByLabel('Change stage').locator('option').allTextContents();
    expect(stageOptions.join(' ')).not.toContain('Active partner');
    await page.goto('/growth/partnerships');
    const row = page.locator('article').filter({ hasText: `Test QS ${stamp}` });
    await row.getByRole('button', { name: /Log follow-up/i }).click();
    await page.getByLabel(/^Summary$/i).fill('Sent the one page and asked for nothing.');
    await page.getByRole('button', { name: /Save follow-up/i }).click();
    await page.goto(leadUrl);
    await expect(page.getByText(/Sent the one page/i)).toBeVisible();

    await page.goto('/growth/partnerships');
    await page.getByRole('button', { name: /Add lead/i }).click();
    await page.getByLabel(/Company name/i).fill(`Other Firm ${stamp}`);
    await page.getByLabel(/^Email$/i).fill(`ada-${stamp}@example.test`);
    await page.getByRole('button', { name: /Save lead/i }).click();
    await expect(page.getByText(/This matches PL-/i)).toBeVisible();
  });

  test('hides Partnerships for an admin without partnerships.view', async ({ page }) => {
    await page.route('**/auth/me', async (route) => {
      const response = await route.fetch();
      const body = await response.json();
      if (body?.permissions) {
        body.permissions.isSuperAdmin = false;
        body.permissions.permissions = (body.permissions.permissions || []).filter((key: string) => key !== '*' && key !== 'partnerships.view' && key !== 'partnerships.edit' && key !== 'partnerships.manage');
      }
      await route.fulfill({ response, json: body });
    });
    await signIn(page);
    await page.goto('/dashboard');
    await expect(page.getByRole('link', { name: /^Partnerships$/i })).toHaveCount(0);
  });
});
