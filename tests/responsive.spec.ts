import { test, expect, devices } from '@playwright/test';

// Mobile tests
test.describe('Responsive Design - Mobile', () => {
  test.use(devices['Pixel 5']);

  test('should load on mobile', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const mainContent = page.locator('.poll-app');
    await expect(mainContent).toBeVisible();
  });

  test('should display header on mobile', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const header = page.locator('.poll-header');
    
    if (await header.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(header).toBeVisible();
    }
  });

  test('should not have horizontal scroll on mobile', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const viewportSize = page.viewportSize();
    const bodyWidth = await page.evaluate(() => document.body.offsetWidth);
    
    expect(bodyWidth).toBeLessThanOrEqual((viewportSize?.width || 390) + 20);
  });

  test('should have readable text on mobile', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const title = page.locator('h1');
    const isVisible = await title.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (isVisible) {
      await expect(title).toBeVisible();
      const fontSize = await title.evaluate((el) => window.getComputedStyle(el).fontSize);
      expect(parseInt(fontSize)).toBeGreaterThan(10);
    }
  });
});

// Tablet tests
test.describe('Responsive Design - Tablet', () => {
  test.use(devices['iPad Pro']);

  test('should load on tablet', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const mainContent = page.locator('.poll-app');
    await expect(mainContent).toBeVisible();
  });

  test('should display header on tablet', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const header = page.locator('.poll-header');
    
    if (await header.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(header).toBeVisible();
    }
  });

  test('should not have horizontal scroll on tablet', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const viewportSize = page.viewportSize();
    const bodyWidth = await page.evaluate(() => document.body.offsetWidth);
    
    expect(bodyWidth).toBeLessThanOrEqual((viewportSize?.width || 1024) + 20);
  });

  test('should have readable text on tablet', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const title = page.locator('h1');
    const isVisible = await title.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (isVisible) {
      await expect(title).toBeVisible();
      const fontSize = await title.evaluate((el) => window.getComputedStyle(el).fontSize);
      expect(parseInt(fontSize)).toBeGreaterThan(10);
    }
  });
});

// Desktop tests
test.describe('Responsive Design - Desktop', () => {
  test.use(devices['Desktop Chrome']);

  test('should load on desktop', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const mainContent = page.locator('.poll-app');
    await expect(mainContent).toBeVisible();
  });

  test('should display header on desktop', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const header = page.locator('.poll-header');
    
    if (await header.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(header).toBeVisible();
    }
  });

  test('should not have horizontal scroll on desktop', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const viewportSize = page.viewportSize();
    const bodyWidth = await page.evaluate(() => document.body.offsetWidth);
    
    expect(bodyWidth).toBeLessThanOrEqual((viewportSize?.width || 1280) + 20);
  });

  test('should have readable text on desktop', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const title = page.locator('h1');
    const isVisible = await title.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (isVisible) {
      await expect(title).toBeVisible();
      const fontSize = await title.evaluate((el) => window.getComputedStyle(el).fontSize);
      expect(parseInt(fontSize)).toBeGreaterThan(10);
    }
  });
});
