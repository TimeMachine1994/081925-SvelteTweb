import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import StreamCard from './StreamCard.svelte';
import type { Stream } from '$lib/types/stream';

describe('StreamCard', () => {
	const mockStream: Stream = {
		id: 'test-stream-1',
		title: 'Test Memorial Service',
		description: 'A test stream for the memorial service',
		memorialId: 'memorial-123',
		status: 'ready',
		isVisible: true,
		streamKey: 'test-stream-key-123',
		rtmpUrl: 'rtmps://live.cloudflare.com/live/',
		cloudflareInputId: 'cf-input-123',
		createdBy: 'user-123',
		createdAt: '2024-01-01T00:00:00Z',
		updatedAt: '2024-01-01T00:00:00Z'
	};

	const mockProps = {
		stream: mockStream,
		onToggleVisibility: vi.fn(),
		onDelete: vi.fn(),
		onCopy: vi.fn(),
		copiedStreamKey: null,
		copiedRtmpUrl: null
	};

	it('renders stream title and description', () => {
		const { getByText } = render(StreamCard, mockProps);

		expect(getByText('Test Memorial Service')).toBeInTheDocument();
		expect(getByText('A test stream for the memorial service')).toBeInTheDocument();
	});

	it('shows correct status badge for ready stream', () => {
		const { getByText } = render(StreamCard, mockProps);

		expect(getByText('Ready')).toBeInTheDocument();
	});

	it('shows live indicator for live streams', () => {
		const liveStream = { ...mockStream, status: 'live' as const };
		const { container } = render(StreamCard, { ...mockProps, stream: liveStream });

		// Check for animated radio icon (live indicator)
		const radioIcon = container.querySelector('.animate-pulse');
		expect(radioIcon).toBeInTheDocument();
	});

	it('shows not live indicator for ready streams', () => {
		const readyStream = { ...mockStream, status: 'ready' as const };
		const { container } = render(StreamCard, { ...mockProps, stream: readyStream });

		// Check for Circle icon (not live indicator)
		const circleIcon = container.querySelector('svg');
		expect(circleIcon).toBeInTheDocument();
		// Should not have animated elements for ready streams
		const animatedIcon = container.querySelector('.animate-pulse');
		expect(animatedIcon).not.toBeInTheDocument();
	});

	it('displays RTMP URL and stream key', () => {
		const { getByDisplayValue } = render(StreamCard, mockProps);

		expect(getByDisplayValue('rtmps://live.cloudflare.com/live/')).toBeInTheDocument();
		expect(getByDisplayValue('test-stream-key-123')).toBeInTheDocument();
	});

	it('calls onCopy when copy buttons are clicked', async () => {
		const { getAllByTitle } = render(StreamCard, mockProps);

		const copyButtons = getAllByTitle(/Copy/);
		await fireEvent.click(copyButtons[0]); // RTMP URL copy

		expect(mockProps.onCopy).toHaveBeenCalledWith(
			'rtmps://live.cloudflare.com/live/',
			'url',
			'test-stream-1'
		);
	});

	it('calls onToggleVisibility when visibility button is clicked', async () => {
		const { getByTitle } = render(StreamCard, mockProps);

		const visibilityButton = getByTitle('Hide from public');
		await fireEvent.click(visibilityButton);

		expect(mockProps.onToggleVisibility).toHaveBeenCalledWith('test-stream-1', true);
	});

	it('calls onDelete when delete button is clicked', async () => {
		const { getByTitle } = render(StreamCard, mockProps);

		const deleteButton = getByTitle('Delete stream');
		await fireEvent.click(deleteButton);

		expect(mockProps.onDelete).toHaveBeenCalledWith('test-stream-1');
	});

	it('shows scheduled date when stream is scheduled', () => {
		const scheduledStream = {
			...mockStream,
			status: 'scheduled' as const,
			scheduledStartTime: '2024-12-25T10:00:00Z'
		};
		const { getByText } = render(StreamCard, { ...mockProps, stream: scheduledStream });

		expect(getByText('12/25/2024')).toBeInTheDocument();
	});
});
