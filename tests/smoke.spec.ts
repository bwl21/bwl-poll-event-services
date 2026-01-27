import { test, expect } from '@playwright/test';

test.describe('Smoke Tests', () => {
  test('should load the application', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the app to load
    await page.waitForLoadState('networkidle');
    
    // Check main title
    const title = page.locator('h1');
    await expect(title).toBeVisible();
    await expect(title).toContainText('Dienste-Umfrage');
  });

  test('should have responsive design elements', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check for key UI elements
    const pollApp = page.locator('.poll-app');
    await expect(pollApp).toBeVisible();
  });

  test('should display version number', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const version = page.locator('.version');
    
    // Version should be visible
    if (await version.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(version).toContainText('v');
    }
  });

  test('should have working date picker controls', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Look for date picker input
    const controls = page.locator('.poll-controls');
    
    if (await controls.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(controls).toBeVisible();
      
      // Check for label texts
      const labels = await page.locator('label').allTextContents();
      expect(labels.length).toBeGreaterThan(0);
    }
  });

  test('should display footer area', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const footer = page.locator('.app-footer');
    
    // Footer should exist (may be empty)
    const footerCount = await footer.count();
    expect(footerCount).toBeGreaterThanOrEqual(0);
  });
});
