import { vi } from 'vitest';
import { render, type RenderResult } from '@testing-library/svelte';
import type { ComponentProps, SvelteComponent } from 'svelte';

// Enhanced render function with common setup
export const renderWithProps = <T extends SvelteComponent>(
  Component: new (...args: any[]) => T,
  props: ComponentProps<T> = {} as ComponentProps<T>,
  options: any = {}
): RenderResult<T> => {
  return render(Component, { props, ...options });
};

// Mock user context for components that need authentication
export const mockUserContext = (user: any = null) => {
  vi.mock('$lib/stores/auth', () => ({
    user: {
      subscribe: vi.fn((callback) => {
        callback(user);
        return () => {};
      })
    },
    isAuthenticated: {
      subscribe: vi.fn((callback) => {
        callback(!!user);
        return () => {};
      })
    }
  }));
};

// Mock SvelteKit navigation
export const mockNavigation = () => {
  const goto = vi.fn();
  const invalidateAll = vi.fn();
  
  vi.mock('$app/navigation', () => ({
    goto,
    invalidateAll,
    beforeNavigate: vi.fn(),
    afterNavigate: vi.fn()
  }));
  
  return { goto, invalidateAll };
};

// Mock page store
export const mockPageStore = (url = 'http://localhost:5173/', params = {}, data = {}) => {
  vi.mock('$app/stores', () => ({
    page: {
      subscribe: vi.fn((callback) => {
        callback({
          url: new URL(url),
          params,
          data,
          route: { id: '/test' }
        });
        return () => {};
      })
    }
  }));
};

// Mock Firebase services
export const mockFirebase = () => {
  const mockAuth = {
    signInWithEmailAndPassword: vi.fn(),
    createUserWithEmailAndPassword: vi.fn(),
    signOut: vi.fn(),
    onAuthStateChanged: vi.fn(),
    currentUser: null
  };

  const mockDb = {
    collection: vi.fn(() => ({
      doc: vi.fn(() => ({
        get: vi.fn(),
        set: vi.fn(),
        update: vi.fn(),
        delete: vi.fn()
      })),
      add: vi.fn(),
      where: vi.fn(() => ({
        get: vi.fn()
      })),
      orderBy: vi.fn(() => ({
        limit: vi.fn(() => ({
          get: vi.fn()
        }))
      }))
    }))
  };

  vi.mock('$lib/firebase', () => ({
    auth: mockAuth,
    db: mockDb
  }));

  vi.mock('$lib/server/firebase', () => ({
    adminAuth: {
      verifyIdToken: vi.fn(),
      createCustomToken: vi.fn(),
      setCustomUserClaims: vi.fn()
    },
    adminDb: mockDb
  }));

  return { mockAuth, mockDb };
};

// Mock external APIs
export const mockExternalAPIs = () => {
  // Mock Stripe
  vi.mock('stripe', () => ({
    default: vi.fn(() => ({
      paymentIntents: {
        create: vi.fn(),
        confirm: vi.fn()
      },
      customers: {
        create: vi.fn()
      }
    }))
  }));

  // Mock SendGrid
  vi.mock('@sendgrid/mail', () => ({
    setApiKey: vi.fn(),
    send: vi.fn()
  }));

  // Mock Cloudflare Stream
  vi.mock('$lib/utils/cloudflare', () => ({
    createStream: vi.fn(),
    getStreamInfo: vi.fn(),
    deleteStream: vi.fn()
  }));
};

// Wait for async operations to complete
export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0));

// Create mock form data
export const createMockFormData = (data: Record<string, string>) => {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    formData.append(key, value);
  });
  return formData;
};

// Mock environment variables
export const mockEnv = (vars: Record<string, string>) => {
  Object.entries(vars).forEach(([key, value]) => {
    vi.stubEnv(key, value);
  });
};

// Setup common test environment
export const setupTestEnvironment = () => {
  mockFirebase();
  mockExternalAPIs();
  mockNavigation();
  mockPageStore();
  
  // Mock global objects
  global.ResizeObserver = vi.fn(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn()
  }));

  global.IntersectionObserver = vi.fn(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn()
  }));

  // Mock fetch
  global.fetch = vi.fn();
  
  return {
    mockFetch: global.fetch as any
  };
};
