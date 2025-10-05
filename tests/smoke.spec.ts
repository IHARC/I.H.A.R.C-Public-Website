import { test, expect } from '@playwright/test';

test.describe('IHARC Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load homepage successfully', async ({ page }) => {
    // Check that the page loads
    await expect(page).toHaveTitle(/IHARC/);
    
    // Check hero section is visible
    await expect(page.locator('h1')).toContainText('Direct Action');
    await expect(page.locator('h1')).toContainText('Real Impact');
  });

  test('should have working navigation', async ({ page }) => {
    // Check header navigation exists
    await expect(page.locator('nav[role="navigation"]')).toBeVisible();
    
    // Check navigation links are present
    await expect(page.locator('nav a', { hasText: 'About' })).toBeVisible();
    await expect(page.locator('nav a', { hasText: 'Programs & Services' })).toBeVisible();
    await expect(page.locator('nav a', { hasText: 'Get Help' })).toBeVisible();
  });

  test('should have accessible quick access section', async ({ page }) => {
    // Check quick access section exists
    await expect(page.locator('h2', { hasText: 'Quick Access' })).toBeVisible();
    
    // Check quick access cards are present
    const quickAccessCards = page.locator('a:has-text("Need Help Tonight?")');
    await expect(quickAccessCards).toBeVisible();
    
    // Verify emergency notice
    await expect(page.locator('text=Emergency? Call 911')).toBeVisible();
  });

  test('should display programs and services', async ({ page }) => {
    // Check programs section
    await expect(page.locator('h2', { hasText: 'Programs & Services' })).toBeVisible();
    
    // Check that program cards are visible
    await expect(page.locator('text=Outreach')).toBeVisible();
    await expect(page.locator('text=Crisis Response')).toBeVisible();
  });

  test('should show impact counters', async ({ page }) => {
    // Check impact section
    await expect(page.locator('h2', { hasText: 'Our Impact' })).toBeVisible();
    
    // Check that counters are present (they start at 0 and animate)
    const counters = page.locator('[data-counter]');
    await expect(counters).toHaveCount(4);
  });

  test('should display news section', async ({ page }) => {
    // Check news section
    await expect(page.locator('h2', { hasText: 'News & Updates' })).toBeVisible();
    
    // Check that news cards are visible
    const newsCount = await page.locator('article').count();
    expect(newsCount).toBeGreaterThanOrEqual(1);
    
    // Check "View All News" button
    await expect(page.locator('a', { hasText: 'View All News' })).toBeVisible();
  });

  test('should have footer with contact information', async ({ page }) => {
    // Check footer exists
    await expect(page.locator('footer')).toBeVisible();
    
    // Check contact information
    await expect(page.locator('footer', { hasText: 'IHARC' })).toBeVisible();
    await expect(page.locator('footer', { hasText: '(905) 555-HELP' })).toBeVisible();
    
    // Check emergency contact in footer
    await expect(page.locator('text=24/7 Crisis Support')).toBeVisible();
  });
});

test.describe('Accessibility', () => {
  test('should have skip link for keyboard users', async ({ page }) => {
    await page.goto('/');
    
    // Tab to focus skip link
    await page.keyboard.press('Tab');
    
    // Check skip link becomes visible
    const skipLink = page.locator('.skip-link');
    await expect(skipLink).toBeVisible();
    await expect(skipLink).toContainText('Skip to main content');
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/');
    
    // Check main heading
    const h1 = page.locator('h1');
    await expect(h1).toHaveCount(1);
    
    // Check section headings exist
    const h2Count = await page.locator('h2').count();
    expect(h2Count).toBeGreaterThanOrEqual(4);
  });

  test('should have proper focus management', async ({ page }) => {
    await page.goto('/');
    
    // Test keyboard navigation through header
    await page.keyboard.press('Tab'); // Skip link
    await page.keyboard.press('Tab'); // Logo
    await page.keyboard.press('Tab'); // First nav item
    
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });
});

test.describe('Mobile Navigation', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('should have working mobile menu', async ({ page }) => {
    await page.goto('/');
    
    // Mobile menu button should be visible
    const mobileMenuButton = page.locator('#mobile-menu-button');
    await expect(mobileMenuButton).toBeVisible();
    
    // Click to open mobile menu
    await mobileMenuButton.click();
    
    // Check mobile menu is visible
    const mobileMenu = page.locator('#mobile-menu');
    await expect(mobileMenu).toBeVisible();
    
    // Check navigation items are in mobile menu
    await expect(mobileMenu.locator('a', { hasText: 'About' })).toBeVisible();
    
    // Check CTA buttons are in mobile menu
    await expect(mobileMenu.locator('a', { hasText: 'Get Help Now' })).toBeVisible();
  });

  test('should close mobile menu with escape key', async ({ page }) => {
    await page.goto('/');
    
    const mobileMenuButton = page.locator('#mobile-menu-button');
    const mobileMenu = page.locator('#mobile-menu');
    
    // Open mobile menu
    await mobileMenuButton.click();
    await expect(mobileMenu).toBeVisible();
    
    // Press escape to close
    await page.keyboard.press('Escape');
    await expect(mobileMenu).toBeHidden();
  });
});

test.describe('Performance', () => {
  test('should load within reasonable time', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    // Should load within 5 seconds (generous for testing)
    expect(loadTime).toBeLessThan(5000);
  });

  test('should have no console errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    
    page.on('console', (message) => {
      if (message.type() === 'error') {
        consoleErrors.push(message.text());
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Should have no console errors
    expect(consoleErrors).toHaveLength(0);
  });
});
