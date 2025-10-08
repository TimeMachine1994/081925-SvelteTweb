import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import HlsPage from '../../routes/hls/[streamId]/+page.svelte';

// Mock HLS.js
vi.mock('hls.js', () => {
	return {
		default: vi.fn().mockImplementation(() => ({
			loadSource: vi.fn(),
			attachMedia: vi.fn(),
			on: vi.fn(),
			destroy: vi.fn(),
			recoverMediaError: vi.fn(),
			startLoad: vi.fn()
		})),
		isSupported: vi.fn(() => true),
		Events: {
			MEDIA_ATTACHED: 'hlsMediaAttached',
			MANIFEST_PARSED: 'hlsManifestParsed',
			FRAG_LOADED: 'hlsFragLoaded',
			ERROR: 'hlsError'
		},
		ErrorTypes: {
			NETWORK_ERROR: 'networkError',
			MEDIA_ERROR: 'mediaError'
		}
	};
});

// Mock SvelteKit stores
vi.mock('$app/stores', () => ({
	page: {
		subscribe: vi.fn((callback) => {
			callback({ params: { streamId: 'test-stream-123' } });
			return () => {};
		})
	}
}));

// Mock fetch
global.fetch = vi.fn();

describe('HLS Page', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		// Reset fetch mock
		(global.fetch as any).mockReset();
	});

	it('should render loading state initially', () => {
		render(HlsPage);
		expect(screen.getByText('Loading stream...')).toBeInTheDocument();
	});

	it('should fetch HLS URL on mount', async () => {
		const mockResponse = {
			success: true,
			hlsUrl: 'https://customer-test.cloudflarestream.com/test/manifest/video.m3u8'
		};

		(global.fetch as any).mockResolvedValueOnce({
			ok: true,
			json: () => Promise.resolve(mockResponse)
		});

		render(HlsPage);

		expect(global.fetch).toHaveBeenCalledWith('/api/streams/test-stream-123/hls');
	});

	it('should handle API errors gracefully', async () => {
		const mockErrorResponse = {
			success: false,
			error: 'Stream not found'
		};

		(global.fetch as any).mockResolvedValueOnce({
			ok: true,
			json: () => Promise.resolve(mockErrorResponse)
		});

		render(HlsPage);

		// Wait for error state
		await screen.findByText('❌ Stream Error');
		expect(screen.getByText('Stream not found')).toBeInTheDocument();
	});

	it('should handle network errors', async () => {
		(global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

		render(HlsPage);

		await screen.findByText('❌ Stream Error');
		expect(screen.getByText('Network error')).toBeInTheDocument();
	});

	it('should show retry button on error', async () => {
		(global.fetch as any).mockRejectedValueOnce(new Error('Test error'));

		render(HlsPage);

		await screen.findByText('❌ Stream Error');
		expect(screen.getByText('🔄 Retry')).toBeInTheDocument();
	});
});
