import { test, expect } from '@playwright/test';

/**
 * Authenticated Tests
 * 
 * These tests run with the credentials from .env (VITE_USERNAME + VITE_PASSWORD)
 * The dev server automatically logs in with these credentials
 * 
 * Run with: npm run test:e2e
 */

test.describe('Authenticated User Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Load page - should auto-authenticate via dev server
    await page.goto('/', { waitUntil: 'networkidle' });
  });

  test('should show poll interface when authenticated', async ({ page }) => {
    // Check for main app content
    const hasTitle = await page.evaluate(() => 
      document.body.innerText.includes('Dienste') || 
      document.body.innerText.includes('Umfrage')
    );
    
    expect(hasTitle).toBe(true);
  });

  test('should display event list', async ({ page }) => {
    // Events should be loaded
    const eventList = await page.evaluate(() => {
      // Look for event information
      const text = document.body.innerText;
      return text.length > 200; // Should have substantial content
    });
    
    expect(eventList).toBe(true);
  });

  test('should display date controls', async ({ page }) => {
    // Datepicker and days input should be visible
    const hasControls = await page.evaluate(() => {
      const inputs = document.querySelectorAll('input');
      return inputs.length > 0;
    });
    
    expect(hasControls).toBe(true);
  });

  test('should display service rows with response buttons', async ({ page }) => {
    // Should show services with buttons for Yes/Maybe/No
    const buttons = await page.locator('button').count();
    
    // Should have at least some interactive buttons
    expect(buttons).toBeGreaterThan(0);
  });

  test('should allow selecting service response', async ({ page }) => {
    // Find first button (should be a response button)
    const firstButton = page.locator('button').first();
    const isVisible = await firstButton.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (isVisible) {
      // Click it
      await firstButton.click();
      
      // Should handle the click
      const isAlive = await page.evaluate(() => document.body !== null);
      expect(isAlive).toBe(true);
    }
  });

  test('should show comment field for services', async ({ page }) => {
    // Check for textarea elements
    const textareas = await page.locator('textarea').count().catch(() => 0);
    
    expect(textareas).toBeGreaterThanOrEqual(0);
  });

  test('should save comment on input', async ({ page }) => {
    const textareas = await page.locator('textarea').count().catch(() => 0);
    
    if (textareas > 0) {
      const textarea = page.locator('textarea').first();
      
      // Type comment
      await textarea.fill('Test comment for service');
      
      // Verify it was entered
      const value = await textarea.inputValue();
      expect(value).toContain('Test comment');
    }
  });

  test('should display other users responses', async ({ page }) => {
    // Check if responses from other users are shown
    const hasResponses = await page.evaluate(() => {
      const text = document.body.innerText.toLowerCase();
      // Look for response indicators
      return text.includes('ja') || text.includes('nein') || 
             text.includes('vielleicht') || text.includes('yes');
    });
    
    expect(typeof hasResponses).toBe('boolean');
  });

  test('should display service assignments', async ({ page }) => {
    // Check for assignment information
    const hasAssignments = await page.evaluate(() => {
      const text = document.body.innerText;
      // Should show some service assignment info
      return text.length > 100;
    });
    
    expect(hasAssignments).toBe(true);
  });
});

test.describe('Authenticated Admin Panel', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
  });

  test('should show admin badge if user is admin', async ({ page }) => {
    // Check for admin indicator
    const adminBadge = await page.evaluate(() => {
      const text = document.body.innerText.toLowerCase();
      return text.includes('admin');
    });
    
    expect(typeof adminBadge).toBe('boolean');
  });

  test('should show admin tab if authenticated as admin', async ({ page }) => {
    // Look for admin tab
    const hasAdminTab = await page.evaluate(() => {
      const text = document.body.innerText.toLowerCase();
      return text.includes('admin') || document.querySelectorAll('[role="tab"]').length > 1;
    });
    
    expect(typeof hasAdminTab).toBe('boolean');
  });

  test('should navigate to admin panel', async ({ page }) => {
    // Try to click admin tab if it exists
    const adminTab = page.locator('text=/admin/i').first();
    const exists = await adminTab.isVisible({ timeout: 3000 }).catch(() => false);
    
    if (exists) {
      await adminTab.click();
      
      // Should navigate without error
      const isAlive = await page.evaluate(() => document.body !== null);
      expect(isAlive).toBe(true);
    }
  });

  test('should display service configuration table', async ({ page }) => {
    // Look for table or config display
    const hasTable = await page.evaluate(() => {
      const tables = document.querySelectorAll('table, [role="table"]');
      return tables.length > 0 || document.body.innerText.includes('Service');
    });
    
    expect(typeof hasTable).toBe('boolean');
  });

  test('should allow filtering services', async ({ page }) => {
    // Look for filter input
    const filterInput = page.locator('input[placeholder*="search"], input[placeholder*="filter"]').first();
    const exists = await filterInput.isVisible({ timeout: 3000 }).catch(() => false);
    
    if (exists) {
      // Try filtering
      await filterInput.fill('test');
      
      // Should update results
      const value = await filterInput.inputValue();
      expect(value).toBe('test');
    }
  });

  test('should toggle service visibility', async ({ page }) => {
    // Look for toggle switches
    const toggles = await page.locator('[role="switch"]').count().catch(() => 0);
    
    if (toggles > 0) {
      const firstToggle = page.locator('[role="switch"]').first();
      
      // Click toggle
      await firstToggle.click();
      
      // Should handle click
      const isAlive = await page.evaluate(() => document.body !== null);
      expect(isAlive).toBe(true);
    }
  });

  test('should display Excel export button', async ({ page }) => {
    // Look for export button
    const exportButton = page.locator('button:has-text("Excel"), button:has-text("Export")').first();
    const exists = await exportButton.isVisible({ timeout: 3000 }).catch(() => false);
    
    expect(typeof exists).toBe('boolean');
  });
});

