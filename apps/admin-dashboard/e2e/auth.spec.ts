import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');
  });

  test('should display login page', async ({ page }) => {
    await expect(page).toHaveTitle(/BuildMyHouse/i);
    await expect(page.getByPlaceholder(/admin@buildmyhouse.com/i)).toBeVisible();
    await expect(page.getByPlaceholder(/Enter your password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Sign In/i })).toBeVisible();
  });

  test('should show error on invalid credentials', async ({ page }) => {
    await page.getByPlaceholder(/admin@buildmyhouse.com/i).fill('invalid@email.com');
    await page.getByPlaceholder(/Enter your password/i).fill('wrongpassword');
    await page.getByRole('button', { name: /Sign In/i }).click();

    // Should show error message
    await expect(page.getByText(/Invalid credentials/i)).toBeVisible({ timeout: 5000 });
  });

  test('should redirect to dashboard on successful login', async ({ page }) => {
    // Note: This test requires a valid user in the database
    // You may need to create a test user first
    const email = process.env.TEST_ADMIN_EMAIL || 'admin@buildmyhouse.com';
    const password = process.env.TEST_ADMIN_PASSWORD || 'admin123';

    await page.getByPlaceholder(/admin@buildmyhouse.com/i).fill(email);
    await page.getByPlaceholder(/Enter your password/i).fill(password);
    await page.getByRole('button', { name: /Sign In/i }).click();

    // Should redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
    await expect(page.getByText(/Dashboard Overview/i)).toBeVisible();
  });

  test('should require email and password', async ({ page }) => {
    // Try to submit without filling fields
    await page.getByRole('button', { name: /Sign In/i }).click();

    // HTML5 validation should prevent submission
    const emailInput = page.getByPlaceholder(/admin@buildmyhouse.com/i);
    const passwordInput = page.getByPlaceholder(/Enter your password/i);

    await expect(emailInput).toHaveAttribute('required');
    await expect(passwordInput).toHaveAttribute('required');
  });
});



