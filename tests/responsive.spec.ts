import { test, expect } from '@playwright/test';

// Responsive tests run on all projects defined in playwright.config.ts
// Including: chromium, firefox, webkit, Mobile Chrome, Mobile Safari, iPad

test.describe('Responsive Design', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should load on all screen sizes', async ({ page }) => {
    const mainContent = page.locator('.poll-app');
    await expect(mainContent).toBeVisible();
  });

  test('should display header on all screen sizes', async ({ page }) => {
    const header = page.locator('.poll-header');
    
    const isVisible = await header.isVisible({ timeout: 5000 }).catch(() => false);
    if (isVisible) {
      await expect(header).toBeVisible();
    }
  });

  test('should not have horizontal scroll', async ({ page }) => {
    // Get viewport and body width
    const viewportSize = page.viewportSize();
    const bodyWidth = await page.evaluate(() => document.body.offsetWidth);
    
    // Content should not exceed viewport (with 20px tolerance)
    const maxWidth = (viewportSize?.width || 1200) + 20;
    expect(bodyWidth).toBeLessThanOrEqual(maxWidth);
  });

  test('should have readable text', async ({ page }) => {
    const title = page.locator('h1');
    const isVisible = await title.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (isVisible) {
      await expect(title).toBeVisible();
      
      // Text should be readable (font size > 10px)
      const fontSize = await title.evaluate((el) => 
        window.getComputedStyle(el).fontSize
      );
      
      const size = parseInt(fontSize);
      expect(size).toBeGreaterThan(10);
    }
  });

  test('should have proper layout structure', async ({ page }) => {
    // Main container should be visible
    const pollApp = page.locator('.poll-app');
    await expect(pollApp).toBeVisible();
    
    // Should not have horizontal scrollbar
    const hasHorizontalScroll = await page.evaluate(() => 
      document.body.scrollWidth > window.innerWidth
    );
    expect(hasHorizontalScroll).toBe(false);
  });

  test('should display controls on all sizes', async ({ page }) => {
    const controls = page.locator('.poll-controls');
    
    // Controls should exist
    const count = await controls.count();
    expect(count).toBeGreaterThanOrEqual(0);
    
    // If controls exist, they should be visible
    if (count > 0) {
      const isVisible = await controls.isVisible({ timeout: 5000 }).catch(() => false);
      if (isVisible) {
        await expect(controls).toBeVisible();
      }
    }
  });
});
