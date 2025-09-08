import { dev } from '$app/environment';
import { browser } from '$app/environment';

// Get Stripe key from environment or browser globals
function getStripePublishableKey(): string {
  // In browser, try to get from window object (set by server)
  if (browser && typeof window !== 'undefined') {
    const key = (window as any).__STRIPE_PUBLISHABLE_KEY__;
    if (key) return key;
  }
  
  // Fallback for development
  if (dev) {
    return 'pk_test_development_key_placeholder';
  }
  
  // Production fallback - will be validated later
  return '';
}

// Stripe configuration with environment variable handling
export const stripeConfig = {
  publishableKey: getStripePublishableKey(),
  
  // Stripe Elements appearance configuration
  appearance: {
    theme: 'stripe' as const,
    variables: {
      colorPrimary: '#f59e0b',
      colorBackground: '#ffffff',
      colorText: '#1f2937',
      colorDanger: '#ef4444',
      fontFamily: 'system-ui, sans-serif',
      spacingUnit: '4px',
      borderRadius: '8px'
    }
  },

  // Card element styling
  cardElementOptions: {
    style: {
      base: {
        fontSize: '16px',
        color: '#1f2937',
        '::placeholder': {
          color: '#9ca3af',
        },
      },
      invalid: {
        color: '#ef4444',
      },
    },
  }
};

// Validation function for Stripe configuration
export function validateStripeConfig(): { isValid: boolean; error?: string } {
  if (!stripeConfig.publishableKey) {
    return {
      isValid: false,
      error: 'Stripe publishable key is not configured. Please set PUBLIC_STRIPE_PUBLISHABLE_KEY in your environment variables.'
    };
  }

  if (dev && stripeConfig.publishableKey === 'pk_test_development_key_placeholder') {
    return {
      isValid: false,
      error: 'Please configure your Stripe test publishable key in the environment variables.'
    };
  }

  if (!dev && !stripeConfig.publishableKey.startsWith('pk_live_')) {
    console.warn('⚠️ Using test Stripe key in production environment');
  }

  return { isValid: true };
}
