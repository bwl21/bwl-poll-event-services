import { test } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * Screenshot Tests
 * 
 * Captures screenshots for documentation/manual
 * Run with: npm run screenshots
 * 
 * Screenshots are saved to: docs/screenshots/
 */

// Define __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SCREENSHOT_DIR = path.join(__dirname, '..', 'docs', 'screenshots');

// Helper function to wait for app to be ready
async function waitForAppReady(page: any) {
  // Wait for #app element to exist (don't wait for visible - it might be hidden)
  await page.waitForSelector('#app', { timeout: 10000 });
  // Wait for Vue to render - longer timeout for slow connections
  await page.waitForTimeout(3000);
}

// Helper function to navigate to page with date range parameters
async function navigateWithDateRange(page: any, baseUrl: string) {
  // Set start date to 01.12.2025 and days to 2 via URL parameters
  const url = `${baseUrl}/?start=2025-12-01&days=2`;
  await page.goto(url, { waitUntil: 'networkidle' });
  
  // Wait for page to settle
  await page.waitForTimeout(2000);
}

// Device configurations - Mobile, Tablet, Desktop
const DEVICES = {
  mobile: {
    name: 'Mobile Chrome',
    viewport: { width: 390, height: 844 }
  },
  tablet: {
    name: 'Tablet',
    viewport: { width: 768, height: 1024 }
  },
  desktop: {
    name: 'Desktop Chrome',
    viewport: { width: 1920, height: 1080 }
  }
};



test.describe('Screenshot Captures - Mobile', () => {
  
  test('01-Mobile: Umfrage Overview', async ({ page }) => {
    await page.setViewportSize(DEVICES.mobile.viewport);
    
    // Set date range via URL parameters
    await navigateWithDateRange(page, 'http://localhost:5173');
    
    // Wait for Vue app to render
    await waitForAppReady(page);
    await page.waitForTimeout(1000);
    
    // Wait for content to appear
    try {
      await page.waitForSelector('[class*="card"], [role="tablist"]', { timeout: 5000 });
    } catch {
      await page.waitForTimeout(2000);
    }
    
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/01-mobile-umfrage-overview.png`,
      fullPage: true
    });
  });

  test('02-Mobile: Tabellarische Service-Ansicht', async ({ page }) => {
    await page.setViewportSize(DEVICES.mobile.viewport);
    
    // Set date range via URL parameters
    await navigateWithDateRange(page, 'http://localhost:5173');
    
    // Wait for app to render
    await waitForAppReady(page);
    await page.waitForTimeout(1000);
    
    // Scroll to see full table
    await page.evaluate(() => window.scrollBy(0, 200));
    await page.waitForTimeout(500);
    
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/02-mobile-table-view.png`,
      fullPage: false
    });
  });

  test('03-Mobile: Admin Responses Tab', async ({ page }) => {
    await page.setViewportSize(DEVICES.mobile.viewport);
    
    // Set date range via URL parameters
    await navigateWithDateRange(page, 'http://localhost:5173');
    
    // Wait for app to render
    await waitForAppReady(page);
    await page.waitForTimeout(1000);
    
    // Try to click admin tab
    const adminTab = page.locator('[role="tab"]').filter({ hasText: /admin|Admin/i }).first();
    if (await adminTab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await adminTab.click();
      await page.waitForTimeout(1000);
      
      // Try to click Responses sub-tab
      const responsesTab = page.locator('[role="tab"]').filter({ hasText: /responses|Responses/i }).first();
      if (await responsesTab.isVisible({ timeout: 2000 }).catch(() => false)) {
        await responsesTab.click();
        await page.waitForTimeout(1000);
      }
    }
    
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/03-mobile-admin-responses.png`,
      fullPage: true
    });
  });

  test('04-Mobile: Admin Service Config Tab', async ({ page }) => {
    await page.setViewportSize(DEVICES.mobile.viewport);
    
    // Set date range via URL parameters
    await navigateWithDateRange(page, 'http://localhost:5173');
    
    // Wait for app to render
    await waitForAppReady(page);
    await page.waitForTimeout(1000);
    
    // Try to navigate to admin
    const adminTab = page.locator('[role="tab"]').filter({ hasText: /admin|Admin/i }).first();
    if (await adminTab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await adminTab.click();
      await page.waitForTimeout(1000);
      
      // Try to click Service Config tab (second tab in admin)
      const tabs = page.locator('[role="tab"]');
      const configTab = tabs.filter({ hasText: /Service Config|Config/i }).first();
      if (await configTab.isVisible({ timeout: 2000 }).catch(() => false)) {
        await configTab.click();
        await page.waitForTimeout(1500);
      }
    }
    
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/04-mobile-admin-config.png`,
      fullPage: true
    });
  });
});

