import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import AdminPortal from '../routes/admin/+page.svelte';

// Mock fetch globally
global.fetch = vi.fn();

// Mock SvelteKit stores
vi.mock('$app/stores', () => ({
	page: {
		subscribe: vi.fn(() => () => {})
	}
}));

describe('AdminPortal', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		// Reset fetch mock
		(global.fetch as any).mockClear();
	});

	it('should render admin portal header correctly', () => {
		render(AdminPortal);
		
		expect(screen.getByText('Admin Portal')).toBeInTheDocument();
		expect(screen.getByText('System administration and user management')).toBeInTheDocument();
	});

	it('should render navigation tabs', () => {
		render(AdminPortal);
		
		expect(screen.getByText('Dashboard')).toBeInTheDocument();
		expect(screen.getByText('User Management')).toBeInTheDocument();
		expect(screen.getByText(/Applications/)).toBeInTheDocument();
	});

	it('should show loading state initially', () => {
		render(AdminPortal);
		
		expect(screen.getByRole('status')).toBeInTheDocument();
	});

	it('should load dashboard data on mount', async () => {
		const mockStats = {
			totalUsers: 150,
			totalMemorials: 75,
			pendingApplications: 5,
			activeStreams: 3,
			newUsersThisWeek: 12,
			newMemorialsThisWeek: 8
		};

		const mockUsers = [
			{
				uid: 'user1',
				email: 'user1@test.com',
				displayName: 'User One',
				role: 'owner',
				isAdmin: false,
				suspended: false,
				memorialCount: 2
			}
		];

		const mockApplications = [
			{
				id: 'app1',
				userId: 'user1',
				userEmail: 'director@test.com',
				businessName: 'Test Funeral Home',
				licenseNumber: 'FL123456',
				phoneNumber: '555-0123',
				address: '123 Main St',
				status: 'pending_review',
				createdAt: new Date('2024-01-01')
			}
		];

		(global.fetch as any)
			.mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve(mockStats)
			})
			.mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve(mockUsers)
			})
			.mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve(mockApplications)
			});

		render(AdminPortal);

		await waitFor(() => {
			expect(screen.getByText('150')).toBeInTheDocument(); // Total users
			expect(screen.getByText('75')).toBeInTheDocument(); // Total memorials
			expect(screen.getByText('5')).toBeInTheDocument(); // Pending applications
		});

		expect(global.fetch).toHaveBeenCalledWith('/api/admin/stats');
		expect(global.fetch).toHaveBeenCalledWith('/api/admin/users');
		expect(global.fetch).toHaveBeenCalledWith('/api/admin/applications');
	});

	it('should switch between tabs correctly', async () => {
		render(AdminPortal);

		// Click on User Management tab
		const userManagementTab = screen.getByText('User Management');
		await fireEvent.click(userManagementTab);

		// Should show user management content
		expect(screen.getByText('Manage user accounts and permissions')).toBeInTheDocument();

		// Click on Applications tab
		const applicationsTab = screen.getByText(/Applications/);
		await fireEvent.click(applicationsTab);

		// Should show applications content or empty state
		expect(screen.getByText('No Pending Applications') || screen.getByText('Test Funeral Home')).toBeInTheDocument();
	});

	it('should handle application approval', async () => {
		const mockApplications = [
			{
				id: 'app1',
				userId: 'user1',
				userEmail: 'director@test.com',
				businessName: 'Test Funeral Home',
				licenseNumber: 'FL123456',
				phoneNumber: '555-0123',
				address: '123 Main St',
				status: 'pending_review',
				createdAt: new Date('2024-01-01')
			}
		];

		// Mock initial data load
		(global.fetch as any)
			.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) })
			.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) })
			.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockApplications) })
			// Mock approval request
			.mockResolvedValueOnce({ ok: true })
			// Mock data reload after approval
			.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) })
			.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) })
			.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) });

		render(AdminPortal);

		// Switch to applications tab
		const applicationsTab = screen.getByText(/Applications/);
		await fireEvent.click(applicationsTab);

		await waitFor(() => {
			expect(screen.getByText('Test Funeral Home')).toBeInTheDocument();
		});

		// Click approve button
		const approveButton = screen.getByText('Approve');
		await fireEvent.click(approveButton);

		await waitFor(() => {
			expect(global.fetch).toHaveBeenCalledWith('/api/admin/applications/app1/approve', {
				method: 'POST'
			});
		});
	});

	it('should handle application rejection', async () => {
		const mockApplications = [
			{
				id: 'app1',
				userId: 'user1',
				userEmail: 'director@test.com',
				businessName: 'Test Funeral Home',
				licenseNumber: 'FL123456',
				phoneNumber: '555-0123',
				address: '123 Main St',
				status: 'pending_review',
				createdAt: new Date('2024-01-01')
			}
		];

		// Mock initial data load and rejection
		(global.fetch as any)
			.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) })
			.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) })
			.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockApplications) })
			.mockResolvedValueOnce({ ok: true })
			.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) })
			.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) })
			.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) });

		render(AdminPortal);

		// Switch to applications tab
		const applicationsTab = screen.getByText(/Applications/);
		await fireEvent.click(applicationsTab);

		await waitFor(() => {
			expect(screen.getByText('Test Funeral Home')).toBeInTheDocument();
		});

		// Click reject button
		const rejectButton = screen.getByText('Reject');
		await fireEvent.click(rejectButton);

		await waitFor(() => {
			expect(global.fetch).toHaveBeenCalledWith('/api/admin/applications/app1/reject', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ reason: 'Application rejected by admin' })
			});
		});
	});

	it('should handle user suspension', async () => {
		const mockUsers = [
			{
				uid: 'user1',
				email: 'user1@test.com',
				displayName: 'User One',
				role: 'owner',
				isAdmin: false,
				suspended: false,
				memorialCount: 2
			}
		];

		// Mock data load and suspension
		(global.fetch as any)
			.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) })
			.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockUsers) })
			.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) })
			.mockResolvedValueOnce({ ok: true })
			.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) })
			.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) })
			.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) });

		render(AdminPortal);

		// Switch to users tab
		const usersTab = screen.getByText('User Management');
		await fireEvent.click(usersTab);

		await waitFor(() => {
			expect(screen.getByText('user1@test.com')).toBeInTheDocument();
		});

		// Click suspend button
		const suspendButton = screen.getByText('Suspend');
		await fireEvent.click(suspendButton);

		await waitFor(() => {
			expect(global.fetch).toHaveBeenCalledWith('/api/admin/users/user1/suspend', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ reason: 'Admin action' })
			});
		});
	});

	it('should handle user activation', async () => {
		const mockUsers = [
			{
				uid: 'user1',
				email: 'user1@test.com',
				displayName: 'User One',
				role: 'owner',
				isAdmin: false,
				suspended: true,
				memorialCount: 2
			}
		];

		// Mock data load and activation
		(global.fetch as any)
			.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) })
			.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockUsers) })
			.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) })
			.mockResolvedValueOnce({ ok: true })
			.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) })
			.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) })
			.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) });

		render(AdminPortal);

		// Switch to users tab
		const usersTab = screen.getByText('User Management');
		await fireEvent.click(usersTab);

		await waitFor(() => {
			expect(screen.getByText('user1@test.com')).toBeInTheDocument();
			expect(screen.getByText('Suspended')).toBeInTheDocument();
		});

		// Click activate button
		const activateButton = screen.getByText('Activate');
		await fireEvent.click(activateButton);

		await waitFor(() => {
			expect(global.fetch).toHaveBeenCalledWith('/api/admin/users/user1/activate', {
				method: 'POST'
			});
		});
	});

	it('should show empty state when no applications exist', async () => {
		// Mock empty applications
		(global.fetch as any)
			.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) })
			.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) })
			.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) });

		render(AdminPortal);

		// Switch to applications tab
		const applicationsTab = screen.getByText(/Applications/);
		await fireEvent.click(applicationsTab);

		await waitFor(() => {
			expect(screen.getByText('No Pending Applications')).toBeInTheDocument();
			expect(screen.getByText('All funeral director applications have been processed.')).toBeInTheDocument();
		});
	});

	it('should handle API errors gracefully', async () => {
		// Mock API errors
		(global.fetch as any)
			.mockRejectedValueOnce(new Error('Network error'))
			.mockRejectedValueOnce(new Error('Network error'))
			.mockRejectedValueOnce(new Error('Network error'));

		const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

		render(AdminPortal);

		await waitFor(() => {
			expect(consoleSpy).toHaveBeenCalledWith('Error loading admin data:', expect.any(Error));
		});

		consoleSpy.mockRestore();
	});
});
