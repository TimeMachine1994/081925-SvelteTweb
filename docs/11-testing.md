# Testing Strategy & Implementation

## Overview

TributeStream employs a comprehensive testing strategy covering unit tests, integration tests, and end-to-end tests to ensure reliability and maintainability of the memorial service platform.

## Testing Architecture

### Testing Pyramid

```
    /\     E2E Tests (Playwright)
   /  \    - User workflows
  /____\   - Cross-browser testing
 /      \  
/________\  Integration Tests (Vitest)
           - API endpoints
           - Component integration
           - Service interactions

___________  Unit Tests (Vitest)
           - Individual functions
           - Component logic
           - Utility functions
```

### Test Categories

1. **Unit Tests**: Individual components, functions, and utilities
2. **Integration Tests**: API endpoints, database interactions, service integration
3. **End-to-End Tests**: Complete user workflows and cross-browser compatibility

## Unit Testing with Vitest

### Configuration

**File:** `vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    include: [
      'src/**/*.{test,spec}.{js,ts}',
      'tests/**/*.{test,spec}.{js,ts}'
    ],
    exclude: ['src/routes/**/+*.test.ts'],
    environment: 'jsdom',
    setupFiles: ['src/test-setup.ts'],
    globals: true,
    testTimeout: 30000
  },
  resolve: {
    alias: {
      $lib: path.resolve('./src/lib'),
      '$app/environment': path.resolve('./src/mocks/app/environment.js'),
      '$app/navigation': path.resolve('./src/mocks/app/navigation.js'),
      '$app/stores': path.resolve('./src/mocks/app/stores.js')
    }
  }
});
```

### Test Setup

**File:** `src/test-setup.ts`

```typescript
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Firebase
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn()
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signOut: vi.fn()
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  getDocs: vi.fn()
}));

// Mock SvelteKit stores
vi.mock('$app/stores', () => ({
  page: {
    subscribe: vi.fn()
  }
}));
```

### Component Testing Examples

#### Testing Svelte Components

```typescript
// src/lib/components/Calculator.test.ts
import { render, screen, fireEvent } from '@testing-library/svelte';
import { describe, it, expect, vi } from 'vitest';
import Calculator from './Calculator.svelte';

describe('Calculator Component', () => {
  const mockProps = {
    memorialId: 'test-memorial-id',
    services: {
      main: {
        location: { name: 'Test Location', address: '123 Main St', isUnknown: false },
        time: { date: '2024-12-01', time: '14:00', isUnknown: false },
        hours: 2
      },
      additional: []
    }
  };

  it('renders calculator form with service data', () => {
    render(Calculator, { props: mockProps });
    
    expect(screen.getByText('Service Calculator')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Location')).toBeInTheDocument();
    expect(screen.getByDisplayValue('2024-12-01')).toBeInTheDocument();
  });

  it('triggers auto-save on form changes', async () => {
    const mockAutoSave = vi.fn();
    vi.mock('$lib/composables/useAutoSave', () => ({
      useAutoSave: () => ({
        triggerAutoSave: mockAutoSave,
        isSaving: () => false,
        hasUnsavedChanges: () => false
      })
    }));

    render(Calculator, { props: mockProps });
    
    const locationInput = screen.getByDisplayValue('Test Location');
    await fireEvent.input(locationInput, { target: { value: 'Updated Location' } });
    
    expect(mockAutoSave).toHaveBeenCalled();
  });

  it('calculates pricing correctly', () => {
    render(Calculator, { props: mockProps });
    
    // Test pricing calculations based on hours and services
    const totalElement = screen.getByTestId('total-price');
    expect(totalElement).toHaveTextContent('$200.00'); // 2 hours * $100/hour
  });
});
```

#### Testing Utility Functions

