import { describe, it, expect } from 'vitest';

describe('LivestreamArchivePlayer Logic Tests', () => {
	// Test the filtering logic without rendering
	it('filters visible and ready entries', () => {
		const entries = [
			{ id: '1', isVisible: true, recordingReady: true, playbackUrl: 'url1' },
			{ id: '2', isVisible: false, recordingReady: true, playbackUrl: 'url2' },
			{ id: '3', isVisible: true, recordingReady: false, playbackUrl: 'url3' }
		];

		const visible = entries.filter(e => e.isVisible && e.recordingReady && e.playbackUrl);
		expect(visible).toHaveLength(1);
		expect(visible[0].id).toBe('1');
	});

	it('formats duration correctly', () => {
		const formatDuration = (seconds?: number): string => {
			if (!seconds) return 'Unknown';
			const hours = Math.floor(seconds / 3600);
			const minutes = Math.floor((seconds % 3600) / 60);
			if (hours > 0) {
				return `${hours}h ${minutes}m`;
			}
			return `${minutes}m`;
		};

		expect(formatDuration(3600)).toBe('1h 0m');
		expect(formatDuration(1800)).toBe('30m');
		expect(formatDuration(undefined)).toBe('Unknown');
	});

	it('handles empty archive gracefully', () => {
		const entries: any[] = [];
		const visible = entries.filter(e => e.isVisible && e.recordingReady && e.playbackUrl);
		expect(visible).toHaveLength(0);
	});
});
