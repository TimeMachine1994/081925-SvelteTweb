# Tributestream Testing Strategy

## Overview

This document outlines the comprehensive testing strategy for the Tributestream application. Our testing approach follows the testing pyramid methodology with unit tests at the base, integration tests in the middle, and end-to-end tests at the top.

## Testing Stack

- **Unit & Integration Tests**: Vitest with JSDOM
- **Component Tests**: Svelte Testing Library
- **End-to-End Tests**: Playwright
- **Mocking**: Vitest mocks for Firebase, external APIs
- **Coverage**: Built-in Vitest coverage reporting
- **CI/CD**: GitHub Actions integration

## Test Structure

```
frontend/
├── src/
│   ├── lib/
│   │   └── components/
│   │       └── __tests__/          # Component tests
│   ├── routes/
│   │   └── api/
│   │       └── **/*.test.ts        # API route tests
│   └── test-setup.ts               # Global test setup
├── tests/
│   ├── integration/                # Integration tests
│   └── fixtures/                   # Test data fixtures
├── test-utils/                     # Shared test utilities
│   ├── factories.ts                # Test data factories
│   ├── test-helpers.ts             # Helper functions
│   └── mocks/                      # Mock implementations
├── e2e/                           # End-to-end tests
│   ├── auth.spec.ts
│   ├── memorial-creation.spec.ts
│   ├── streaming.spec.ts
│   └── fixtures/                   # E2E test fixtures
└── scripts/                       # Test data management
    ├── setup-test-data.js
    ├── clean-test-data.js
    └── create-admin.js
```

## Test Types

### 1. Unit Tests

**Location**: `src/lib/components/__tests__/`

**Purpose**: Test individual components and functions in isolation

**Examples**:
- Component rendering and props
- User interactions (clicks, form submissions)
- State management
- Utility functions

**Running**:
```bash
npm run test:unit
npm run test:unit:watch  # Watch mode
```

### 2. Integration Tests

**Location**: `tests/integration/`

**Purpose**: Test business logic and data flow between components

**Examples**:
- Authentication logic
- Memorial CRUD operations
- Payment processing
- Email notifications

**Running**:
```bash
npm run test:integration
npm run test:integration:watch  # Watch mode
```

### 3. End-to-End Tests

**Location**: `e2e/`

**Purpose**: Test complete user journeys across the entire application

**Examples**:
- User registration and login
- Creating and managing memorials
- Live streaming functionality
- Payment workflows

**Running**:
```bash
npm run test:e2e
npm run test:e2e:ui      # Interactive UI mode
npm run test:e2e:headed  # Run with browser UI
```

### 4. API Tests

**Location**: `src/routes/api/**/*.test.ts`

**Purpose**: Test API endpoints and server-side logic

**Examples**:
- Request/response validation
- Authentication middleware
- Database operations
- Error handling

**Running**:
```bash
npm run test:api
```

## Test Configuration

### Vitest Configuration (`vitest.config.ts`)

- **Environment**: JSDOM for DOM testing
- **Setup Files**: Global mocks and test utilities
- **Coverage**: 70% threshold for branches, functions, lines, statements
- **Aliases**: Path mapping for imports

### Playwright Configuration (`playwright.config.ts`)

- **Browsers**: Chrome, Firefox, Safari, Mobile Chrome
- **Parallel Execution**: Optimized for CI/CD
- **Screenshots**: On failure only
- **Video**: Retained on failure
- **Traces**: On first retry

## Test Data Management

### Factories (`test-utils/factories.ts`)

Provides consistent test data creation:

```typescript
// Create test user
const user = createTestUser({ role: 'owner' });

// Create test memorial
const memorial = createTestMemorial({ ownerUid: user.uid });

// Create test stream
const stream = createTestStream({ memorialId: memorial.id });
```

### Fixtures (`tests/fixtures/`)

Static test data for consistent testing:
- User profiles
- Memorial templates
- Stream configurations
- Payment data

### Test Environment Setup

**Firebase Emulators**:
```bash
npm run test:emulator  # Start Firebase emulators
```

**Test Data Management**:
```bash
npm run test:setup     # Setup test data
npm run test:clean     # Clean test data
```

## Mocking Strategy

