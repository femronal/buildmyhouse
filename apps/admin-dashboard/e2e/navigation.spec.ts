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
    await page.getByRole('link', { name: /Projects/i }).click();
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

  test('should highlight active menu item', async ({ page }) => {
    // Dashboard should be active by default
    const dashboardLink = page.getByRole('link', { name: /Dashboard/i });
    await expect(dashboardLink).toHaveClass(/bg-blue-600/);

    // Navigate to homeowners
    await page.getByRole('link', { name: /Homeowners/i }).click();
    const homeownersLink = page.getByRole('link', { name: /Homeowners/i });
    await expect(homeownersLink).toHaveClass(/bg-blue-600/);
    await expect(dashboardLink).not.toHaveClass(/bg-blue-600/);
  });

  test('should logout and redirect to login', async ({ page }) => {
    await page.getByRole('button', { name: /Logout/i }).click();
    await expect(page).toHaveURL(/\/login/);
  });
});



