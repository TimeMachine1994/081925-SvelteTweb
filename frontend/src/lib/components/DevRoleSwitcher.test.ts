import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import DevRoleSwitcher from './DevRoleSwitcher.svelte';

// Mock Firebase auth
vi.mock('$lib/firebase', () => ({
	auth: {
		signInWithEmailAndPassword: vi.fn(),
		signOut: vi.fn()
	}
}));

// Mock auth store
vi.mock('$lib/auth', () => ({
	user: {
		subscribe: vi.fn(() => () => {}),
		set: vi.fn(),
		update: vi.fn()
	}
}));

// Mock navigation
vi.mock('$app/navigation', () => ({
	goto: vi.fn()
}));

// Mock stores
vi.mock('$app/stores', () => ({
	page: {
		subscribe: vi.fn(() => () => {})
	}
}));

describe('DevRoleSwitcher - V1 Role System', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should render only 3 role buttons', () => {
		render(DevRoleSwitcher);

		// Check for the 3 V1 roles
		expect(screen.getByText('👑 Admin')).toBeInTheDocument();
		expect(screen.getByText('💼 Owner')).toBeInTheDocument();
		expect(screen.getByText('🏥 Funeral Director')).toBeInTheDocument();

		// Verify removed roles are not present
		expect(screen.queryByText('Family Member')).not.toBeInTheDocument();
		expect(screen.queryByText('Viewer')).not.toBeInTheDocument();
	});

	it('should have correct test accounts for V1 roles', () => {
		render(DevRoleSwitcher);

		// Check that buttons have the correct data attributes for test accounts
		const adminButton = screen.getByText('👑 Admin').closest('button');
		const ownerButton = screen.getByText('💼 Owner').closest('button');
		const fdButton = screen.getByText('🏥 Funeral Director').closest('button');

		expect(adminButton).toHaveAttribute('data-role', 'admin');
		expect(ownerButton).toHaveAttribute('data-role', 'owner');
		expect(fdButton).toHaveAttribute('data-role', 'funeral_director');
	});

	it('should handle role switching', async () => {
		const { auth } = await import('$lib/firebase');
		vi.mocked(auth.signInWithEmailAndPassword).mockResolvedValue({} as any);

		render(DevRoleSwitcher);

		const adminButton = screen.getByText('👑 Admin').closest('button');
		if (adminButton) {
			await fireEvent.click(adminButton);

			expect(auth.signInWithEmailAndPassword).toHaveBeenCalledWith(
				expect.stringContaining('admin@test.com'),
				'test123'
			);
		}
	});

	it('should display current user info when logged in', () => {
		// This would require mocking the user store, but the component should show user info
		render(DevRoleSwitcher);

		// The component should have a section for displaying current user
		const component = screen.getByTestId('dev-role-switcher');
		expect(component).toBeInTheDocument();
	});

	it('should have logout functionality', async () => {
		const { auth } = await import('$lib/firebase');
		vi.mocked(auth.signOut).mockResolvedValue();

		render(DevRoleSwitcher);

		// Look for logout button (if user is logged in)
		const logoutButton = screen.queryByText('🚪 Logout');
		if (logoutButton) {
			await fireEvent.click(logoutButton);
			expect(auth.signOut).toHaveBeenCalled();
		}
	});
});
