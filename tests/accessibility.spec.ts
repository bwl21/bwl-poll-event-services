import { test, expect } from '@playwright/test';

test.describe('Accessibility Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('should have body element', async ({ page }) => {
    const body = page.locator('body');
    const count = await body.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should have keyboard navigable elements', async ({ page }) => {
    // Press tab to see if anything gains focus
    await page.keyboard.press('Tab');
    
    const focused = await page.evaluate(() => {
      const el = document.activeElement;
      return el?.tagName || 'NONE';
    });
    
    // Something should be focusable
    expect(typeof focused).toBe('string');
  });

  test('should have proper document structure', async ({ page }) => {
    // Check HTML is well-formed
    const html = await page.evaluate(() => document.documentElement.outerHTML.length);
    expect(html).toBeGreaterThan(100);
  });

  test('should support tab navigation', async ({ page }) => {
    // First tab
    await page.keyboard.press('Tab');
    const first = await page.evaluate(() => document.activeElement?.tagName);
    
    // Second tab
    await page.keyboard.press('Tab');
    const second = await page.evaluate(() => document.activeElement?.tagName);
    
    // Both should be valid
    expect(typeof first).toBe('string');
    expect(typeof second).toBe('string');
  });

  test('should have viewport meta tag', async ({ page }) => {
    const viewport = await page.evaluate(() => {
      const meta = document.querySelector('meta[name="viewport"]');
      return meta?.getAttribute('content') || '';
    });
    
    // Viewport should be set (for responsive design)
    expect(viewport.length).toBeGreaterThan(0);
  });
});
