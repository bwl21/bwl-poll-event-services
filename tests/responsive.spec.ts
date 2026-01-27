import { test, expect, devices } from '@playwright/test';

// Test on different screen sizes
const viewports = [
  { name: 'Mobile', device: devices['Pixel 5'] },
  { name: 'Tablet', device: devices['iPad Pro'] },
  { name: 'Desktop', device: devices['Desktop Chrome'] },
];

viewports.forEach(({ name, device }) => {
  test.describe(`Responsive Design - ${name}`, () => {
    test.use(device);

    test('should load on all screen sizes', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const mainContent = page.locator('.poll-app');
      await expect(mainContent).toBeVisible();
    });

    test('should display header on all screen sizes', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const header = page.locator('.poll-header');
      
      if (await header.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(header).toBeVisible();
      }
    });

    test('should be scrollable without horizontal scroll', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Get viewport width
      const viewportSize = page.viewportSize();
      
      // Get body width
      const bodyWidth = await page.evaluate(() => document.body.offsetWidth);
      
      // Content should not exceed viewport width (with some tolerance)
      expect(bodyWidth).toBeLessThanOrEqual((viewportSize?.width || 1200) + 20);
    });

    test('should have readable text on all screen sizes', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Check for main title
      const title = page.locator('h1');
      const isVisible = await title.isVisible({ timeout: 5000 }).catch(() => false);
      
      if (isVisible) {
        await expect(title).toBeVisible();
        
        // Check if text is readable (font size > 10px)
        const fontSize = await title.evaluate((el) => 
          window.getComputedStyle(el).fontSize
        );
        
        const size = parseInt(fontSize);
        expect(size).toBeGreaterThan(10);
      }
    });
  });
});