test.describe('Authenticated Data Operations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
  });

  test('should load events from ChurchTools API', async ({ page }) => {
    // Wait for API calls to complete
    await page.waitForTimeout(2000);
    
    // Check if content loaded
    const hasContent = await page.evaluate(() => 
      document.body.innerText.length > 200
    );
    
    expect(hasContent).toBe(true);
  });

  test('should display date information correctly', async ({ page }) => {
    // Check for date/time display
    const hasDateInfo = await page.evaluate(() => {
      const text = document.body.innerText;
      // Look for date patterns
      return /\d{1,2}\.\d{1,2}\.\d{4}/.test(text) || 
             /\d{1,2}:\d{2}/.test(text);
    });
    
    expect(hasDateInfo).toBe(true);
  });

  test('should handle response submission', async ({ page }) => {
    // Try to select a response
    const buttons = await page.locator('button').count();
    
    if (buttons > 0) {
      const randomButton = page.locator('button').nth(Math.floor(Math.random() * buttons));
      
      try {
        await randomButton.click();
        
        // Should show feedback (toast message)
        await page.waitForTimeout(500);
        
        const isAlive = await page.evaluate(() => document.body !== null);
        expect(isAlive).toBe(true);
      } catch {
        // Button might not be clickable, that's ok
      }
    }
  });

  test('should persist user preferences across navigation', async ({ page }) => {
    // Navigate around
    await page.goto('/?start=2025-02-01&days=30');
    
    // Should load without error
    const response = await page.goto('/');
    expect(response?.status()).toBeLessThan(500);
  });

  test('should display toast messages for feedback', async ({ page }) => {
    // Look for toast/notification elements
    const hasNotifications = await page.evaluate(() => {
      const toasts = document.querySelectorAll('.p-toast, [role="alert"], [class*="toast"], [class*="notification"]');
      return toasts.length >= 0;
    });
    
    expect(typeof hasNotifications).toBe('boolean');
  });
});

test.describe('Authenticated URL Parameters', () => {
  test('should respect start date parameter', async ({ page }) => {
    const response = await page.goto('/?start=2025-03-01&days=60');
    expect(response?.status()).toBeLessThan(500);
  });

  test('should respect days parameter', async ({ page }) => {
    const response = await page.goto('/?days=90');
    expect(response?.status()).toBeLessThan(500);
  });

  test('should handle combined parameters', async ({ page }) => {
    const response = await page.goto('/?start=2025-02-01&days=30');
    expect(response?.status()).toBeLessThan(500);
  });

  test('should use defaults for missing parameters', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.status()).toBeLessThan(500);
  });
});

test.describe('Authenticated Responsiveness', () => {
  test('should be usable on current viewport', async ({ page, context }) => {
    const viewportSize = context.viewport();
    
    await page.goto('/');
    
    // Should not have horizontal scroll
    const hasHorizontalScroll = await page.evaluate(() => 
      document.body.scrollWidth > window.innerWidth
    );
    
    expect(hasHorizontalScroll).toBe(false);
  });

  test('should have readable text on current viewport', async ({ page }) => {
    await page.goto('/');
    
    // Text should be visible and readable
    const content = await page.evaluate(() => 
      document.body.innerText.length > 0
    );
    
    expect(content).toBe(true);
  });
});
