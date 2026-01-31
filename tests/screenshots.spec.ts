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

// Helper function to set date range before taking screenshots
async function setDateRange(page: any) {
  // Wait for page to settle after date change
  await page.waitForTimeout(1000);
  
  // Set start date to 01.12.2025
  const dateInput = page.locator('input[type="text"]').first();
  if (await dateInput.isVisible({ timeout: 2000 }).catch(() => false)) {
    await dateInput.clear();
    await dateInput.fill('01.12.2025');
    await page.waitForTimeout(500);
    // Close date picker by pressing Escape
    await page.press('input[type="text"]', 'Escape');
    await page.waitForTimeout(500);
    // Trigger date-select event
    await dateInput.press('Enter');
    await page.waitForTimeout(500);
  }

  // Set days to 10 - find the days input by its position in poll-controls
  const daysInput = page.locator('input[type="number"]');
  if (await daysInput.first().isVisible({ timeout: 2000 }).catch(() => false)) {
    await daysInput.first().clear();
    await daysInput.first().fill('10');
    await page.waitForTimeout(500);
  }

  // Wait for data to load
  await page.waitForTimeout(3000);
}

// Device configurations - only Desktop Chrome and Mobile
const DEVICES = {
  mobile: {
    name: 'Mobile Chrome',
    viewport: { width: 390, height: 844 }
  },
  desktop: {
    name: 'Desktop Chrome',
    viewport: { width: 1920, height: 1080 }
  }
};

test.describe('Screenshot Captures - Mobile First', () => {
  
  test.only('01-Mobile: Umfrage Overview', async ({ page }) => {
    await page.setViewportSize(DEVICES.mobile.viewport);
    await page.goto('/', { waitUntil: 'networkidle' });
    
    // Wait for Vue app to render
    await waitForAppReady(page);
    
    
    // Set date range to 01.12.2025 - 10 days
    await setDateRange(page);
    await page.waitForTimeout(1000);
    
    // Wait for any content to appear
    try {
      await page.waitForSelector('[class*="card"], [role="tablist"]', { timeout: 5000 });
    } catch {
      // If no cards, page might still be loading - wait more
      await page.waitForTimeout(2000);
    }
    
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/01-mobile-umfrage-overview.png`,
      fullPage: true
    });
  });

  test('02-Mobile: Umfrage mit Services', async ({ page }) => {
    await page.setViewportSize(DEVICES.mobile.viewport);
    await page.goto('/', { waitUntil: 'networkidle' });
    
    // Wait for app to render
    await waitForAppReady(page);
    
    
    // Set date range to 01.12.2025 - 10 days
    await setDateRange(page);
    await page.waitForTimeout(1000);
    
    // Scroll to first service
    await page.evaluate(() => window.scrollBy(0, 300));
    await page.waitForTimeout(500);
    
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/02-mobile-service-row.png`,
      fullPage: false
    });
  });

  test('03-Mobile: Admin Tab (falls sichtbar)', async ({ page }) => {
    await page.setViewportSize(DEVICES.mobile.viewport);
    await page.goto('/', { waitUntil: 'networkidle' });
    
    // Wait for app to render
    await waitForAppReady(page);
    
    // Set date range to 01.12.2025 - 10 days
    await setDateRange(page);
    await page.waitForTimeout(1000);
    
    // Try to find and click admin tab
    const adminTab = page.locator('[role="tab"]').filter({ hasText: /admin|Admin/i }).first();
    if (await adminTab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await adminTab.click();
      await page.waitForTimeout(500);
    }
    
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/03-mobile-admin-tab.png`,
      fullPage: true
    });
  });

  test('04-Mobile: Zeitraum-Einstellungen', async ({ page }) => {
    await page.setViewportSize(DEVICES.mobile.viewport);
    await page.goto('/', { waitUntil: 'networkidle' });
    
    // Wait for app to render
    await waitForAppReady(page);
    
    // Scroll to top für date picker (DON'T set date range - show the input fields)
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);
    
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/04-mobile-timerange-settings.png`,
      fullPage: false
    });
  });
});

