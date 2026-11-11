import { test, expect } from '@playwright/test';

test.describe('Weekly report', () => {
  test.beforeEach(async ({ page }) => {
    const email = process.env.TEST_ADMIN_EMAIL || 'admin@buildmyhouse.com';
    const password = process.env.TEST_ADMIN_PASSWORD || 'admin123';
    await page.goto('/login');
    await page.getByPlaceholder(/admin@buildmyhouse.com/i).fill(email);
    await page.getByPlaceholder(/Enter your password/i).fill(password);
    await page.getByRole('button', { name: /Sign In/i }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
    await page.goto('/reports/weekly');
  });

  test('shows the five sections and a jobs table', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Weekly report' })).toBeVisible();
    for (const title of ['North Star', 'Money', 'Problems', 'Trust', 'Growth']) {
      await expect(page.getByRole('heading', { name: title })).toBeVisible();
    }
    await expect(page.getByRole('heading', { name: 'Jobs' })).toBeVisible();
    await expect(page.getByRole('table')).toBeVisible();
  });

  test('previous week changes the url', async ({ page }) => {
    await page.getByRole('button', { name: 'Previous week' }).click();
    await expect(page).toHaveURL(/\/reports\/weekly\?week=\d{4}-\d{2}-\d{2}/);
  });

  test('download csv saves a csv', async ({ page }) => {
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download CSV' }).click();
    const file = await download;
    expect(file.suggestedFilename()).toMatch(/^bmh-weekly-report-\d{4}-\d{2}-\d{2}\.csv$/);
  });

  test('print view hides the sidebar and the download buttons', async ({ page }) => {
    await page.emulateMedia({ media: 'print' });
    await expect(page.locator('aside')).toBeHidden();
    await expect(page.getByRole('button', { name: 'Download PDF' })).toBeHidden();
    await expect(page.getByRole('button', { name: 'Download CSV' })).toBeHidden();
  });
});
