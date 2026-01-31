import { test, expect } from '@playwright/test';

test.describe('IHARC marketing site', () => {
  test('loads the homepage with get-help-first content', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle(/IHARC/);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.getByRole('heading', { name: 'Need support right now?' })).toBeVisible();
    await expect(page.locator('#help').getByRole('link', { name: 'Get help' })).toBeVisible();
  });

  test('shows navigation and footer essentials', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('navigation', { name: 'Marketing pages' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Get help' }).first()).toBeVisible();

    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
    await expect(footer.getByRole('link', { name: 'Get help' })).toBeVisible();
    await expect(footer.getByRole('link', { name: 'Policies' })).toBeVisible();
  });

  test.describe('Mobile navigation', () => {
    test.use({ viewport: { width: 375, height: 667 } });

    test('opens the menu and shows the quick action', async ({ page }) => {
      await page.goto('/');

      const mobileMenuButton = page.getByRole('button', { name: 'Open navigation menu' });
      await expect(mobileMenuButton).toBeVisible();
      await mobileMenuButton.click();

      await expect(page.getByRole('heading', { name: 'Navigation' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Get help' }).first()).toBeVisible();
    });
  });
});