### Firebase Services
- Authentication (sign in, sign up, token verification)
- Firestore (CRUD operations, queries)
- Admin SDK (user management, custom claims)

### External APIs
- Stripe (payment processing)
- SendGrid (email notifications)
- WebRTC (streaming services)

### SvelteKit Modules
- Navigation (`$app/navigation`)
- Stores (`$app/stores`)
- Environment (`$app/environment`)

## Coverage Requirements

- **Minimum Coverage**: 70% for all metrics
- **Components**: 80% line coverage target
- **API Routes**: 90% line coverage target
- **Critical Paths**: 95% coverage (auth, payments)

**Generate Coverage Report**:
```bash
npm run test:coverage
```

## CI/CD Integration

### GitHub Actions Workflow

```yaml
name: Test Suite
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:unit
      - run: npm run test:integration
      - run: npm run test:e2e
```

### Test Environment Variables

```bash
# Required for testing
NODE_ENV=test
FIREBASE_PROJECT_ID=test-project
PLAYWRIGHT_BASE_URL=http://localhost:5173
```

## Best Practices

### Writing Tests

1. **Arrange, Act, Assert**: Structure tests clearly
2. **Descriptive Names**: Use clear, descriptive test names
3. **Single Responsibility**: One assertion per test when possible
4. **Independent Tests**: Tests should not depend on each other
5. **Mock External Dependencies**: Keep tests fast and reliable

### Component Testing

```typescript
import { render, screen, fireEvent } from '@testing-library/svelte';
import MyComponent from './MyComponent.svelte';

test('renders with correct props', () => {
  render(MyComponent, { props: { title: 'Test Title' } });
  expect(screen.getByText('Test Title')).toBeInTheDocument();
});
```

### API Testing

```typescript
import { GET } from './+server.ts';
import { createMockEvent } from '$test-utils/test-helpers';

test('returns user data for authenticated request', async () => {
  const event = createMockEvent({ authenticated: true });
  const response = await GET(event);
  expect(response.status).toBe(200);
});
```

### E2E Testing

```typescript
import { test, expect } from '@playwright/test';

test('user can create memorial', async ({ page }) => {
  await page.goto('/dashboard');
  await page.click('[data-testid="create-memorial"]');
  await page.fill('[name="lovedOneName"]', 'John Doe');
  await page.click('[type="submit"]');
  await expect(page.locator('.memorial-card')).toBeVisible();
});
```

## Debugging Tests

### Failed Tests
1. Check test output and error messages
2. Use `test.only()` to isolate failing tests
3. Add `console.log()` statements for debugging
4. Use browser dev tools in headed mode for E2E tests

### Common Issues
- **Mock not working**: Check mock setup in `test-setup.ts`
- **Component not rendering**: Verify props and imports
- **E2E test flaky**: Add proper waits and assertions
- **Coverage too low**: Add tests for uncovered branches

## Performance Testing

### Load Testing
- Use Playwright for basic load testing
- Monitor response times and error rates
- Test streaming performance under load

### Memory Testing
- Monitor memory usage during long-running tests
- Check for memory leaks in components
- Validate cleanup in lifecycle hooks

## Security Testing

### Authentication Tests
- Test token validation
- Verify role-based access control
- Test session management

### Input Validation
- Test XSS prevention
- Validate CSRF protection
- Test SQL injection prevention

## Maintenance

### Regular Tasks
1. **Update Dependencies**: Keep testing libraries current
2. **Review Coverage**: Monitor and improve coverage metrics
3. **Refactor Tests**: Keep tests maintainable and fast
4. **Update Fixtures**: Keep test data relevant and current

### Test Health Metrics
- **Execution Time**: Keep test suite under 5 minutes
- **Flakiness**: Maintain <1% flaky test rate
- **Coverage Trends**: Monitor coverage over time
- **Failure Analysis**: Track and address common failures

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Svelte Testing Library](https://testing-library.com/docs/svelte-testing-library/intro/)
- [Firebase Testing](https://firebase.google.com/docs/emulator-suite)

## Getting Help

For testing questions or issues:
1. Check this documentation first
2. Review existing test examples
3. Consult team testing guidelines
4. Ask in the development channel

---

*Last updated: January 2025*
