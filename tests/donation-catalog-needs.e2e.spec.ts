import { expect, test } from '@playwright/test';

test.describe('Donation catalogue needs UX', () => {
  test('supports needed-only, category chips, and fill-the-gap', async ({ page }) => {
    await page.goto('/donate');

    await expect(page.getByRole('heading', { name: 'Donate online' })).toBeVisible();

    const neededOnly = page.getByRole('switch', { name: 'Needed only' });
    await expect(neededOnly).toHaveAttribute('aria-checked', 'true');
    await neededOnly.click();
    await expect(neededOnly).toHaveAttribute('aria-checked', 'false');
    await neededOnly.click();
    await expect(neededOnly).toHaveAttribute('aria-checked', 'true');

    const categories = page.getByRole('group', { name: 'Categories' });
    const categoryButtons = categories.getByRole('button');
    const categoryCount = await categoryButtons.count();
    expect(categoryCount).toBeGreaterThan(1);
    await categoryButtons.nth(1).click();

    const fillGap = page.getByRole('button', { name: 'Fill the gap' }).first();
    await expect(fillGap).toBeVisible();
    await fillGap.click();

    await expect(page.getByText(/Symbolic items \(\d+\)/)).toBeVisible();
  });
});
