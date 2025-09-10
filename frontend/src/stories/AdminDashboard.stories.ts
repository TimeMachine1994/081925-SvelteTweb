import type { Meta, StoryObj } from '@storybook/svelte';
import AdminDashboard from '../routes/admin/+page.svelte';

// Mock data for admin dashboard
const mockMemorials = [
	{
		id: 'memorial1',
		title: 'John Doe Memorial',
		description: 'In loving memory of John Doe',
		ownerUid: 'user1',
		createdByUserId: 'user1',
		createdAt: '2024-01-15T10:30:00.000Z',
		updatedAt: '2024-01-16T14:20:00.000Z',
		serviceDate: '2024-02-01T15:00:00.000Z',
		livestream: true,
		paymentHistory: [
			{
				amount: 299,
				status: 'completed',
				createdAt: '2024-01-15T10:30:00.000Z',
				updatedAt: '2024-01-15T10:35:00.000Z'
			}
		],
		schedule: {
			createdAt: '2024-01-15T10:30:00.000Z',
			updatedAt: '2024-01-16T14:20:00.000Z',
			serviceDate: '2024-02-01T15:00:00.000Z'
		}
	},
	{
		id: 'memorial2',
		title: 'Jane Smith Memorial Service',
		description: 'Celebrating the life of Jane Smith',
		ownerUid: 'user2',
		createdByUserId: 'user2',
		createdAt: '2024-01-10T09:15:00.000Z',
		updatedAt: '2024-01-12T16:45:00.000Z',
		serviceDate: '2024-01-25T11:00:00.000Z',
		livestream: false,
		paymentHistory: [],
		schedule: null
	}
];

const mockUsers = [
	{
		uid: 'user1',
		email: 'john.owner@example.com',
		displayName: 'John Owner',
		role: 'owner',
		createdAt: '2024-01-01T08:00:00.000Z',
		updatedAt: '2024-01-15T10:30:00.000Z'
	},
	{
		uid: 'user2',
		email: 'jane.director@example.com',
		displayName: 'Jane Director',
		role: 'funeral_director',
		createdAt: '2024-01-05T12:30:00.000Z',
		updatedAt: '2024-01-12T16:45:00.000Z'
	},
	{
		uid: 'admin1',
		email: 'admin@tributestream.com',
		displayName: 'System Admin',
		role: 'admin',
		createdAt: '2023-12-01T00:00:00.000Z',
		updatedAt: '2024-01-16T14:20:00.000Z'
	}
];

const mockStats = {
	totalMemorials: 72,
	totalUsers: 156,
	activeStreams: 3,
	recentMemorials: 8
};

const mockAdminUser = {
	uid: 'admin1',
	email: 'admin@tributestream.com',
	displayName: 'System Admin',
	role: 'admin',
	admin: true
};

const meta: Meta<AdminDashboard> = {
	title: 'Pages/AdminDashboard',
	component: AdminDashboard,
	parameters: {
		layout: 'fullscreen',
		docs: {
			description: {
				component: 'Admin dashboard for managing users, memorials, and system statistics.'
			}
		}
	},
	tags: ['autodocs'],
	argTypes: {
		data: {
			description: 'Admin dashboard data including user, memorials, users, and stats',
			control: { type: 'object' }
		}
	}
};

export default meta;
type Story = StoryObj<AdminDashboard>;

export const Default: Story = {
	args: {
		data: {
			user: mockAdminUser,
			memorials: mockMemorials,
			allUsers: mockUsers,
			stats: mockStats
		}
	}
};

export const EmptyState: Story = {
	args: {
		data: {
			user: mockAdminUser,
			memorials: [],
			allUsers: [],
			stats: {
				totalMemorials: 0,
				totalUsers: 0,
				activeStreams: 0,
				recentMemorials: 0
			}
		}
	}
};

export const LargeDataset: Story = {
	args: {
		data: {
			user: mockAdminUser,
			memorials: Array.from({ length: 50 }, (_, i) => ({
				id: `memorial${i + 1}`,
				title: `Memorial ${i + 1}`,
				description: `Description for memorial ${i + 1}`,
				ownerUid: `user${i + 1}`,
				createdByUserId: `user${i + 1}`,
				createdAt: new Date(2024, 0, i + 1).toISOString(),
				updatedAt: new Date(2024, 0, i + 2).toISOString(),
				serviceDate: new Date(2024, 1, i + 1).toISOString(),
				livestream: i % 3 === 0,
				paymentHistory: i % 2 === 0 ? [{
					amount: 299,
					status: 'completed',
					createdAt: new Date(2024, 0, i + 1).toISOString(),
					updatedAt: new Date(2024, 0, i + 1).toISOString()
				}] : [],
				schedule: i % 4 === 0 ? {
					createdAt: new Date(2024, 0, i + 1).toISOString(),
					updatedAt: new Date(2024, 0, i + 2).toISOString(),
					serviceDate: new Date(2024, 1, i + 1).toISOString()
				} : null
			})),
			allUsers: Array.from({ length: 100 }, (_, i) => ({
				uid: `user${i + 1}`,
				email: `user${i + 1}@example.com`,
				displayName: `User ${i + 1}`,
				role: ['owner', 'funeral_director', 'viewer'][i % 3],
				createdAt: new Date(2024, 0, i + 1).toISOString(),
				updatedAt: new Date(2024, 0, i + 2).toISOString()
			})),
			stats: {
				totalMemorials: 50,
				totalUsers: 100,
				activeStreams: 17,
				recentMemorials: 12
			}
		}
	}
};

export const ErrorState: Story = {
	args: {
		data: {
			user: mockAdminUser,
			memorials: [],
			allUsers: [],
			stats: {
				totalMemorials: 0,
				totalUsers: 0,
				activeStreams: 0,
				recentMemorials: 0
			},
			error: 'Failed to load admin data. Please try again.'
		}
	}
};

export const LoadingState: Story = {
	args: {
		data: {
			user: mockAdminUser,
			memorials: null,
			allUsers: null,
			stats: null
		}
	}
};
