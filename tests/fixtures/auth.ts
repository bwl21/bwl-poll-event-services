import { test as base, Page } from '@playwright/test';

/**
 * Fixture for authenticated pages
 * Just ensures page is loaded and ready
 */
export const test = base.extend<{ authenticatedPage: Page }>({
  authenticatedPage: async ({ page }, use) => {
    // Navigate to app and wait for basic page load
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // Give a brief moment for initial rendering
    await page.waitForTimeout(300);

    // Use the page
    await use(page);
  },
});

export { expect } from '@playwright/test';