```typescript
// src/lib/utils/memorialAccess.test.ts
import { describe, it, expect, vi } from 'vitest';
import { MemorialAccessVerifier } from './memorialAccess';

describe('MemorialAccessVerifier', () => {
  const mockUser = {
    uid: 'user-123',
    email: 'test@example.com',
    role: 'owner' as const,
    isAdmin: false
  };

  const mockMemorial = {
    id: 'memorial-123',
    ownerUid: 'user-123',
    funeralDirectorUid: null,
    isPublic: false
  };

  it('grants admin access to admins', async () => {
    const adminUser = { ...mockUser, role: 'admin' as const, isAdmin: true };
    
    const result = await MemorialAccessVerifier.checkViewAccess('memorial-123', adminUser);
    
    expect(result.hasAccess).toBe(true);
    expect(result.accessLevel).toBe('admin');
    expect(result.reason).toBe('Admin privileges');
  });

  it('grants owner access to memorial owners', async () => {
    vi.mocked(getDoc).mockResolvedValue({
      exists: () => true,
      data: () => mockMemorial
    });

    const result = await MemorialAccessVerifier.checkViewAccess('memorial-123', mockUser);
    
    expect(result.hasAccess).toBe(true);
    expect(result.accessLevel).toBe('admin');
    expect(result.reason).toBe('Memorial owner');
  });

  it('denies access to unauthorized users', async () => {
    const unauthorizedUser = { ...mockUser, uid: 'different-user' };
    
    vi.mocked(getDoc).mockResolvedValue({
      exists: () => true,
      data: () => mockMemorial
    });

    const result = await MemorialAccessVerifier.checkViewAccess('memorial-123', unauthorizedUser);
    
    expect(result.hasAccess).toBe(false);
    expect(result.accessLevel).toBe('none');
  });
});
```

### Auto-Save Testing

```typescript
// src/lib/composables/useAutoSave.test.ts
import { describe, it, expect, vi } from 'vitest';
import { useAutoSave } from './useAutoSave';

describe('useAutoSave', () => {
  it('triggers auto-save after delay', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true })
    });
    global.fetch = mockFetch;

    const onSave = vi.fn();
    const autoSave = useAutoSave('memorial-123', { delay: 100, onSave });

    const testData = {
      services: { main: { location: { name: 'Test' } } },
      calculatorData: { tier: 'basic' }
    };

    autoSave.triggerAutoSave(testData);

    // Wait for debounced save
    await new Promise(resolve => setTimeout(resolve, 150));

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/memorials/memorial-123/schedule/auto-save',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          services: testData.services,
          calculatorData: testData.calculatorData,
          timestamp: expect.any(Number)
        })
      })
    );

    expect(onSave).toHaveBeenCalledWith(true);
  });
});
```

## Integration Testing

### API Endpoint Testing

```typescript
// tests/api/memorial-api.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { POST } from '../src/routes/api/memorials/+server';

describe('Memorial API', () => {
  beforeEach(() => {
    // Setup test database state
    vi.clearAllMocks();
  });

  it('creates memorial with valid data', async () => {
    const request = new Request('http://localhost/api/memorials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lovedOneName: 'John Doe',
        creatorEmail: 'family@example.com',
        services: {
          main: {
            location: { name: 'Memorial Chapel', address: '123 Main St', isUnknown: false },
            time: { date: '2024-12-01', time: '14:00', isUnknown: false },
            hours: 2
          },
          additional: []
        }
      })
    });

    const response = await POST({ request, locals: { user: mockUser } });
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.success).toBe(true);
    expect(result.memorial.lovedOneName).toBe('John Doe');
    expect(result.memorial.services.main.location.name).toBe('Memorial Chapel');
  });

  it('validates required fields', async () => {
    const request = new Request('http://localhost/api/memorials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        // Missing required fields
        creatorEmail: 'family@example.com'
      })
    });

    const response = await POST({ request, locals: { user: mockUser } });
    const result = await response.json();

    expect(response.status).toBe(400);
    expect(result.error).toContain('lovedOneName is required');
  });
});
```

### Livestream Integration Testing

```typescript
// tests/integration/livestream-integration.test.ts
import { describe, it, expect } from 'vitest';
import { convertMemorialToScheduledServices } from '$lib/server/scheduledServicesUtils';

describe('Livestream Integration', () => {
  it('converts memorial services to scheduled services format', () => {
    const memorial = {
      id: 'memorial-123',
      lovedOneName: 'John Doe',
      services: {
        main: {
          location: { name: 'Chapel', address: '123 Main St', isUnknown: false },
          time: { date: '2024-12-01', time: '14:00', isUnknown: false },
          hours: 2
        },
        additional: [
          {
            enabled: true,
            location: { name: 'Graveside', address: '456 Cemetery Rd', isUnknown: false },
            time: { date: '2024-12-01', time: '16:00', isUnknown: false },
            hours: 1
          }
        ]
      },
      customStreams: {
        main_main: {
          status: 'live',
          isVisible: true,
          cloudflareId: 'cf-123'
        }
      }
    };

    const scheduledServices = convertMemorialToScheduledServices(memorial);

    expect(scheduledServices).toHaveLength(2);
    expect(scheduledServices[0].id).toBe('main_main');
    expect(scheduledServices[0].title).toBe('John Doe Memorial Service');
    expect(scheduledServices[0].status).toBe('live');
    expect(scheduledServices[0].cloudflareId).toBe('cf-123');
    
    expect(scheduledServices[1].id).toBe('additional_0');
    expect(scheduledServices[1].title).toBe('Additional Service 1');
  });

  it('handles visibility controls correctly', () => {
    const memorial = {
      id: 'memorial-123',
      lovedOneName: 'John Doe',
      services: { main: { /* service data */ } },
      customStreams: {
        main_main: { isVisible: false },
        custom_stream: { isVisible: true, title: 'Custom Stream' }
      }
    };

    const scheduledServices = convertMemorialToScheduledServices(memorial);
    const visibleServices = scheduledServices.filter(s => s.isVisible !== false);

    expect(visibleServices).toHaveLength(1);
    expect(visibleServices[0].title).toBe('Custom Stream');
  });
});
```

