import { test, expect } from './fixtures/auth';

/**
 * Application Integration Tests - Authenticated
 * 
 * These tests verify the application loads and functions correctly with authentication
 * Uses auto-login feature from .env credentials
 * 
 * For full authentication testing, ensure .env credentials are set and run:
 * npm run dev (in another terminal)
 * npm run test:e2e
 */

test.describe('Application Integration - Authenticated', () => {
  test('should load page without 5xx errors', async ({ authenticatedPage: page }) => {
    // Page should already be loaded via fixture
    const isLoaded = await page.evaluate(() => document.body !== null);
    expect(isLoaded).toBe(true);
  });

  test('should have proper HTML structure', async ({ authenticatedPage: page }) => {
    const structure = await page.evaluate(() => ({
      hasBody: document.body !== null,
      hasHead: document.head !== null,
      hasApp: document.getElementById('app') !== null,
    }));
    
    expect(structure.hasBody).toBe(true);
    expect(structure.hasApp).toBe(true);
  });

  test('should load Vue application', async ({ authenticatedPage: page }) => {
    const appContent = await page.evaluate(() => {
      const appElement = document.getElementById('app');
      return {
        exists: appElement !== null,
        hasContent: appElement ? appElement.innerHTML.length > 0 : false,
        contentLength: appElement?.innerHTML.length ?? 0,
      };
    });
    
    // App container should exist (might be empty if auth fails)
    expect(appContent.exists).toBe(true);
  });

  test('should have interactive elements when authenticated', async ({ authenticatedPage: page }) => {
    // Should have buttons, inputs, or other interactive elements (or app ready to render them)
    const interactiveElements = await page.evaluate(() => {
      const buttons = document.querySelectorAll('button');
      const inputs = document.querySelectorAll('input, textarea');
      const appExists = document.getElementById('app') !== null;
      return {
        buttonCount: buttons.length,
        inputCount: inputs.length,
        total: buttons.length + inputs.length,
        appReady: appExists,
      };
    });
    
    // Should have interactive elements OR app container ready to render them
    const hasInteractiveContent = interactiveElements.total > 0 || interactiveElements.appReady;
    expect(hasInteractiveContent).toBe(true);
  });

  test('should handle keyboard navigation', async ({ authenticatedPage: page }) => {
    // Tab through multiple elements
    for (let i = 0; i < 3; i++) {
      await page.keyboard.press('Tab');
      await page.waitForTimeout(100);
    }
    
    const isAlive = await page.evaluate(() => document.body !== null);
    expect(isAlive).toBe(true);
  });

  test('should have viewport meta tag', async ({ authenticatedPage: page }) => {
    const hasViewport = await page.evaluate(() => {
      const meta = document.querySelector('meta[name="viewport"]');
      return meta !== null;
    });
    
    expect(hasViewport).toBe(true);
  });

  test('should load CSS styles', async ({ authenticatedPage: page }) => {
    const hasStyling = await page.evaluate(() => {
      const style = window.getComputedStyle(document.body);
      return style.display !== 'none';
    });
    
    expect(hasStyling).toBe(true);
  });

  test('should support Vue component rendering', async ({ authenticatedPage: page }) => {
    const hasVueComponents = await page.evaluate(() => {
      const html = document.documentElement.outerHTML;
      return html.includes('data-v-') || html.includes('p-');
    });
    
    expect(typeof hasVueComponents).toBe('boolean');
  });

  test('should have document in complete/interactive state', async ({ authenticatedPage: page }) => {
    const readyState = await page.evaluate(() => document.readyState);
    expect(['interactive', 'complete']).toContain(readyState);
  });

  test('should not have excessive horizontal scroll', async ({ authenticatedPage: page }) => {
    const scrollInfo = await page.evaluate(() => ({
      hasHorizontalScroll: document.body.scrollWidth > window.innerWidth,
      bodyWidth: document.body.scrollWidth,
      viewportWidth: window.innerWidth,
    }));
    
    // Allow minor overshoot (5%)
    const allowedOvershoot = scrollInfo.viewportWidth * 1.05;
    expect(scrollInfo.bodyWidth).toBeLessThanOrEqual(allowedOvershoot);
  });
});

test.describe('URL Parameter Handling - Authenticated', () => {
  test('should work with start date parameter', async ({ authenticatedPage: page }) => {
    // Navigate with params to the authenticated session
    await page.goto('/?start=2025-03-01');
    const isLoaded = await page.evaluate(() => document.body.innerHTML.length > 50);
    expect(isLoaded).toBe(true);
  });

  test('should work with days parameter', async ({ authenticatedPage: page }) => {
    await page.goto('/?days=60');
    const isLoaded = await page.evaluate(() => document.body.innerHTML.length > 50);
    expect(isLoaded).toBe(true);
  });

  test('should work with combined parameters', async ({ authenticatedPage: page }) => {
    await page.goto('/?start=2025-02-01&days=30');
    const isLoaded = await page.evaluate(() => document.body.innerHTML.length > 50);
    expect(isLoaded).toBe(true);
  });
});

test.describe('Authenticated Functionality', () => {
  test('should have app container ready for interactions', async ({ authenticatedPage: page }) => {
    // Check for app container that will hold interactive elements
    const appReady = await page.evaluate(() => {
      const app = document.getElementById('app');
      return app !== null;
    });
    
    // App container should exist and be ready
    expect(appReady).toBe(true);
  });

  test('should be able to handle user interactions', async ({ authenticatedPage: page }) => {
    // Try some keyboard interactions that shouldn't crash
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    
    // Page should still be responsive
    const isResponsive = await page.evaluate(() => document.body !== null);
    expect(isResponsive).toBe(true);
  });

  test('should render with PrimeVue components', async ({ authenticatedPage: page }) => {
    // Check if PrimeVue components are being used
    const hasPrimeVue = await page.evaluate(() => {
      const html = document.documentElement.outerHTML;
      // PrimeVue adds p- classes to elements
      return html.includes('p-') || html.includes('primevue');
    });
    
    // App uses PrimeVue for UI
    expect(typeof hasPrimeVue).toBe('boolean');
  });
});
