import type { LivestreamArchiveEntry, Memorial } from '$lib/types/memorial';

/**
 * Mock data for livestream archive testing
 */

export const mockArchiveEntry: LivestreamArchiveEntry = {
	id: 'test-stream-1',
	title: 'Memorial Service for John Doe',
	description: 'A beautiful celebration of life',
	cloudflareId: 'cf-stream-123',
	playbackUrl: 'https://cloudflarestream.com/cf-stream-123/iframe',
	startedAt: new Date('2024-01-15T14:00:00Z') as any,
	endedAt: new Date('2024-01-15T15:30:00Z') as any,
	duration: 5400, // 90 minutes
	isVisible: true,
	recordingReady: true,
	startedBy: 'user-123',
	startedByName: 'Director Smith',
	viewerCount: 45,
	createdAt: new Date('2024-01-15T15:30:00Z') as any,
	updatedAt: new Date('2024-01-15T15:30:00Z') as any
};

export const mockArchiveEntryProcessing: LivestreamArchiveEntry = {
	id: 'test-stream-2',
	title: 'Memorial Service for Jane Smith',
	description: 'In loving memory',
	cloudflareId: 'cf-stream-456',
	playbackUrl: 'https://cloudflarestream.com/cf-stream-456/iframe',
	startedAt: new Date('2024-01-16T10:00:00Z') as any,
	endedAt: new Date('2024-01-16T11:00:00Z') as any,
	duration: 3600, // 60 minutes
	isVisible: true,
	recordingReady: false, // Still processing
	startedBy: 'user-456',
	startedByName: 'Director Johnson',
	viewerCount: 32,
	createdAt: new Date('2024-01-16T11:00:00Z') as any,
	updatedAt: new Date('2024-01-16T11:00:00Z') as any
};

export const mockArchiveEntryHidden: LivestreamArchiveEntry = {
	id: 'test-stream-3',
	title: 'Private Family Service',
	description: 'Family only service',
	cloudflareId: 'cf-stream-789',
	playbackUrl: 'https://cloudflarestream.com/cf-stream-789/iframe',
	startedAt: new Date('2024-01-17T16:00:00Z') as any,
	endedAt: new Date('2024-01-17T17:00:00Z') as any,
	duration: 3600,
	isVisible: false, // Hidden from public
	recordingReady: true,
	startedBy: 'user-789',
	startedByName: 'Director Brown',
	viewerCount: 12,
	createdAt: new Date('2024-01-17T17:00:00Z') as any,
	updatedAt: new Date('2024-01-17T17:00:00Z') as any
};

export const mockArchiveEntries: LivestreamArchiveEntry[] = [
	mockArchiveEntry,
	mockArchiveEntryProcessing,
	mockArchiveEntryHidden
];

export const mockMemorialWithArchive: Memorial = {
	id: 'memorial-123',
	lovedOneName: 'John Doe',
	slug: 'john-doe',
	fullSlug: 'john-doe-2024-01-15',
	ownerUid: 'owner-123',
	creatorEmail: 'family@example.com',
	creatorName: 'Family Member',
	isPublic: true,
	content: 'Memorial content',
	custom_html: null,
	createdAt: new Date('2024-01-01T00:00:00Z') as any,
	updatedAt: new Date('2024-01-15T15:30:00Z') as any,
	services: {
		main: {
			location: { name: 'Memorial Chapel', address: '123 Main St', isUnknown: false },
			time: { date: '2024-01-15', time: '14:00', isUnknown: false },
			hours: 2
		},
		additional: []
	},
	livestreamArchive: mockArchiveEntries,
	funeralDirectorUid: 'director-123'
};

export const mockMemorialEmpty: Memorial = {
	id: 'memorial-456',
	lovedOneName: 'Jane Smith',
	slug: 'jane-smith',
	fullSlug: 'jane-smith-2024-01-16',
	ownerUid: 'owner-456',
	creatorEmail: 'family2@example.com',
	creatorName: 'Family Member 2',
	isPublic: true,
	content: 'Memorial content',
	custom_html: null,
	createdAt: new Date('2024-01-01T00:00:00Z') as any,
	updatedAt: new Date('2024-01-16T11:00:00Z') as any,
	services: {
		main: {
			location: { name: 'Community Center', address: '456 Oak Ave', isUnknown: false },
			time: { date: '2024-01-16', time: '10:00', isUnknown: false },
			hours: 1
		},
		additional: []
	},
	livestreamArchive: [], // No archive entries
	funeralDirectorUid: 'director-456'
};

/**
 * Mock API responses
 */
export const mockArchiveApiResponse = {
	success: true,
	archive: mockArchiveEntries,
	hasControlAccess: true
};

export const mockArchiveApiResponsePublic = {
	success: true,
	archive: mockArchiveEntries.filter(entry => entry.isVisible),
	hasControlAccess: false
};

export const mockVisibilityUpdateResponse = {
	success: true,
	message: 'Archive entry updated successfully'
};

/**
 * Mock fetch responses for testing
 */
export const createMockFetch = (responses: Record<string, any>) => {
	return vi.fn().mockImplementation((url: string, options?: RequestInit) => {
		const method = options?.method || 'GET';
		const key = `${method} ${url}`;
		
		if (responses[key]) {
			return Promise.resolve({
				ok: true,
				json: () => Promise.resolve(responses[key])
			});
		}
		
		// Default response for unmatched requests
		return Promise.resolve({
			ok: false,
			json: () => Promise.resolve({ error: 'Not found' })
		});
	});
};

/**
 * Test utilities
 */
export const waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const expectElementToBeVisible = (element: HTMLElement | null) => {
	expect(element).toBeInTheDocument();
	expect(element).toBeVisible();
};

export const expectElementToHaveText = (element: HTMLElement | null, text: string) => {
	expect(element).toBeInTheDocument();
	expect(element).toHaveTextContent(text);
};

/**
 * Mock console methods for testing
 */
export const mockConsole = () => {
	const originalConsole = { ...console };
	
	beforeEach(() => {
		vi.spyOn(console, 'log').mockImplementation(() => {});
		vi.spyOn(console, 'warn').mockImplementation(() => {});
		vi.spyOn(console, 'error').mockImplementation(() => {});
	});
	
	afterEach(() => {
		vi.restoreAllMocks();
	});
	
	return originalConsole;
};