test.describe('Screenshot Captures - Tablet', () => {
  
  test('06-Tablet: Umfrage Overview', async ({ page }) => {
    await page.setViewportSize(DEVICES.tablet.viewport);
    
    // Set date range via URL parameters
    await navigateWithDateRange(page, 'http://localhost:5173');
    
    // Wait for Vue app to render
    await waitForAppReady(page);
    await page.waitForTimeout(1000);
    
    // Wait for content to appear
    try {
      await page.waitForSelector('[class*="card"], [role="tablist"]', { timeout: 5000 });
    } catch {
      await page.waitForTimeout(2000);
    }
    
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/06-tablet-umfrage-overview.png`,
      fullPage: true
    });
  });

  test('07-Tablet: Tabellarische Service-Ansicht', async ({ page }) => {
    await page.setViewportSize(DEVICES.tablet.viewport);
    
    // Set date range via URL parameters
    await navigateWithDateRange(page, 'http://localhost:5173');
    
    // Wait for app to render
    await waitForAppReady(page);
    await page.waitForTimeout(1000);
    
    // Scroll to see full table
    await page.evaluate(() => window.scrollBy(0, 200));
    await page.waitForTimeout(500);
    
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/07-tablet-table-view.png`,
      fullPage: false
    });
  });

  test('08-Tablet: Admin Responses Tab', async ({ page }) => {
    await page.setViewportSize(DEVICES.tablet.viewport);
    
    // Set date range via URL parameters
    await navigateWithDateRange(page, 'http://localhost:5173');
    
    // Wait for app to render
    await waitForAppReady(page);
    await page.waitForTimeout(1000);
    
    // Try to click admin tab
    const adminTab = page.locator('[role="tab"]').filter({ hasText: /admin|Admin/i }).first();
    if (await adminTab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await adminTab.click();
      await page.waitForTimeout(1000);
      
      // Try to click Responses sub-tab
      const responsesTab = page.locator('[role="tab"]').filter({ hasText: /responses|Responses/i }).first();
      if (await responsesTab.isVisible({ timeout: 2000 }).catch(() => false)) {
        await responsesTab.click();
        await page.waitForTimeout(1000);
      }
    }
    
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/08-tablet-admin-responses.png`,
      fullPage: true
    });
  });

  test('09-Tablet: Admin Service Config Tab', async ({ page }) => {
    await page.setViewportSize(DEVICES.tablet.viewport);
    
    // Set date range via URL parameters
    await navigateWithDateRange(page, 'http://localhost:5173');
    
    // Wait for app to render
    await waitForAppReady(page);
    await page.waitForTimeout(1000);
    
    // Try to navigate to admin
    const adminTab = page.locator('[role="tab"]').filter({ hasText: /admin|Admin/i }).first();
    if (await adminTab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await adminTab.click();
      await page.waitForTimeout(1000);
      
      // Try to click Service Config tab (second tab in admin)
      const tabs = page.locator('[role="tab"]');
      const configTab = tabs.filter({ hasText: /Service Config|Config/i }).first();
      if (await configTab.isVisible({ timeout: 2000 }).catch(() => false)) {
        await configTab.click();
        await page.waitForTimeout(1500);
      }
    }
    
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/09-tablet-admin-config.png`,
      fullPage: true
    });
  });
});