## End-to-End Testing with Playwright

### Configuration

**File:** `playwright.config.ts`

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  timeout: 60 * 1000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173',
    trace: 'on-first-retry'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] }
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] }
    }
  ],
  webServer: {
    command: 'npm run dev',
    port: 5173,
    reuseExistingServer: !process.env.CI
  }
});
```

### E2E Test Examples

#### Memorial Creation Workflow

```typescript
// e2e/memorial-creation.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Memorial Creation', () => {
  test('complete family registration and memorial creation', async ({ page }) => {
    // Navigate to family registration
    await page.goto('/register/family');
    
    // Fill out registration form
    await page.fill('[data-testid="loved-one-name"]', 'John Doe');
    await page.fill('[data-testid="creator-name"]', 'Jane Doe');
    await page.fill('[data-testid="creator-email"]', 'jane@example.com');
    await page.fill('[data-testid="creator-password"]', 'password123');
    
    // Fill service details
    await page.fill('[data-testid="service-location"]', 'Memorial Chapel');
    await page.fill('[data-testid="service-date"]', '2024-12-01');
    await page.fill('[data-testid="service-time"]', '14:00');
    
    // Submit form
    await page.click('[data-testid="create-memorial"]');
    
    // Verify redirect to memorial page
    await expect(page).toHaveURL(/\/memorial\/[\w-]+$/);
    await expect(page.locator('h1')).toContainText('John Doe');
    await expect(page.locator('[data-testid="service-location"]')).toContainText('Memorial Chapel');
  });

  test('validates required fields', async ({ page }) => {
    await page.goto('/register/family');
    
    // Try to submit without required fields
    await page.click('[data-testid="create-memorial"]');
    
    // Check for validation errors
    await expect(page.locator('[data-testid="error-loved-one-name"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-creator-email"]')).toBeVisible();
  });
});
```

#### Livestream Management Workflow

```typescript
// e2e/livestream-management.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Livestream Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login as funeral director
    await page.goto('/login');
    await page.fill('[data-testid="email"]', 'director@funeral.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
  });

  test('create and start livestream', async ({ page }) => {
    // Navigate to memorial livestream control
    await page.goto('/memorial/test-memorial-id/livestream');
    
    // Create new stream
    await page.click('[data-testid="create-stream"]');
    await page.fill('[data-testid="stream-title"]', 'Memorial Service');
    await page.click('[data-testid="confirm-create"]');
    
    // Start stream
    await page.click('[data-testid="start-stream"]');
    
    // Verify stream is live
    await expect(page.locator('[data-testid="stream-status"]')).toContainText('Live');
    await expect(page.locator('[data-testid="rtmp-url"]')).toBeVisible();
    await expect(page.locator('[data-testid="stream-key"]')).toBeVisible();
  });

  test('toggle stream visibility', async ({ page }) => {
    await page.goto('/memorial/test-memorial-id/livestream');
    
    // Toggle visibility
    const visibilityToggle = page.locator('[data-testid="visibility-toggle"]');
    await visibilityToggle.click();
    
    // Verify status change
    await expect(page.locator('[data-testid="visibility-status"]')).toContainText('Hidden');
    
    // Check memorial page doesn't show hidden stream
    await page.goto('/memorial-slug');
    await expect(page.locator('[data-testid="live-streams"]')).not.toBeVisible();
  });

  test('archive management', async ({ page }) => {
    await page.goto('/memorial/test-memorial-id/livestream');
    
    // View archive section
    const archiveSection = page.locator('[data-testid="archive-section"]');
    await expect(archiveSection).toBeVisible();
    
    // Check for recordings
    await page.click('[data-testid="check-recordings"]');
    
    // Verify recording status updates
    await expect(page.locator('[data-testid="recording-status"]')).toContainText('Ready');
  });
});
```

#### Payment Integration Testing

```typescript
// e2e/payment-flow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Payment Flow', () => {
  test('complete booking and payment', async ({ page }) => {
    // Navigate to schedule page
    await page.goto('/memorial/test-memorial-id/schedule');
    
    // Configure service
    await page.fill('[data-testid="service-hours"]', '2');
    await page.selectOption('[data-testid="service-tier"]', 'premium');
    
    // Proceed to payment
    await page.click('[data-testid="book-now"]');
    
    // Verify payment page
    await expect(page).toHaveURL(/\/payment/);
    await expect(page.locator('[data-testid="payment-amount"]')).toContainText('$300.00');
    
    // Fill payment details (test mode)
    await page.fill('[data-testid="card-number"]', '4242424242424242');
    await page.fill('[data-testid="card-expiry"]', '12/25');
    await page.fill('[data-testid="card-cvc"]', '123');
    
    // Submit payment
    await page.click('[data-testid="pay-button"]');
    
    // Verify success
    await expect(page).toHaveURL(/\/payment\/success/);
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
  });
});
```

## Test Data Management

### Test Fixtures

```typescript
// tests/fixtures/memorial-data.ts
export const mockMemorialData = {
  basic: {
    lovedOneName: 'John Doe',
    creatorName: 'Jane Doe',
    creatorEmail: 'jane@example.com',
    services: {
      main: {
        location: { name: 'Memorial Chapel', address: '123 Main St', isUnknown: false },
        time: { date: '2024-12-01', time: '14:00', isUnknown: false },
        hours: 2
      },
      additional: []
    }
  },
  withAdditionalServices: {
    // Memorial with multiple services
  },
  withLivestream: {
    // Memorial with active livestream
  }
};

