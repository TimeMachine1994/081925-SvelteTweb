import { vi } from 'vitest';
import '@testing-library/jest-dom';

// Mock SvelteKit modules
vi.mock('$app/environment', () => ({
	browser: false,
	dev: true,
	building: false,
	version: '1.0.0'
}));

vi.mock('$app/navigation', () => ({
	goto: vi.fn(),
	invalidate: vi.fn(),
	invalidateAll: vi.fn(),
	preloadData: vi.fn(),
	preloadCode: vi.fn(),
	beforeNavigate: vi.fn(),
	afterNavigate: vi.fn(),
	pushState: vi.fn(),
	replaceState: vi.fn()
}));

vi.mock('$app/stores', () => ({
	page: {
		subscribe: vi.fn()
	},
	navigating: {
		subscribe: vi.fn()
	},
	updated: {
		subscribe: vi.fn()
	}
}));

// Mock Firebase
vi.mock('$lib/firebase', () => ({
	auth: {
		currentUser: { uid: 'test-user', email: 'test@example.com' }
	},
	db: {}
}));

// Mock auto-save composable
vi.mock('$lib/composables/useAutoSave', () => ({
	useAutoSave: vi.fn(() => ({
		triggerAutoSave: vi.fn(),
		saveNow: vi.fn(() => Promise.resolve()),
		loadAutoSavedData: vi.fn(() => Promise.resolve(null)),
		loadCalculatorConfig: vi.fn(() => Promise.resolve(null)),
		isSaving: vi.fn(() => false),
		lastSaved: vi.fn(() => null),
		hasUnsavedChanges: vi.fn(() => false)
	}))
}));

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
	value: {
		getItem: vi.fn(),
		setItem: vi.fn(),
		removeItem: vi.fn(),
		clear: vi.fn()
	}
});

// Mock fetch
global.fetch = vi.fn();

// Mock window.alert
window.alert = vi.fn();
