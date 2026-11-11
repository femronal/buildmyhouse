import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    const email = process.env.TEST_ADMIN_EMAIL || 'admin@buildmyhouse.com';
    const password = process.env.TEST_ADMIN_PASSWORD || 'admin123';

    await page.goto('/login');
    await page.getByPlaceholder(/admin@buildmyhouse.com/i).fill(email);
    await page.getByPlaceholder(/Enter your password/i).fill(password);
    await page.getByRole('button', { name: /Sign In/i }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
  });

  test('today page shows the action queue, live jobs, money this week and trust queue', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Today' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Action queue' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Live jobs' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Money this week' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Trust queue' })).toBeVisible();
  });

  test('weekly report button opens /reports/weekly', async ({ page }) => {
    await page.locator('main').getByRole('link', { name: 'Weekly report' }).click();
    await expect(page).toHaveURL(/\/reports\/weekly/);
    await expect(page.getByRole('heading', { name: 'Weekly report' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Download PDF' })).toBeVisible();
  });

  test('weekly report button is visible at 390px wide', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.locator('main').getByRole('link', { name: 'Weekly report' })).toBeVisible();
  });

  test('there is no Last 24 hours label and no Quick Actions card', async ({ page }) => {
    await expect(page.getByText('Last 24 hours')).toHaveCount(0);
    await expect(page.getByText('Quick Actions')).toHaveCount(0);
    await expect(page.getByText('Good day')).toHaveCount(0);
  });
});
