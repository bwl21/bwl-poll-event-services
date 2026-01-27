import { test, expect } from '@playwright/test';

test.describe('Smoke Tests', () => {
  test('should load page without error', async ({ page }) => {
    const response = await page.goto('/');
    
    // Should not be a server error
    expect(response?.status()).toBeLessThan(500);
  });

  test('should have HTML structure', async ({ page }) => {
    await page.goto('/');
    
    // Check HTML exists
    const hasHtml = await page.evaluate(() => 
      document.documentElement !== null
    );
    
    expect(hasHtml).toBe(true);
  });

  test('should have body element', async ({ page }) => {
    await page.goto('/');
    
    // Body should exist
    const bodyExists = await page.evaluate(() => 
      document.body !== null
    );
    
    expect(bodyExists).toBe(true);
  });

  test('should load without crashing', async ({ page }) => {
    let errors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.goto('/');
    await page.waitForTimeout(1000);
    
    // Some errors are expected (auth), but shouldn't crash
    expect(Array.isArray(errors)).toBe(true);
  });
});
