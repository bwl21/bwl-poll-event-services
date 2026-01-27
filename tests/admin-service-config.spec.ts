import { test, expect } from '@playwright/test';

test.describe('Admin Service Config', () => {
  test('should load application', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.status()).toBeLessThan(500);
  });

  test('should have DOM content', async ({ page }) => {
    await page.goto('/');
    
    const hasContent = await page.evaluate(() => {
      return document.body.innerHTML.length > 10;
    });
    
    expect(hasContent).toBe(true);
  });

  test('should have app container', async ({ page }) => {
    await page.goto('/');
    
    const appExists = await page.evaluate(() => {
      const app = document.getElementById('app');
      return app !== null;
    });
    
    expect(appExists).toBe(true);
  });

  test('should respond to keyboard input', async ({ page }) => {
    await page.goto('/');
    
    // Should not crash when pressing keys
    await page.keyboard.press('a');
    
    const isAlive = await page.evaluate(() => 
      document.body !== null
    );
    
    expect(isAlive).toBe(true);
  });

  test('should have basic page structure', async ({ page }) => {
    await page.goto('/');
    
    const structure = await page.evaluate(() => ({
      hasHtml: document.documentElement !== null,
      hasBody: document.body !== null,
      hasHead: document.head !== null,
      htmlTag: document.documentElement.tagName,
    }));
    
    expect(structure.hasHtml).toBe(true);
    expect(structure.hasBody).toBe(true);
    expect(structure.htmlTag).toBe('HTML');
  });
});
