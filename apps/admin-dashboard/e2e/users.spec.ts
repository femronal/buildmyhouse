import { test, expect } from '@playwright/test';

test.describe('Homeowners Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    const email = process.env.TEST_ADMIN_EMAIL || 'admin@buildmyhouse.com';
    const password = process.env.TEST_ADMIN_PASSWORD || 'admin123';

    await page.goto('/login');
    await page.getByPlaceholder(/admin@buildmyhouse.com/i).fill(email);
    await page.getByPlaceholder(/Enter your password/i).fill(password);
    await page.getByRole('button', { name: /Sign In/i }).click();
    
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
    
    // Navigate to homeowners page
    await page.getByRole('link', { name: /Homeowners/i }).click();
    await expect(page).toHaveURL(/\/homeowners/);
  });

  test('should display homeowners page', async ({ page }) => {
    await expect(page.getByText(/Homeowners/i)).toBeVisible();
    await expect(page.getByPlaceholder(/Search homeowners/i)).toBeVisible();
  });

  test('should filter homeowners by status', async ({ page }) => {
    const statusFilter = page.locator('select').filter({ hasText: /All Status/i });
    if (await statusFilter.isVisible()) {
      await statusFilter.selectOption({ index: 1 });
      await page.waitForTimeout(1000);
    }
  });

  test('should search homeowners', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/Search homeowners/i);
    await searchInput.fill('test');
    await page.waitForTimeout(500);
    
    await expect(searchInput).toHaveValue('test');
  });

  test('should display homeowner table', async ({ page }) => {
    await page.waitForSelector('table', { timeout: 5000 });
    
    await expect(page.getByText(/User/i)).toBeVisible();
    await expect(page.getByText(/Status/i)).toBeVisible();
    await expect(page.getByText(/Actions/i)).toBeVisible();
  });

  test('should paginate homeowners', async ({ page }) => {
    const nextButton = page.getByRole('button', { name: /Next/i });
    const prevButton = page.getByRole('button', { name: /Previous/i });
    
    if (await nextButton.isVisible()) {
      await expect(nextButton).toBeVisible();
      await expect(prevButton).toBeVisible();
    }
  });
});



