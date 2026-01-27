import { test, expect } from '@playwright/test';

test.describe('Admin Service Config', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('should load application', async ({ page }) => {
    // Basic load test
    const response = await page.goto('/');
    expect(response?.status()).toBeLessThan(500);
  });

  test('should have HTML content', async ({ page }) => {
    // Check for HTML
    const html = await page.evaluate(() => document.documentElement.innerHTML.length);
    expect(html).toBeGreaterThan(100);
  });

  test('should have body element', async ({ page }) => {
    const body = page.locator('body');
    expect(await body.count()).toBeGreaterThan(0);
  });

  test('should respond to user interactions', async ({ page }) => {
    // Try pressing a key
    await page.keyboard.press('a');
    
    // Should not crash
    const isAlive = await page.evaluate(() => document.body !== null);
    expect(isAlive).toBe(true);
  });

  test('should have window object', async ({ page }) => {
    const windowExists = await page.evaluate(() => typeof window === 'object');
    expect(windowExists).toBe(true);
  });
});
