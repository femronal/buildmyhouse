import { test, expect } from '@playwright/test';

test.describe('Projects Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    const email = process.env.TEST_ADMIN_EMAIL || 'admin@buildmyhouse.com';
    const password = process.env.TEST_ADMIN_PASSWORD || 'admin123';

    await page.goto('/login');
    await page.getByPlaceholder(/admin@buildmyhouse.com/i).fill(email);
    await page.getByPlaceholder(/Enter your password/i).fill(password);
    await page.getByRole('button', { name: /Sign In/i }).click();
    
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
    
    // Navigate to projects page
    await page.getByRole('link', { name: /Projects/i }).click();
    await expect(page).toHaveURL(/\/projects/);
  });

  test('should display projects page', async ({ page }) => {
    await expect(page.getByText(/Project Monitoring/i)).toBeVisible();
  });

  test('should filter projects by status', async ({ page }) => {
    const statusFilter = page.locator('select').filter({ hasText: /All Status/i });
    await statusFilter.selectOption('active');
    
    await page.waitForTimeout(1000);
    await expect(statusFilter).toHaveValue('active');
  });

  test('should search projects', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/Search projects/i);
    await searchInput.fill('test project');
    await page.waitForTimeout(500);
    
    await expect(searchInput).toHaveValue('test project');
  });

  test('should sort projects', async ({ page }) => {
    const sortBySelect = page.locator('select').nth(1); // Sort by select
    if (await sortBySelect.isVisible()) {
      await sortBySelect.selectOption('name');
      await expect(sortBySelect).toHaveValue('name');
    }
  });

  test('should display project cards', async ({ page }) => {
    // Wait for projects to load
    await page.waitForTimeout(2000);
    
    // Check if project cards or table is visible
    const projectSection = page.locator('[class*="grid"]').first();
    await expect(projectSection).toBeVisible({ timeout: 5000 });
  });
});



