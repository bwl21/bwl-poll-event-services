# Test Suite Roadmap

## Current Status ✅
- **468 tests passing** across 6 test suites
- All browsers and device types covered
- Basic structure, functionality, and accessibility validated

## Next Steps for Enhanced Testing

### Phase 1: User Interaction Tests (High Priority)

Tests for core polling functionality:

```typescript
// tests/polling-flow.spec.ts
describe('Polling Interaction Flow', () => {
  // Select a service
  test('should select a service from list');
  
  // Respond to polling question
  test('should register Yes response');
  test('should register Maybe response');
  test('should register No response');
  
  // Add comments
  test('should add comment to service');
  test('should update comment');
  test('should clear comment');
  
  // Verify data persistence
  test('should persist responses in KV-Store');
  test('should show my previous responses');
  test('should show other users responses');
});
```

### Phase 2: Admin Panel Tests (High Priority)

Tests for admin configuration:

```typescript
// tests/admin-panel.spec.ts
describe('Admin Service Configuration', () => {
  // Service management
  test('should navigate to admin tab');
  test('should add new service');
  test('should edit service');
  test('should delete service');
  test('should reorder services');
  
  // Date range configuration
  test('should set event date');
  test('should set polling duration');
  test('should update polling parameters');
});
```

### Phase 3: Data Export Tests

Tests for Excel export functionality:

```typescript
// tests/export-functionality.spec.ts
describe('Excel Export', () => {
  test('should find export button');
  test('should trigger export');
  test('should download Excel file');
  test('should validate Excel structure');
  test('should include all responses');
  test('should format data correctly');
});
```

### Phase 4: API Integration Tests

Tests for ChurchTools API interactions:

```typescript
// tests/api-integration.spec.ts
describe('ChurchTools API Integration', () => {
  test('should authenticate via ChurchTools');
  test('should fetch user information');
  test('should load services from API');
  test('should load events from API');
  test('should save responses to KV-Store');
  test('should handle API errors gracefully');
});
```

### Phase 5: Data Validation Tests

Tests for data integrity:

```typescript
// tests/data-validation.spec.ts
describe('Data Validation', () => {
  test('should validate response format');
  test('should handle concurrent responses');
  test('should merge conflicting updates');
  test('should maintain response history');
});
```

## Testing Best Practices

### 1. **Use the auth fixture consistently**
```typescript
import { test, expect } from './fixtures/auth';

test('my test', async ({ authenticatedPage: page }) => {
  // page is pre-loaded and ready
});
```

### 2. **Handle missing UI gracefully**
```typescript
// Good - works even if element doesn't exist
const buttons = await page.locator('button').count().catch(() => 0);

// Bad - will fail if element not found
await page.click('button'); // ❌
```

### 3. **Add meaningful assertions**
```typescript
// Good - clear what we're testing
expect(responseButtons).toContainEqual('Yes');
expect(responseButtons).toContainEqual('Maybe');
expect(responseButtons).toContainEqual('No');

// Bad - vague check
expect(buttons.length).toBeGreaterThan(0); // ❌
```

### 4. **Test user workflows end-to-end**
```typescript
// Good - tests complete user flow
1. Navigate to poll
2. Select service
3. Choose response
4. Add comment
5. Verify saved

// Bad - isolated unit-like checks
Just check if button exists
```

### 5. **Use descriptive test names**
```typescript
// Good
test('should save user response and display in other users view');

// Bad
test('response test'); // ❌
```

## Performance Testing

Consider adding performance benchmarks:

```typescript
// tests/performance.spec.ts
test('should load app within 3 seconds');
test('should render poll within 1 second');
test('should export data within 5 seconds');
```

## Visual Regression Testing

Consider adding visual regression tests:

```typescript
// tests/visual.spec.ts
test('should match snapshot for poll interface');
test('should match snapshot for admin panel');
test('should match snapshot for exported Excel file');
```

## CI/CD Integration

Current setup supports CI/CD:

```yaml
# .github/workflows/test.yml (example)
- run: npm run test:e2e
  env:
    VITE_USERNAME: ${{ secrets.CT_USERNAME }}
    VITE_PASSWORD: ${{ secrets.CT_PASSWORD }}
```

## Test Report Generation

Generate reports after test runs:

```bash
# Generate HTML report
npm run test:e2e

# View report
npx playwright show-report
```

## Coverage Tracking

Consider adding code coverage:

```bash
npx playwright test --reporter=coverage
```

## Debugging Failed Tests

### Local debugging:
```bash
npm run test:e2e:debug
npm run test:e2e:ui
npm run test:e2e:headed
```

### View test artifacts:
```bash
# Video recordings of failures
ls test-results/

# Traces for detailed debugging
npx playwright show-trace test-results/trace.zip
```

## Recommended Order of Implementation

1. **Polling Flow Tests** (enables core feature validation)
2. **Admin Panel Tests** (validates configuration)
3. **Export Tests** (validates output)
4. **API Tests** (validates integration)
5. **Visual Regression** (prevents UI regressions)
6. **Performance Tests** (monitors speed)

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Debugging Guide](https://playwright.dev/docs/debug)
- [Test Examples](https://github.com/microsoft/playwright/tree/main/tests)

## Questions to Consider

1. What are critical user workflows that must always work?
2. What data integrity issues could break the app?
3. What API failures should be handled gracefully?
4. What performance targets are important?
5. What visual elements must remain consistent?
