# Development Setup Guide

## Overview

This guide covers setting up a local development environment for TributeStream, including all dependencies, services, and configuration required for full-stack development.

## Prerequisites

### System Requirements

- **Node.js**: Version 18.x or higher
- **npm**: Version 9.x or higher (comes with Node.js)
- **Git**: Latest version
- **Modern Browser**: Chrome, Firefox, Safari, or Edge

### Required Accounts & Services

1. **Firebase Project**
   - Create a new Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
   - Enable Authentication, Firestore, and Storage
   - Generate service account credentials

2. **Cloudflare Stream Account**
   - Sign up at [cloudflare.com](https://cloudflare.com)
   - Enable Cloudflare Stream service
   - Get API token and customer code

3. **Stripe Account** (for payment testing)
   - Create account at [stripe.com](https://stripe.com)
   - Get test API keys from dashboard

4. **SendGrid Account** (for email notifications)
   - Create account at [sendgrid.com](https://sendgrid.com)
   - Generate API key

## Installation Steps

### 1. Clone Repository

```bash
git clone <repository-url>
cd 081925-SvelteTweb-1/frontend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Create `.env` file from template:

```bash
cp .env.example .env
```

Configure environment variables:

```bash
# Email Service
SENDGRID_API_KEY="your_sendgrid_api_key"
FROM_EMAIL="your_email@domain.com"
PUBLIC_BASE_URL="http://localhost:5173"

# Stripe Payment Processing
STRIPE_SECRET_KEY="sk_test_your_stripe_secret_key"
STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret"

# Cloudflare Stream
CLOUDFLARE_ACCOUNT_ID="your_cloudflare_account_id"
CLOUDFLARE_API_TOKEN="your_cloudflare_api_token"
CLOUDFLARE_CUSTOMER_CODE="your_customer_code"
CLOUDFLARE_WEBHOOK_SECRET="your_cloudflare_webhook_secret"

# Firebase Client Configuration (Public)
PUBLIC_FIREBASE_API_KEY="your_firebase_api_key"
PUBLIC_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
PUBLIC_FIREBASE_STORAGE_BUCKET="your-project.firebasestorage.app"
PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your_sender_id"
PUBLIC_FIREBASE_APP_ID="your_app_id"
```

### 4. Firebase Admin Setup

Create Firebase service account:

1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate new private key"
3. Download the JSON file
4. Add these environment variables:

```bash
FIREBASE_PROJECT_ID="your-project-id"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----"
FIREBASE_STORAGE_BUCKET="your-project.firebasestorage.app"
```

### 5. Firebase Security Rules

Set up Firestore security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Memorial access rules
    match /memorials/{memorialId} {
      allow read: if resource.data.isPublic == true ||
                     request.auth != null && (
                       resource.data.ownerUid == request.auth.uid ||
                       resource.data.funeralDirectorUid == request.auth.uid ||
                       request.auth.token.isAdmin == true
                     );
      
      allow write: if request.auth != null && (
                      resource.data.ownerUid == request.auth.uid ||
                      resource.data.funeralDirectorUid == request.auth.uid ||
                      request.auth.token.isAdmin == true
                    );
    }
    
    // Stream access rules
    match /streams/{streamId} {
      allow read: if resource.data.isPublic == true ||
                     request.auth != null && (
                       resource.data.createdBy == request.auth.uid ||
                       request.auth.token.isAdmin == true
                     );
      
      allow write: if request.auth != null && (
                      resource.data.createdBy == request.auth.uid ||
                      request.auth.token.isAdmin == true
                    );
    }
    
    // User documents
    match /users/{userId} {
      allow read, write: if request.auth != null && 
                           (request.auth.uid == userId || request.auth.token.isAdmin == true);
    }
    
    // Funeral director profiles
    match /funeral_directors/{directorId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
                     (request.auth.uid == directorId || request.auth.token.isAdmin == true);
    }
  }
}
```

## Development Workflow

### 1. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### 2. Available Scripts

```bash
# Development
npm run dev              # Start dev server with hot reload
npm run build           # Build for production
npm run preview         # Preview production build locally

# Code Quality
npm run check           # Type checking with svelte-check
npm run check:watch     # Watch mode type checking
npm run format          # Format code with Prettier
npm run lint            # Lint code with ESLint

# Testing
npm run test:unit       # Run unit tests
npm run test:unit:watch # Run unit tests in watch mode
npm run test:coverage   # Run tests with coverage report
npm run test:e2e        # Run end-to-end tests
npm run test            # Run all tests

# Admin Tools
npm run create-admin    # Create admin user (requires Firebase setup)
```

### 3. Project Structure

```
frontend/
├── src/
│   ├── lib/
│   │   ├── components/        # Svelte components
│   │   ├── server/           # Server-side utilities
│   │   ├── types/            # TypeScript type definitions
│   │   ├── utils/            # Client-side utilities
│   │   ├── composables/      # Reactive composables
│   │   └── config/           # Configuration files
│   ├── routes/               # SvelteKit routes (pages + API)
│   ├── app.html             # HTML template
│   └── app.css              # Global styles
├── static/                  # Static assets
├── tests/                   # Test files
├── docs/                    # Documentation
└── package.json            # Dependencies and scripts
```

## Development Features

### 1. Hot Module Replacement (HMR)

SvelteKit provides instant updates during development:

- Component changes reflect immediately
- State preservation during updates
- CSS updates without page refresh
- API route changes trigger automatic restart

### 2. TypeScript Support

Full TypeScript integration:

```typescript
// Type checking during development
npm run check:watch

// Types are automatically generated for:
// - API routes ($lib/types/)
// - Component props
// - Store definitions
// - Database schemas
```

### 3. Auto-Save Development

The auto-save system works in development:

```typescript
// Test auto-save functionality
const autoSave = useAutoSave(memorialId, {
  delay: 1000, // Faster in development
  onSave: (success, error) => {
    console.log('Auto-save:', success ? '✅' : '❌', error);
  }
});
```

### 4. Development Tools

#### Svelte DevTools

Install the Svelte DevTools browser extension for:
- Component inspection
- Store state monitoring
- Performance profiling

#### Firebase Emulator (Optional)

For offline development:

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Start emulators
firebase emulators:start --only firestore,auth

# Update .env for emulator use
PUBLIC_FIREBASE_AUTH_DOMAIN="localhost"
FIREBASE_EMULATOR_HOST="localhost:8080"
```

## Testing Setup

### 1. Unit Testing with Vitest

```bash
# Run tests
npm run test:unit

# Watch mode
npm run test:unit:watch

# Coverage report
npm run test:coverage
```

Example test structure:

```typescript
// src/lib/components/Calculator.test.ts
import { render, screen } from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';
import Calculator from './Calculator.svelte';

describe('Calculator Component', () => {
  it('renders calculator form', () => {
    render(Calculator, {
      props: { memorialId: 'test-id' }
    });
    
    expect(screen.getByText('Service Calculator')).toBeInTheDocument();
  });
});
```

### 2. End-to-End Testing with Playwright

```bash
# Run E2E tests
npm run test:e2e

# Run with UI
npx playwright test --ui

# Generate tests
npx playwright codegen localhost:5173
```

Example E2E test:

```typescript
// tests/memorial-creation.spec.ts
import { test, expect } from '@playwright/test';

test('create memorial workflow', async ({ page }) => {
  await page.goto('/register/family');
  
  await page.fill('[data-testid="loved-one-name"]', 'John Doe');
  await page.fill('[data-testid="creator-email"]', 'family@example.com');
  
  await page.click('[data-testid="create-memorial"]');
  
  await expect(page).toHaveURL(/\/memorial\/[\w-]+$/);
  await expect(page.locator('h1')).toContainText('John Doe');
});
```

## Debugging

### 1. Browser DevTools

- **Console**: View logs, errors, and debug output
- **Network**: Monitor API requests and responses
- **Application**: Inspect localStorage, sessionStorage, cookies
- **Sources**: Set breakpoints in TypeScript code

### 2. Server-Side Debugging

```typescript
// Add debug logging
console.log('🔍 Debug:', { variable, context });

// Use structured logging
import { logError } from '$lib/utils/errorHandler';

try {
  // API operation
} catch (error) {
  logError(createAppError('OPERATION_FAILED', error, {
    component: 'ApiHandler',
    action: 'processRequest'
  }));
}
```

### 3. Firebase Debugging

```typescript
// Enable Firebase debug mode
import { connectFirestoreEmulator } from 'firebase/firestore';

if (dev) {
  connectFirestoreEmulator(db, 'localhost', 8080);
}
```

## Common Development Tasks

### 1. Adding New Components

```bash
# Create component file
touch src/lib/components/NewComponent.svelte

# Create test file
touch src/lib/components/NewComponent.test.ts

# Create type definitions if needed
touch src/lib/types/new-component.ts
```

### 2. Adding API Routes

```bash
# Create API route
mkdir -p src/routes/api/new-endpoint
touch src/routes/api/new-endpoint/+server.ts

# Add type definitions
# Add to src/lib/types/ as needed
```

### 3. Database Schema Changes

1. Update TypeScript interfaces in `/lib/types/`
2. Update Firestore security rules
3. Create migration scripts if needed
4. Update tests

### 4. Adding Environment Variables

1. Add to `.env.example`
2. Update documentation
3. Add validation in `src/lib/config/`
4. Update deployment configuration

## Performance Optimization

### 1. Development Build Analysis

```bash
# Analyze bundle size
npm run build
npx vite-bundle-analyzer dist

# Check for unused dependencies
npx depcheck
```

### 2. Code Splitting

```typescript
// Lazy load components
const LazyComponent = lazy(() => import('./HeavyComponent.svelte'));

// Dynamic imports for routes
const routes = {
  '/admin': () => import('./admin/+page.svelte')
};
```

### 3. Image Optimization

```typescript
// Use appropriate image formats
// Implement lazy loading
// Optimize for different screen sizes
```

## Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Kill process on port 5173
   lsof -ti:5173 | xargs kill -9
   ```

2. **Firebase Connection Issues**
   - Check environment variables
   - Verify service account permissions
   - Ensure Firestore rules allow access

3. **Cloudflare Stream Issues**
   - Verify API token permissions
   - Check customer code configuration
   - Test webhook endpoints

4. **Build Failures**
   ```bash
   # Clear node_modules and reinstall
   rm -rf node_modules package-lock.json
   npm install
   
   # Clear SvelteKit cache
   rm -rf .svelte-kit
   ```

### Getting Help

1. Check the [troubleshooting guide](./13-troubleshooting.md)
2. Review error logs in browser console
3. Check Firebase console for backend errors
4. Verify all environment variables are set correctly

---

*This development setup provides a complete local environment for TributeStream development with hot reloading, testing, and debugging capabilities.*