test.describe('Screenshot Captures - Desktop', () => {
  
  test('05-Desktop: Umfrage Overview', async ({ page }) => {
    await page.setViewportSize(DEVICES.desktop.viewport);
    await page.goto('/', { waitUntil: 'networkidle' });
    
    // Wait for Vue app to render
    await waitForAppReady(page);
    
    // Set date range to 01.12.2025 - 10 days
    await setDateRange(page);
    await page.waitForTimeout(1000);
    
    // Wait for content to appear
    try {
      await page.waitForSelector('[class*="card"], [role="tablist"]', { timeout: 5000 });
    } catch {
      await page.waitForTimeout(2000);
    }
    
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/05-desktop-umfrage-overview.png`,
      fullPage: true
    });
  });

  test('06-Desktop: Tabellarische Service-Ansicht', async ({ page }) => {
    await page.setViewportSize(DEVICES.desktop.viewport);
    await page.goto('/', { waitUntil: 'networkidle' });
    
    // Wait for app to render
    await waitForAppReady(page);
    
    // Set date range to 01.12.2025 - 10 days
    await setDateRange(page);
    await page.waitForTimeout(1000);
    
    // Scroll to see full table
    await page.evaluate(() => window.scrollBy(0, 200));
    await page.waitForTimeout(500);
    
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/06-desktop-table-view.png`,
      fullPage: false
    });
  });

  test('07-Desktop: Admin Responses Tab', async ({ page }) => {
    await page.setViewportSize(DEVICES.desktop.viewport);
    await page.goto('/', { waitUntil: 'networkidle' });
    
    // Wait for app to render
    await waitForAppReady(page);
    
    // Set date range to 01.12.2025 - 10 days
    await setDateRange(page);
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
      path: `${SCREENSHOT_DIR}/07-desktop-admin-responses.png`,
      fullPage: true
    });
  });

  test('08-Desktop: Admin Service Config Tab', async ({ page }) => {
    await page.setViewportSize(DEVICES.desktop.viewport);
    await page.goto('/', { waitUntil: 'networkidle' });
    
    // Wait for app to render
    await waitForAppReady(page);
    
    // Set date range to 01.12.2025 - 10 days
    await setDateRange(page);
    await page.waitForTimeout(1000);
    
    // Try to navigate to admin
    const adminTab = page.locator('[role="tab"]').filter({ hasText: /admin|Admin/i }).first();
    if (await adminTab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await adminTab.click();
      await page.waitForTimeout(1000);
      
      // Try to click Service Config tab
      const configTab = page.locator('[role="tab"]').filter({ hasText: /config|Config|service/i }).nth(1);
      if (await configTab.isVisible({ timeout: 2000 }).catch(() => false)) {
        await configTab.click();
        await page.waitForTimeout(1000);
      }
    }
    
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/08-desktop-admin-config.png`,
      fullPage: true
    });
  });

  test('09-Desktop: Admin Export Tab', async ({ page }) => {
    await page.setViewportSize(DEVICES.desktop.viewport);
    await page.goto('/', { waitUntil: 'networkidle' });
    
    // Wait for app to render
    await waitForAppReady(page);
    
    // Set date range to 01.12.2025 - 10 days
    await setDateRange(page);
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
      path: `${SCREENSHOT_DIR}/09-desktop-admin-export.png`,
      fullPage: true
    });
  });
});

test.describe('Screenshot Info', () => {
  test('info: Print screenshot locations', async () => {
    console.log('\n📸 Screenshots gespeichert in:');
    console.log(`   ${SCREENSHOT_DIR}\n`);
    console.log('Dateien (Desktop Chrome + Mobile):');
    console.log('   01-mobile-umfrage-overview.png');
    console.log('   02-mobile-service-row.png');
    console.log('   03-mobile-admin-tab.png');
    console.log('   04-mobile-timerange-settings.png');
    console.log('   05-desktop-umfrage-overview.png');
    console.log('   06-desktop-table-view.png');
    console.log('   07-desktop-admin-responses.png');
    console.log('   08-desktop-admin-config.png');
    console.log('   09-desktop-admin-export.png\n');
    console.log('💡 Kopiere diese in docs/screenshots/ für USERMANUAL.md\n');
  });
});
