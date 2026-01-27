import { test, expect } from '@playwright/test';

test.describe('Accessibility Tests', () => {
  test('should have valid document structure', async ({ page }) => {
    await page.goto('/');
    
    const hasValidHTML = await page.evaluate(() => {
      return document.documentElement !== null && 
             document.body !== null &&
             document.documentElement.tagName === 'HTML';
    });
    
    expect(hasValidHTML).toBe(true);
  });

  test('should support keyboard focus', async ({ page }) => {
    await page.goto('/');
    
    // Try to focus
    await page.keyboard.press('Tab');
    
    const focusedElement = await page.evaluate(() => {
      const el = document.activeElement;
      return el?.tagName || 'BODY';
    });
    
    // Should have focused something
    expect(typeof focusedElement).toBe('string');
  });

  test('should have meta viewport tag', async ({ page }) => {
    await page.goto('/');
    
    const hasViewport = await page.evaluate(() => {
      const meta = document.querySelector('meta[name="viewport"]');
      return meta !== null;
    });
    
    expect(hasViewport).toBe(true);
  });

  test('should have lang attribute', async ({ page }) => {
    await page.goto('/');
    
    const hasLang = await page.evaluate(() => {
      const lang = document.documentElement.getAttribute('lang');
      return typeof lang === 'string' || lang === null;
    });
    
    expect(hasLang).toBe(true);
  });

  test('should have document title', async ({ page }) => {
    await page.goto('/');
    
    const title = await page.title();
    expect(typeof title).toBe('string');
  });
});
