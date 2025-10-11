import { render, screen, fireEvent } from '@testing-library/svelte';
import { describe, it, expect, vi } from 'vitest';
import OwnerPortal from './OwnerPortal.svelte';

// Mock the user context
const mockOwnerUser = {
	uid: 'owner-123',
	email: 'owner@example.com',
	role: 'owner',
	displayName: 'John Owner'
};

describe('OwnerPortal Component', () => {
	it('displays owner-specific sections', () => {
		render(OwnerPortal, {
			props: {
				user: mockOwnerUser,
				memorials: []
			}
		});

		// Test what users actually see
		expect(screen.getByText('Owner Portal')).toBeInTheDocument();
		expect(screen.getByText('Memorial Management')).toBeInTheDocument();
		expect(screen.getByText('Create Memorial')).toBeInTheDocument();
		// Invitation system removed in V1 - expect(screen.getByText('Manage Invitations')).toBeInTheDocument();
	});

	it('shows create memorial button and handles clicks', async () => {
		const mockCreateMemorial = vi.fn();

		render(OwnerPortal, {
			props: {
				user: mockOwnerUser,
				memorials: [],
				onCreateMemorial: mockCreateMemorial
			}
		});

		const createButton = screen.getByRole('button', { name: /create memorial/i });
		expect(createButton).toBeInTheDocument();

		await fireEvent.click(createButton);
		expect(mockCreateMemorial).toHaveBeenCalled();
	});

	it('displays memorial list when memorials exist', () => {
		const mockMemorials = [
			{ id: '1', lovedOneName: 'John Doe Memorial', ownerUid: 'owner-123' },
			{ id: '2', lovedOneName: 'Jane Smith Memorial', ownerUid: 'owner-123' }
		];

		render(OwnerPortal, {
			props: {
				user: mockOwnerUser,
				memorials: mockMemorials
			}
		});

		expect(screen.getByText('John Doe Memorial')).toBeInTheDocument();
		expect(screen.getByText('Jane Smith Memorial')).toBeInTheDocument();
	});

	it('shows empty state when no memorials', () => {
		render(OwnerPortal, {
			props: {
				user: mockOwnerUser,
				memorials: []
			}
		});

		expect(screen.getByText(/no memorials yet/i)).toBeInTheDocument();
	});
});
