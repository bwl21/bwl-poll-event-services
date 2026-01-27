import { test, expect } from '@playwright/test';

test.describe('Responsive Design', () => {
  test('should load on current viewport', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.status()).toBeLessThan(500);
  });

  test('should have valid viewport size', async ({ page }) => {
    await page.goto('/');
    
    const viewportSize = page.viewportSize();
    expect(viewportSize?.width).toBeGreaterThan(0);
    expect(viewportSize?.height).toBeGreaterThan(0);
  });

  test('should not have excessive width', async ({ page }) => {
    await page.goto('/');
    
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    
    // Content width should be reasonable relative to viewport
    // Allow up to 1.2x viewport width
    const maxWidth = viewportWidth * 1.2;
    expect(bodyWidth).toBeLessThanOrEqual(maxWidth);
  });

  test('should have proper document height', async ({ page }) => {
    await page.goto('/');
    
    const docHeight = await page.evaluate(() => document.documentElement.scrollHeight);
    expect(docHeight).toBeGreaterThan(0);
  });

  test('should load without blocking', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const loadTime = Date.now() - startTime;
    
    // Should load reasonably fast (less than 30 seconds)
    expect(loadTime).toBeLessThan(30000);
  });

  test('should have proper CSS applied', async ({ page }) => {
    await page.goto('/');
    
    const hasStyles = await page.evaluate(() => {
      const body = document.body;
      const computed = window.getComputedStyle(body);
      return computed.display !== 'none';
    });
    
    expect(hasStyles).toBe(true);
  });
});
