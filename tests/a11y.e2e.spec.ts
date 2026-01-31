import { test, expect } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';

const ROUTES = ['/', '/get-help', '/stats', '/resources', '/donate'];

test.describe('Accessibility smoke', () => {
  for (const route of ROUTES) {
    test(`passes axe on ${route}`, async ({ page }) => {
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      const results = await new AxeBuilder({ page }).analyze();
      const impactfulViolations = results.violations.filter((violation) =>
        ['critical', 'serious'].includes(violation.impact ?? ''),
      );
      expect(impactfulViolations).toEqual([]);
    });
  }
});
