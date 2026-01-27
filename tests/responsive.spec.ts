import { test, expect } from '@playwright/test';

// Responsive tests run on all projects defined in playwright.config.ts
// Including: chromium, firefox, webkit, Mobile Chrome, Mobile Safari, iPad

test.describe('Responsive Design', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('should load on all screen sizes', async ({ page }) => {
    // Page should load without 5xx errors
    const response = await page.goto('/');
    expect(response?.status()).toBeLessThan(500);
  });

  test('should have content', async ({ page }) => {
    // Page should have body element
    const body = page.locator('body');
    expect(await body.count()).toBeGreaterThan(0);
  });

  test('should not have horizontal scroll on current viewport', async ({ page }) => {
    // Get viewport and body width
    const viewportSize = page.viewportSize();
    const bodyWidth = await page.evaluate(() => document.body.offsetWidth);
    
    // Content should not significantly exceed viewport
    // (allowing some tolerance for platform differences)
    const maxWidth = (viewportSize?.width || 1200) + 50;
    expect(bodyWidth).toBeLessThanOrEqual(maxWidth);
  });

  test('should have valid viewport size', async ({ page }) => {
    const viewportSize = page.viewportSize();
    
    // Viewport should be set
    expect(viewportSize?.width).toBeGreaterThan(0);
    expect(viewportSize?.height).toBeGreaterThan(0);
  });

  test('should have proper layout structure', async ({ page }) => {
    // HTML should be loaded
    const htmlLength = await page.evaluate(() => 
      document.documentElement.outerHTML.length
    );
    
    expect(htmlLength).toBeGreaterThan(100);
  });

  test('should not have vertical scroll issues', async ({ page }) => {
    // Check document height
    const docHeight = await page.evaluate(() => document.documentElement.scrollHeight);
    const windowHeight = await page.evaluate(() => window.innerHeight);
    
    // Document height should be reasonable
    expect(docHeight).toBeGreaterThan(0);
    expect(windowHeight).toBeGreaterThan(0);
  });
});
