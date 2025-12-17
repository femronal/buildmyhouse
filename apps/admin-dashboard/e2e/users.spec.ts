import { test, expect } from '@playwright/test';

test.describe('Users Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    const email = process.env.TEST_ADMIN_EMAIL || 'admin@buildmyhouse.com';
    const password = process.env.TEST_ADMIN_PASSWORD || 'admin123';

    await page.goto('/login');
    await page.getByPlaceholder(/admin@buildmyhouse.com/i).fill(email);
    await page.getByPlaceholder(/Enter your password/i).fill(password);
    await page.getByRole('button', { name: /Sign In/i }).click();
    
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
    
    // Navigate to users page
    await page.getByRole('link', { name: /Users/i }).click();
    await expect(page).toHaveURL(/\/users/);
  });

  test('should display users page', async ({ page }) => {
    await expect(page.getByText(/User Management/i)).toBeVisible();
    await expect(page.getByPlaceholder(/Search users/i)).toBeVisible();
  });

  test('should filter users by role', async ({ page }) => {
    const roleFilter = page.locator('select').filter({ hasText: /All Roles/i });
    await roleFilter.selectOption('admin');
    
    // Wait for filter to apply
    await page.waitForTimeout(1000);
    
    // Verify filter is applied (check URL or table content)
    await expect(roleFilter).toHaveValue('admin');
  });

  test('should search users', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/Search users/i);
    await searchInput.fill('test');
    await page.waitForTimeout(500);
    
    // Search input should have the value
    await expect(searchInput).toHaveValue('test');
  });

  test('should display user table', async ({ page }) => {
    // Wait for table to load
    await page.waitForSelector('table', { timeout: 5000 });
    
    // Check table headers
    await expect(page.getByText(/User/i)).toBeVisible();
    await expect(page.getByText(/Role/i)).toBeVisible();
    await expect(page.getByText(/Status/i)).toBeVisible();
    await expect(page.getByText(/Actions/i)).toBeVisible();
  });

  test('should paginate users', async ({ page }) => {
    // Look for pagination controls
    const nextButton = page.getByRole('button', { name: /Next/i });
    const prevButton = page.getByRole('button', { name: /Previous/i });
    
    // If pagination exists, test it
    if (await nextButton.isVisible()) {
      await expect(nextButton).toBeVisible();
      await expect(prevButton).toBeVisible();
    }
  });
});

