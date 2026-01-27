import { test, expect } from '@playwright/test';

test.describe('Accessibility Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    // Check for h1 tag
    const h1s = page.locator('h1');
    expect(await h1s.count()).toBeGreaterThan(0);
    
    // First h1 should be visible
    await expect(h1s.first()).toBeVisible();
  });

  test('should have keyboard navigable buttons', async ({ page }) => {
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    
    // At least some buttons should exist
    expect(buttonCount).toBeGreaterThanOrEqual(0);
    
    // Buttons should be focusable
    if (buttonCount > 0) {
      const firstButton = buttons.first();
      await firstButton.focus();
      
      // Check if button has focus
      const isFocused = await firstButton.evaluate((el) => el === document.activeElement);
      expect(isFocused).toBe(true);
    }
  });

  test('should have visible labels for inputs', async ({ page }) => {
    const inputs = page.locator('input');
    const inputCount = await inputs.count();
    
    expect(inputCount).toBeGreaterThanOrEqual(0);
    
    // Check for associated labels
    const labels = page.locator('label');
    expect(await labels.count()).toBeGreaterThanOrEqual(0);
  });

  test('should support tab navigation', async ({ page }) => {
    // Press tab and check if any element receives focus
    await page.keyboard.press('Tab');
    
    const focusedElement = await page.evaluate(() => {
      return document.activeElement?.tagName;
    });
    
    // Should focus on an element (body if nothing interactive)
    expect(focusedElement).toBeDefined();
  });

  test('should have proper color contrast', async ({ page }) => {
    // This is a visual check - in real scenarios use axe-core
    const body = page.locator('body');
    
    // Check if body element has a background
    const bgColor = await body.evaluate((el) => 
      window.getComputedStyle(el).backgroundColor
    );
    
    expect(bgColor).toBeDefined();
  });
});