export const mockUserData = {
  owner: {
    uid: 'owner-123',
    email: 'owner@example.com',
    role: 'owner',
    isAdmin: false
  },
  funeralDirector: {
    uid: 'director-123',
    email: 'director@funeral.com',
    role: 'funeral_director',
    isAdmin: false
  },
  admin: {
    uid: 'admin-123',
    email: 'admin@tributestream.com',
    role: 'admin',
    isAdmin: true
  }
};
```

### Database Mocking

```typescript
// tests/mocks/firebase-mock.ts
import { vi } from 'vitest';

export const mockFirestore = {
  collection: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  getDocs: vi.fn(),
  onSnapshot: vi.fn()
};

export const setupFirebaseMocks = () => {
  vi.mock('firebase/firestore', () => mockFirestore);
  
  // Setup default mock implementations
  mockFirestore.getDoc.mockResolvedValue({
    exists: () => true,
    data: () => mockMemorialData.basic
  });
  
  mockFirestore.getDocs.mockResolvedValue({
    docs: [
      {
        id: 'memorial-1',
        data: () => mockMemorialData.basic
      }
    ]
  });
};
```

## Test Coverage & Reporting

### Coverage Configuration

```typescript
// vitest.config.ts - Coverage settings
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test-setup.ts',
        'src/mocks/',
        '**/*.test.ts',
        '**/*.spec.ts'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    }
  }
});
```

### Running Tests

```bash
# Unit tests
npm run test:unit                 # Run once
npm run test:unit:watch          # Watch mode
npm run test:coverage            # With coverage report

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e                 # All browsers
npm run test:e2e -- --project=chromium  # Specific browser

# All tests
npm run test                     # Unit + E2E
```

### CI/CD Integration

```yaml
# .github/workflows/test.yml
name: Test Suite
on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:unit
      - run: npm run test:coverage

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npx playwright install
      - run: npm run test:e2e
```

## Testing Best Practices

### 1. Test Organization

- **Arrange-Act-Assert**: Structure tests clearly
- **Single Responsibility**: One assertion per test when possible
- **Descriptive Names**: Test names should explain what they verify

### 2. Mock Strategy

- **Mock External Dependencies**: Firebase, Stripe, Cloudflare
- **Keep Mocks Simple**: Don't over-mock internal logic
- **Reset Mocks**: Clean state between tests

### 3. Test Data

- **Use Fixtures**: Consistent test data across tests
- **Avoid Hard-Coding**: Use constants and generators
- **Clean Up**: Remove test data after tests

### 4. Performance

- **Parallel Execution**: Run tests concurrently when possible
- **Selective Testing**: Use test patterns for focused runs
- **Optimize Setup**: Minimize expensive operations in setup

---

*This testing strategy ensures TributeStream maintains high quality and reliability through comprehensive automated testing at all levels.*
