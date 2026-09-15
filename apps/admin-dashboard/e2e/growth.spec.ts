import { test, expect } from '@playwright/test';

const MODULE_TITLES = [
  'Partnerships',
  'Referrals',
  'Affiliates',
  'Leads',
  'Campaigns',
  'Growth Dashboard',
];

test.describe('Growth overview', () => {
  test.beforeEach(async ({ page }) => {
    const email = process.env.TEST_ADMIN_EMAIL || 'admin@buildmyhouse.com';
    const password = process.env.TEST_ADMIN_PASSWORD || 'admin123';

    await page.goto('/login');
    await page.getByPlaceholder(/admin@buildmyhouse.com/i).fill(email);
    await page.getByPlaceholder(/Enter your password/i).fill(password);
    await page.getByRole('button', { name: /Sign In/i }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
  });

  test('shows Growth in the sidebar and opens the overview', async ({ page }) => {
    const growthNav = page.getByRole('link', { name: /^Growth$/i });
    await expect(growthNav).toBeVisible();
    await growthNav.click();
    await expect(page).toHaveURL(/\/growth$/);
    await expect(page.getByRole('heading', { level: 1, name: /^Growth$/ })).toBeVisible();
    await expect(growthNav).toHaveClass(/bg-blue-600/);
  });

  test('renders six Coming Soon modules that are not interactive', async ({ page }) => {
    await page.goto('/growth');
    await expect(page.getByRole('heading', { level: 1, name: /^Growth$/ })).toBeVisible();

    for (const title of MODULE_TITLES) {
      const card = page.locator('[data-testid^="growth-module-"]').filter({ hasText: title });
      await expect(card).toBeVisible();
      await expect(card.getByText(/Coming Soon/i)).toBeVisible();
      await expect(card.locator('a')).toHaveCount(0);
      await expect(card.locator('button')).toHaveCount(0);
    }

    await expect(page.locator('[data-testid^="growth-module-"]')).toHaveCount(7);
    await expect(page.getByRole('link', { name: /Waitlist/i })).toBeVisible();
    await expect(page.locator('a[href="/growth/waitlist"]')).toHaveCount(1);
    await expect(page.getByRole('link', { name: /Partnerships|Referrals|Affiliates/i })).toHaveCount(0);
    await expect(page.getByText(/%|₦|conversion rate/i)).toHaveCount(0);
  });

  test('module cards are not keyboard-activatable', async ({ page }) => {
    await page.goto('/growth');
    const firstCard = page.locator('[data-testid="growth-module-partnerships"]');
    await expect(firstCard).toBeVisible();
    await expect(firstCard).not.toBeFocused();
  });

  test('waitlist card opens the waitlist subsection', async ({ page }) => {
    await page.goto('/growth');
    await page.getByTestId('growth-module-waitlist').click();
    await expect(page).toHaveURL(/\/growth\/waitlist$/);
    await expect(page.getByRole('heading', { level: 1, name: /^Waitlist$/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /^Growth$/i })).toHaveClass(/bg-blue-600/);
  });

  test('desktop grid keeps existing admin navigation working', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/growth');
    await expect(page.getByRole('link', { name: /Projects/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /People & HR/i })).toBeVisible();

    const first = page.locator('[data-testid="growth-module-partnerships"]');
    const second = page.locator('[data-testid="growth-module-referrals"]');
    const third = page.locator('[data-testid="growth-module-affiliates"]');
    const firstBox = await first.boundingBox();
    const secondBox = await second.boundingBox();
    const thirdBox = await third.boundingBox();
    expect(firstBox && secondBox && thirdBox).toBeTruthy();
    expect(Math.abs((firstBox?.y || 0) - (secondBox?.y || 0))).toBeLessThan(20);
    expect(Math.abs((secondBox?.y || 0) - (thirdBox?.y || 0))).toBeLessThan(20);
  });

  test('mobile layout stacks cards without horizontal scroll', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/growth');
    await expect(page.getByRole('heading', { level: 1, name: /^Growth$/ })).toBeVisible();
    await expect(page.getByText(/Coming Soon/i).first()).toBeVisible();

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2);
    expect(overflow).toBeFalsy();

    const first = page.locator('[data-testid="growth-module-partnerships"]');
    const second = page.locator('[data-testid="growth-module-referrals"]');
    const firstBox = await first.boundingBox();
    const secondBox = await second.boundingBox();
    expect((secondBox?.y || 0) > (firstBox?.y || 0) + 40).toBeTruthy();
  });
});
