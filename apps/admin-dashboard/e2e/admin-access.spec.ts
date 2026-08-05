import { test, expect } from '@playwright/test';

test.describe('Admin Access Control', () => {
  test.beforeEach(async ({ page }) => {
    const email = process.env.TEST_ADMIN_EMAIL || 'admin@buildmyhouse.com';
    const password = process.env.TEST_ADMIN_PASSWORD || 'admin123';

    await page.goto('/login');
    await page.getByPlaceholder(/admin@buildmyhouse.com/i).fill(email);
    await page.getByPlaceholder(/Enter your password/i).fill(password);
    await page.getByRole('button', { name: /Sign In/i }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
  });

  test('loads Admin Access workspace tabs', async ({ page }) => {
    await page.getByRole('link', { name: /Admin Access/i }).click();
    await expect(page).toHaveURL(/\/admin-access/);
    await expect(page.getByRole('heading', { name: /Admin Access Control/i })).toBeVisible();
    await expect(page.getByText(/Total Access Accounts/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Access Accounts/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Roles$/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Permissions$/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Access Requests/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Activity Log/i })).toBeVisible();
  });

  test('opens Grant Admin Access modal', async ({ page }) => {
    await page.goto('/admin-access');
    await expect(page.getByRole('heading', { name: /Admin Access Control/i })).toBeVisible({
      timeout: 15000,
    });
    await page.getByRole('button', { name: /Grant Admin Access/i }).click();
    await expect(page.getByText(/Who is this/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Existing staff member/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /External person/i })).toBeVisible();
  });

  test('roles tab lists system roles', async ({ page }) => {
    await page.goto('/admin-access?tab=roles');
    await expect(page.getByRole('heading', { name: /Admin Access Control/i })).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByText(/Super Admin/i).first()).toBeVisible({ timeout: 15000 });
  });
});
