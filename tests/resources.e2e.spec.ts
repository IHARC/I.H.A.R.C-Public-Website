import { test, expect } from '@playwright/test';

test.describe('Reports & Resources hub', () => {
  test('applies filters and opens a resource detail page', async ({ page }) => {
    await page.goto('/resources');

    await expect(page.getByRole('heading', { name: /Reports & Resources/i })).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: /resource/ })).toContainText('1 resource');

    await page.getByRole('button', { name: /All types/i }).click();
    await page.getByRole('option', { name: /Delegation/i }).click();
    await expect(page.getByRole('heading', { level: 2, name: /1 resource/ })).toBeVisible();

    await page.fill('#resource-search', 'No matches');
    await page.keyboard.press('Enter');
    await expect(page.getByText(/No resources match/)).toBeVisible();

    await page.getByRole('button', { name: /Reset filters/i }).click();
    await expect(page.getByRole('heading', { name: /1 resource/ })).toBeVisible();

    await page.getByRole('link', { name: /Northumberland County Council Delegation/i }).click();
    await expect(page).toHaveURL(/\/resources\/northumberland-county-emergency-delegation-2024/);
    await expect(page.getByRole('heading', { name: /Northumberland County Council Delegation/i })).toBeVisible();
    await expect(page.getByTitle(/Google Document/)).toBeVisible();
  });
});