test.describe('Screenshot Captures - Desktop', () => {
  
  test('01-Desktop: Umfrage Overview', async ({ page }) => {
    await page.setViewportSize(DEVICES.desktop.viewport);
    
    // Set date range via URL parameters
    await navigateWithDateRange(page, 'http://localhost:5173');
    
    // Wait for Vue app to render
    await waitForAppReady(page);
    await page.waitForTimeout(1000);
    
    // Wait for content to appear
    try {
      await page.waitForSelector('[class*="card"], [role="tablist"]', { timeout: 5000 });
    } catch {
      await page.waitForTimeout(2000);
    }
    
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/01-desktop-umfrage-overview.png`,
      fullPage: true
    });
  });

  test('02-Desktop: Tabellarische Service-Ansicht', async ({ page }) => {
    await page.setViewportSize(DEVICES.desktop.viewport);
    
    // Set date range via URL parameters
    await navigateWithDateRange(page, 'http://localhost:5173');
    
    // Wait for app to render
    await waitForAppReady(page);
    await page.waitForTimeout(1000);
    
    // Scroll to see full table
    await page.evaluate(() => window.scrollBy(0, 200));
    await page.waitForTimeout(500);
    
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/02-desktop-table-view.png`,
      fullPage: false
    });
  });

  test('03-Desktop: Admin Responses Tab', async ({ page }) => {
    await page.setViewportSize(DEVICES.desktop.viewport);
    
    // Set date range via URL parameters
    await navigateWithDateRange(page, 'http://localhost:5173');
    
    // Wait for app to render
    await waitForAppReady(page);
    await page.waitForTimeout(1000);
    
    // Try to click admin tab
    const adminTab = page.locator('[role="tab"]').filter({ hasText: /admin|Admin/i }).first();
    if (await adminTab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await adminTab.click();
      await page.waitForTimeout(1000);
      
      // Try to click Responses sub-tab
      const responsesTab = page.locator('[role="tab"]').filter({ hasText: /responses|Responses/i }).first();
      if (await responsesTab.isVisible({ timeout: 2000 }).catch(() => false)) {
        await responsesTab.click();
        await page.waitForTimeout(1000);
      }
    }
    
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/03-desktop-admin-responses.png`,
      fullPage: true
    });
  });

  test('04-Desktop: Admin Service Config Tab', async ({ page }) => {
    await page.setViewportSize(DEVICES.desktop.viewport);
    
    // Set date range via URL parameters
    await navigateWithDateRange(page, 'http://localhost:5173');
    
    // Wait for app to render
    await waitForAppReady(page);
    await page.waitForTimeout(1000);
    
    // Try to navigate to admin
    const adminTab = page.locator('[role="tab"]').filter({ hasText: /admin|Admin/i }).first();
    if (await adminTab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await adminTab.click();
      await page.waitForTimeout(1000);
      
      // Try to click Service Config tab (second tab in admin)
      const tabs = page.locator('[role="tab"]');
      const configTab = tabs.filter({ hasText: /Service Config|Config/i }).first();
      if (await configTab.isVisible({ timeout: 2000 }).catch(() => false)) {
        await configTab.click();
        await page.waitForTimeout(1500);
      }
    }
    
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/04-desktop-admin-config.png`,
      fullPage: true
    });
  });

  test('05-Desktop: Admin Export Tab', async ({ page }) => {
    await page.setViewportSize(DEVICES.desktop.viewport);
    
    // Set date range via URL parameters
    await navigateWithDateRange(page, 'http://localhost:5173');
    
    // Wait for app to render
    await waitForAppReady(page);
    await page.waitForTimeout(1000);
    
    // Try to navigate to export
    const adminTab = page.locator('[role="tab"]').filter({ hasText: /admin|Admin/i }).first();
    if (await adminTab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await adminTab.click();
      await page.waitForTimeout(1000);
      
      // Try to find export tab (usually last)
      const tabs = page.locator('[role="tab"]');
      const tabCount = await tabs.count();
      if (tabCount > 2) {
        const exportTab = tabs.last();
        if (await exportTab.isVisible({ timeout: 2000 }).catch(() => false)) {
          await exportTab.click();
          await page.waitForTimeout(1000);
        }
      }
    }
    
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/05-desktop-admin-export.png`,
      fullPage: true
    });
  });
});


