# TributeStream Testing Guide

This document provides comprehensive information about the testing strategy and implementation for TributeStream.

## Testing Strategy Overview

TributeStream follows a comprehensive testing pyramid approach:

- **Unit Tests (70%)**: Components, utilities, server functions, business logic
- **Integration Tests (20%)**: API endpoints, database operations, auth flows  
- **E2E Tests (10%)**: Critical user journeys, multi-role workflows

## Directory Structure

```
frontend/
├── src/lib/__tests__/          # Unit tests for utilities
├── src/routes/__tests__/       # Route-specific tests
├── tests/
│   ├── unit/                   # Isolated unit tests
│   ├── integration/            # API & database tests
│   └── fixtures/               # Test data & mocks
├── e2e/                        # End-to-end tests
│   ├── auth/                   # Authentication flows
│   ├── memorial/               # Memorial management
│   ├── streaming/              # Stream management
│   └── admin/                  # Admin portal
└── test-utils/                 # Shared testing utilities
```

## Test Commands

### Running Tests

```bash
# Run all tests
npm test

# Run specific test types
npm run test:unit           # Unit tests only
npm run test:integration    # Integration tests only
npm run test:e2e           # End-to-end tests only
npm run test:components    # Component tests only

# Watch mode for development
npm run test:unit:watch
npm run test:integration:watch

# Coverage reports
npm run test:coverage

# E2E with UI
npm run test:e2e:ui
npm run test:e2e:headed
```

### Test Environment Setup

```bash
# Start Firebase emulators
npm run test:emulator

# Setup test data
npm run test:setup

# Clean test data
npm run test:clean
```

## Testing Tools

### Core Testing Stack
- **Vitest**: Unit and integration testing framework
- **Playwright**: End-to-end testing
- **Testing Library**: Component testing utilities
- **JSDOM**: Browser environment simulation

### Additional Tools
- **Firebase Emulator Suite**: Local Firebase testing
- **MSW**: API mocking (if needed)
- **Faker.js**: Test data generation (if needed)

## Test Data Management

### Test Accounts
The following test accounts are available:

- `owner@test.com` (password: test123) - Memorial owner
- `director@test.com` (password: test123) - Funeral director
- `admin@test.com` (password: test123) - Admin user
- `viewer@test.com` (password: test123) - Viewer role

### Test Factories
Use the test factories in `test-utils/factories.ts` for consistent test data:

```typescript
import { createTestUser, createTestMemorial } from '$test-utils/factories';

const user = createTestUser({ role: 'owner' });
const memorial = createTestMemorial({ ownerUid: user.uid });
```

### Test Fixtures
Pre-defined test data is available in `tests/fixtures/test-data.ts`:

```typescript
import { testMemorials, testUsers } from '../fixtures/test-data';
```

## Component Testing

### Basic Component Test

```typescript
import { render, screen, fireEvent } from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';
import MyComponent from '../MyComponent.svelte';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(MyComponent, { props: { title: 'Test' } });
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('handles user interactions', async () => {
    render(MyComponent);
    await fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText('Clicked')).toBeInTheDocument();
  });
});
```

### Testing with User Context

```typescript
import { mockUserContext } from '$test-utils/test-helpers';

describe('AuthenticatedComponent', () => {
  it('shows content for logged in user', () => {
    const user = createTestUser({ role: 'owner' });
    mockUserContext(user);
    
    render(AuthenticatedComponent);
    expect(screen.getByText('Welcome, owner')).toBeInTheDocument();
  });
});
```

## Integration Testing

### API Endpoint Testing

```typescript
import { describe, it, expect, vi } from 'vitest';
import { setupTestEnvironment } from '$test-utils/test-helpers';

describe('Memorial API', () => {
  beforeEach(() => {
    setupTestEnvironment();
  });

  it('creates memorial successfully', async () => {
    const response = await fetch('/api/memorials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lovedOneName: 'John Doe' })
    });

    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.success).toBe(true);
  });
});
```

### Database Integration

```typescript
import { mockFirebase } from '$test-utils/test-helpers';

describe('Database Operations', () => {
  beforeEach(() => {
    const { mockDb } = mockFirebase();
    // Setup mock responses
  });
});
```

## E2E Testing

### Basic E2E Test

```typescript
import { test, expect } from '@playwright/test';

test('user can login and create memorial', async ({ page }) => {
  await page.goto('/login');
  
  await page.getByLabel(/email/i).fill('owner@test.com');
  await page.getByLabel(/password/i).fill('test123');
  await page.getByRole('button', { name: /sign in/i }).click();
  
  await expect(page).toHaveURL(/\/profile/);
  
  await page.getByRole('button', { name: /create memorial/i }).click();
  // ... rest of test
});
```

### Using Authentication Setup

```typescript
import { test } from '@playwright/test';

test.use({ storageState: 'playwright/.auth/user.json' });

test('authenticated user flow', async ({ page }) => {
  // User is already logged in
  await page.goto('/profile');
  // ... test authenticated features
});
```

## Testing Best Practices

### Unit Tests
- Test one thing at a time
- Use descriptive test names
- Mock external dependencies
- Test edge cases and error conditions
- Aim for high code coverage (70%+ target)

### Integration Tests
- Test API endpoints thoroughly
- Verify database operations
- Test authentication flows
- Mock external services (Stripe, SendGrid)
- Test error handling

### E2E Tests
- Focus on critical user journeys
- Test multi-role workflows
- Verify complete feature flows
- Test responsive design
- Keep tests stable and reliable

### General Guidelines
- Write tests before or alongside code
- Keep tests simple and readable
- Use meaningful assertions
- Clean up test data
- Run tests frequently during development

## Continuous Integration

Tests run automatically on:
- Push to main/develop branches
- Pull requests
- Manual workflow dispatch

### CI Pipeline
1. **Unit Tests**: Fast feedback on code changes
2. **Integration Tests**: API and database validation
3. **Component Tests**: UI component verification
4. **E2E Tests**: Full user journey validation

### Coverage Requirements
- Unit tests: 70% minimum coverage
- Integration tests: All API endpoints covered
- E2E tests: All critical user journeys covered

## Debugging Tests

### Failed Unit Tests
```bash
# Run specific test file
npm run test:unit -- Button.test.ts

# Run with verbose output
npm run test:unit -- --reporter=verbose

# Debug mode
npm run test:unit -- --inspect-brk
```

### Failed E2E Tests
```bash
# Run with UI for debugging
npm run test:e2e:ui

# Run headed (visible browser)
npm run test:e2e:headed

# Debug specific test
npx playwright test auth/login.spec.ts --debug
```

### Common Issues
- **Mock conflicts**: Clear mocks between tests
- **Async timing**: Use proper await/waitFor
- **DOM cleanup**: Ensure components unmount properly
- **Firebase emulator**: Verify emulator is running
- **Test data**: Check test data setup/cleanup

## Performance Testing

While not implemented yet, consider adding:
- Load testing for API endpoints
- Performance testing for large data sets
- Memory leak detection
- Bundle size monitoring

## Accessibility Testing

Consider adding:
- Automated a11y testing with axe-core
- Keyboard navigation testing
- Screen reader compatibility
- Color contrast validation

## Contributing

When adding new features:
1. Write tests first (TDD approach)
2. Ensure all test types are covered
3. Update test documentation
4. Verify CI pipeline passes
5. Maintain coverage thresholds

For questions or issues with testing, refer to the team's testing guidelines or create an issue in the repository.
