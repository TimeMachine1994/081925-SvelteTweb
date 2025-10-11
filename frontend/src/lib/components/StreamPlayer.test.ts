import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/svelte';
import StreamPlayer from './StreamPlayer.svelte';

// Mock the lucide-svelte icons
vi.mock('lucide-svelte', () => ({
	Calendar: 'div',
	Clock: 'div', 
	Play: 'div',
	Users: 'div'
}));

describe('StreamPlayer', () => {
	it('renders component without crashing', () => {
		const { container } = render(StreamPlayer, {
			streams: [],
			memorialName: 'Test Memorial'
		});
		
		expect(container).toBeTruthy();
	});

	it('renders recorded stream with correct iframe URL', () => {
		const recordedStream = {
			id: 'test-stream',
			title: 'Test Stream',
			status: 'completed' as const,
			memorialId: 'test-memorial',
			cloudflareStreamId: 'bcc928786efe7ad7bc88345765aa5599',
			recordingReady: true,
			isVisible: true,
			createdBy: 'test-user',
			createdAt: '2025-10-10T22:00:00.000Z',
			updatedAt: '2025-10-10T23:00:00.000Z'
		};

		const { container } = render(StreamPlayer, {
			streams: [recordedStream],
			memorialName: 'Test Memorial'
		});

		// Check if iframe with correct URL is rendered
		const iframe = container.querySelector('iframe');
		expect(iframe).toBeTruthy();
		expect(iframe?.src).toContain('bcc928786efe7ad7bc88345765aa5599/iframe');
	});

	it('prioritizes iframe URL over manifest URL for completed streams', () => {
		const recordedStreamWithManifest = {
			id: 'test-stream',
			title: 'Test Stream', 
			status: 'completed' as const,
			memorialId: 'test-memorial',
			cloudflareStreamId: 'bcc928786efe7ad7bc88345765aa5599',
			recordingPlaybackUrl: 'https://example.com/manifest.m3u8', // This should be ignored
			recordingReady: true,
			isVisible: true,
			createdBy: 'test-user',
			createdAt: '2025-10-10T22:00:00.000Z',
			updatedAt: '2025-10-10T23:00:00.000Z'
		};

		const { container } = render(StreamPlayer, {
			streams: [recordedStreamWithManifest],
			memorialName: 'Test Memorial'
		});

		// Should use iframe URL, not manifest URL
		const iframe = container.querySelector('iframe');
		expect(iframe?.src).toContain('/iframe');
		expect(iframe?.src).not.toContain('.m3u8');
	});
});
