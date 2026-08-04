import { test, expect } from '@playwright/test';

test.describe('People & HR', () => {
  test.beforeEach(async ({ page }) => {
    const email = process.env.TEST_ADMIN_EMAIL || 'admin@buildmyhouse.com';
    const password = process.env.TEST_ADMIN_PASSWORD || 'admin123';

    await page.goto('/login');
    await page.getByPlaceholder(/admin@buildmyhouse.com/i).fill(email);
    await page.getByPlaceholder(/Enter your password/i).fill(password);
    await page.getByRole('button', { name: /Sign In/i }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
  });

  test('loads People & HR overview from sidebar', async ({ page }) => {
    await page.getByRole('link', { name: /People & HR/i }).click();
    await expect(page).toHaveURL(/\/people/);
    await expect(page.getByRole('heading', { name: /People & HR/i })).toBeVisible();
    await expect(page.getByText(/Active staff/i)).toBeVisible();
  });

  test('can open recruitment and create a candidate', async ({ page }) => {
    await page.goto('/people/recruitment');
    await expect(page.getByRole('heading', { name: /Recruitment/i })).toBeVisible();

    await page.getByRole('button', { name: /Add Candidate/i }).click();
    const suffix = Date.now();
    const dialog = page.locator('form').filter({ hasText: 'Add Candidate' });
    await dialog.locator('input').nth(0).fill('Test');
    await dialog.locator('input').nth(1).fill(`Candidate ${suffix}`);
    await dialog.locator('input[type="email"]').fill(`candidate.${suffix}@example.com`);
    await dialog.getByRole('button', { name: /Create candidate/i }).click();

    await expect(page.getByText(new RegExp(`Candidate ${suffix}`))).toBeVisible({
      timeout: 15000,
    });
  });

  test('directory page loads', async ({ page }) => {
    await page.goto('/people/directory');
    await expect(page.getByRole('heading', { name: /People directory/i })).toBeVisible();
  });
});
