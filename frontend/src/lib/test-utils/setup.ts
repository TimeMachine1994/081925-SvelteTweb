import { vi } from 'vitest';
import '@testing-library/jest-dom';

// Mock SvelteKit modules
vi.mock('$app/environment', () => ({
	browser: false,
	dev: true
}));

vi.mock('$app/navigation', () => ({
	goto: vi.fn(),
	invalidateAll: vi.fn()
}));

// Mock console methods to reduce test noise
global.console = {
	...console,
	log: vi.fn(),
	warn: vi.fn(),
	error: vi.fn()
};

// Setup DOM environment
Object.defineProperty(window, 'matchMedia', {
	writable: true,
	value: vi.fn().mockImplementation(query => ({
		matches: false,
		media: query,
		onchange: null,
		addListener: vi.fn(),
		removeListener: vi.fn(),
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
		dispatchEvent: vi.fn(),
	})),
});

// Mock fetch globally
global.fetch = vi.fn();
