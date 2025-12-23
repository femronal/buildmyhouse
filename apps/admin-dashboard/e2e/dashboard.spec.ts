import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    const email = process.env.TEST_ADMIN_EMAIL || 'admin@buildmyhouse.com';
    const password = process.env.TEST_ADMIN_PASSWORD || 'admin123';

    await page.goto('/login');
    await page.getByPlaceholder(/admin@buildmyhouse.com/i).fill(email);
    await page.getByPlaceholder(/Enter your password/i).fill(password);
    await page.getByRole('button', { name: /Sign In/i }).click();
    
    // Wait for dashboard to load
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
  });

  test('should display dashboard overview', async ({ page }) => {
    await expect(page.getByText(/Dashboard Overview/i)).toBeVisible();
    await expect(page.getByText(/Total Users/i)).toBeVisible();
    await expect(page.getByText(/Active Projects/i)).toBeVisible();
    await expect(page.getByText(/Total Payments/i)).toBeVisible();
    await expect(page.getByText(/Marketplace Items/i)).toBeVisible();
  });

  test('should display stats cards', async ({ page }) => {
    // Check that stat cards are visible
    const stats = ['Total Users', 'Active Projects', 'Total Payments', 'Marketplace Items'];
    
    for (const stat of stats) {
      await expect(page.getByText(stat)).toBeVisible();
    }
  });

  test('should display recent activity section', async ({ page }) => {
    await expect(page.getByText(/Recent Activity/i)).toBeVisible();
  });

  test('should display quick actions', async ({ page }) => {
    await expect(page.getByText(/Quick Actions/i)).toBeVisible();
    await expect(page.getByText(/Verify Pending Users/i)).toBeVisible();
    await expect(page.getByText(/Review Disputes/i)).toBeVisible();
    await expect(page.getByText(/Monitor Active Projects/i)).toBeVisible();
  });
});


