# Playwright E2E Test Guide

## Setup

Playwright is already installed. Tests are in the `tests/` directory.

## Running Tests

### Run all tests
```bash
npm run test:e2e
```

### Run tests with UI (interactive mode)
```bash
npm run test:e2e:ui
```

### Run tests in headed mode (see browser)
```bash
npm run test:e2e:headed
```

### Debug mode (step through tests)
```bash
npm run test:e2e:debug
```

### Run specific test file
```bash
npx playwright test tests/smoke.spec.ts
```

### Run tests matching a pattern
```bash
npx playwright test -g "should load"
```

## Test Structure

### 1. Smoke Tests (`tests/smoke.spec.ts`)
- Application loads
- Key UI elements visible
- Basic functionality present
- Version display works

**Run:** `npx playwright test smoke`

### 2. Admin Service Config Tests (`tests/admin-service-config.spec.ts`)
- Service config tab visible
- Filtering works
- Sorting hints displayed
- Error states handled

**Run:** `npx playwright test admin-service-config`

### 3. Accessibility Tests (`tests/accessibility.spec.ts`)
- Heading hierarchy correct
- Keyboard navigation works
- Labels present on inputs
- Tab navigation functional
- Color contrast adequate

**Run:** `npx playwright test accessibility`

### 4. Responsive Design Tests (`tests/responsive.spec.ts`)
- Works on mobile (Pixel 5)
- Works on tablet (iPad Pro)
- Works on desktop (Chrome)
- No horizontal scrolling
- Text is readable on all sizes

**Run:** `npx playwright test responsive`

## Test Reports

After running tests, view the HTML report:

```bash
npx playwright show-report
```

This opens an interactive dashboard showing:
- Test results
- Screenshots
- Video recordings
- Trace files (for debugging)

## Writing New Tests

### Basic Structure
```typescript
import { test, expect } from '@playwright/test';

test('should do something', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  
  const element = page.locator('.my-class');
  await expect(element).toBeVisible();
});
```

### Common Assertions
```typescript
// Visibility
await expect(element).toBeVisible();
await expect(element).toBeHidden();

// Text
await expect(element).toContainText('Hello');
await expect(element).toHaveValue('input value');

// Count
expect(await elements.count()).toBe(5);

// Properties
await expect(element).toHaveAttribute('href', '/path');
await expect(element).toHaveClass('active');
```

### Interactions
```typescript
// Click
await element.click();

// Type
await input.fill('text');

// Select
await select.selectOption('value');

// Hover
await element.hover();

// Press keys
await page.keyboard.press('Enter');
```

## CI/CD Integration

### GitHub Actions Example
```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

## Debugging Tests

### 1. Run in debug mode
```bash
npm run test:e2e:debug
```

### 2. Use step-by-step execution
```typescript
test('debug test', async ({ page }) => {
  await page.pause(); // Pauses execution here
  // Continue execution
});
```

### 3. Take screenshots
```typescript
await page.screenshot({ path: 'screenshot.png' });
```

### 4. Inspect DOM
```typescript
const html = await page.content();
console.log(html);
```

### 5. View network requests
```typescript
page.on('response', response => {
  console.log(response.url(), response.status());
});
```

## Best Practices

1. **Wait for network** - Always use `waitForLoadState('networkidle')`
2. **Specific selectors** - Use `data-testid` attributes instead of brittle selectors
3. **No hardcoded waits** - Use proper waiting mechanisms
4. **Isolate tests** - Each test should be independent
5. **Use fixtures** - Share setup code with `test.beforeEach()`
6. **Test user behavior** - Click, type, navigate like a real user

## Example: Adding Tests to Service Config

```typescript
test('should toggle service enabled', async ({ page }) => {
  // Navigate to app
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  
  // Find first toggle switch
  const toggle = page.locator('[role="switch"]').first();
  
  // Click toggle
  await toggle.click();
  
  // Wait for save
  await page.waitForTimeout(500);
  
  // Verify toast message
  await expect(page.locator('.p-toast-detail')).toBeVisible();
});
```

## Troubleshooting

### Tests timeout
- Increase timeout: `test.setTimeout(60000)`
- Check if element selector is correct
- Verify app is running on port 5173

### Element not found
- Check selector with: `await page.locator('.selector').count()`
- Use `--headed` mode to see browser

### Tests fail in CI but pass locally
- Use `npm run test:e2e:headed` to debug
- Check environment differences
- Look at screenshots in report

## Resources

- [Playwright Docs](https://playwright.dev)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Debugging Guide](https://playwright.dev/docs/debug)
- [API Reference](https://playwright.dev/docs/api/class-playwright)
