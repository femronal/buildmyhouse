import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    const email = process.env.TEST_ADMIN_EMAIL || 'admin@buildmyhouse.com';
    const password = process.env.TEST_ADMIN_PASSWORD || 'admin123';

    await page.goto('/login');
    await page.getByPlaceholder(/admin@buildmyhouse.com/i).fill(email);
    await page.getByPlaceholder(/Enter your password/i).fill(password);
    await page.getByRole('button', { name: /Sign In/i }).click();
    
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
  });

  test('should navigate to homeowners page', async ({ page }) => {
    await page.getByRole('link', { name: /Homeowners/i }).click();
    await expect(page).toHaveURL(/\/homeowners/);
    await expect(page.getByText(/Homeowners/i)).toBeVisible();
  });

  test('should navigate to projects page', async ({ page }) => {
    await page.locator('aside').getByRole('link', { name: 'Projects', exact: true }).click();
    await expect(page).toHaveURL(/\/projects/);
    await expect(page.getByText(/Project Monitoring/i)).toBeVisible();
  });

  test('should navigate to verification page', async ({ page }) => {
    await page.getByRole('link', { name: /Verification/i }).click();
    await expect(page).toHaveURL(/\/verification/);
    await expect(page.getByText(/Verification Center/i)).toBeVisible();
  });

  test('should navigate to disputes page', async ({ page }) => {
    await page.getByRole('link', { name: /Disputes/i }).click();
    await expect(page).toHaveURL(/\/disputes/);
    await expect(page.getByText(/Dispute Resolution/i)).toBeVisible();
  });

  test('should navigate to People & HR', async ({ page }) => {
    await page.getByRole('link', { name: /People & HR/i }).click();
    await expect(page).toHaveURL(/\/people/);
    await expect(page.getByRole('heading', { name: /People & HR/i })).toBeVisible();
  });

  test('should navigate to Professionals', async ({ page }) => {
    await page.getByRole('link', { name: /Professionals/i }).click();
    await expect(page).toHaveURL(/\/professionals/);
    await expect(page.getByRole('heading', { name: /Professionals/i })).toBeVisible();
  });

  test('should navigate to Growth', async ({ page }) => {
    await page.getByRole('link', { name: /^Growth$/i }).click();
    await expect(page).toHaveURL(/\/growth$/);
    await expect(page.getByRole('heading', { name: /^Growth$/i })).toBeVisible();
  });

  test('should navigate to tools hub then price checker ops', async ({ page }) => {
    await page.getByRole('link', { name: /^Tools$/i }).click();
    await expect(page).toHaveURL(/\/tools/);
    await expect(page.getByRole('heading', { name: /Check all tools/i })).toBeVisible();
    await page.getByRole('link', { name: /Price Checker/i }).click();
    await expect(page).toHaveURL(/\/price-intelligence/);
    await expect(page.getByRole('heading', { name: /Price Intelligence/i })).toBeVisible();
  });

  test('should highlight active menu item', async ({ page }) => {
    const todayLink = page.locator('aside').getByRole('link', { name: 'Today', exact: true });
    await expect(todayLink).toHaveClass(/bg-gray-950/);

    await page.locator('aside').getByRole('link', { name: 'Homeowners', exact: true }).click();
    const homeownersLink = page.locator('aside').getByRole('link', { name: 'Homeowners', exact: true });
    await expect(homeownersLink).toHaveClass(/bg-gray-950/);
    await expect(todayLink).not.toHaveClass(/bg-gray-950/);
  });

  test('sidebar shows group headings Today, Jobs, Money, Trust, Directory, Growth, Company', async ({ page }) => {
    const aside = page.locator('aside');
    for (const heading of ['Today', 'Jobs', 'Money', 'Trust', 'Directory', 'Growth', 'Company']) {
      await expect(aside.getByText(heading, { exact: true }).first()).toBeVisible();
    }
  });

  test('mobile More sheet shows the same groups', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole('button', { name: 'More' }).click();
    for (const heading of ['Jobs', 'Money', 'Trust', 'Directory', 'Growth', 'Company']) {
      await expect(page.getByText(heading, { exact: true }).first()).toBeVisible();
    }
  });

  test('should logout and redirect to login', async ({ page }) => {
    await page.getByRole('button', { name: /Logout/i }).click();
    await expect(page).toHaveURL(/\/login/);
  });
});



