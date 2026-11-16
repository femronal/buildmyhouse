import { test, expect } from '@playwright/test';

test.describe('Projects Management', () => {
  test.beforeEach(async ({ page }) => {
    const email = process.env.TEST_ADMIN_EMAIL || 'admin@buildmyhouse.com';
    const password = process.env.TEST_ADMIN_PASSWORD || 'admin123';

    await page.goto('/login');
    await page.getByPlaceholder(/admin@buildmyhouse.com/i).fill(email);
    await page.getByPlaceholder(/Enter your password/i).fill(password);
    await page.getByRole('button', { name: /Sign In/i }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
    await page.locator('aside').getByRole('link', { name: 'Projects', exact: true }).click();
    await expect(page).toHaveURL(/\/projects/);
  });

  test('shows Project Monitoring with Needs attention selected', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Project Monitoring' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Needs attention/i })).toHaveAttribute('aria-pressed', 'true');
  });

  test('search filters the rows', async ({ page }) => {
    const search = page.getByPlaceholder('Search project, homeowner, GC, BMH id');
    await search.fill('zzzz-no-such-project');
    await expect(page.getByText('No projects match the current filters.')).toBeVisible();
  });

  test('a row opens the drawer and Escape closes it', async ({ page }) => {
    const row = page.locator('table [data-testid="project-row"]').first();
    await expect(row).toBeVisible({ timeout: 10000 });
    await row.click();
    const drawer = page.getByRole('dialog', { name: 'Project details' });
    await expect(drawer).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(drawer).toBeHidden();
  });

  test('the row menu lists Delete project... last and Delete stays disabled until the name is typed', async ({ page }) => {
    const row = page.locator('table [data-testid="project-row"]').first();
    await expect(row).toBeVisible({ timeout: 10000 });
    const name = (await row.locator('p').first().innerText()).trim();
    await row.getByRole('button', { name: 'Project actions' }).click();
    const items = page.getByRole('menu').getByRole('menuitem');
    await expect(items.last()).toHaveText('Delete project...');
    await items.last().click();
    const remove = page.getByRole('button', { name: 'Delete', exact: true });
    await expect(remove).toBeDisabled();
    await page.getByLabel('Type the project name to confirm').fill(name);
    await expect(remove).toBeEnabled();
  });

  test('Invoice bank account opens the three bank inputs', async ({ page }) => {
    await page.getByRole('button', { name: 'Invoice bank account' }).click();
    const dialog = page.getByRole('dialog', { name: 'Invoice bank account' });
    await expect(dialog.getByPlaceholder('Bank name')).toBeVisible();
    await expect(dialog.getByPlaceholder('Account number')).toBeVisible();
    await expect(dialog.getByPlaceholder('Account name')).toBeVisible();
  });
});
