import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import VideoPlayerCard from '../../src/lib/components/VideoPlayerCard.svelte';
import type { Stream } from '../../src/lib/types/stream';

/**
 * VideoPlayerCard Component Tests
 * Tests all player states including the new 'ending' state
 */

describe('VideoPlayerCard', () => {
  const baseStream: Stream = {
    id: 'test-stream',
    title: 'Test Stream',
    status: 'ready',
    recordingReady: false,
    isVisible: true,
    isPublic: true,
    createdBy: 'test-user',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  describe('Live State', () => {
    it('should render live stream with video player', () => {
      const liveStream: Stream = {
        ...baseStream,
        status: 'live',
        playbackUrl: 'https://cloudflarestream.com/test/iframe'
      };

      render(VideoPlayerCard, { stream: liveStream });

      // Should show live indicator
      expect(screen.getByText('🔴 LIVE')).toBeInTheDocument();
      
      // Should show iframe
      const iframe = screen.getByTitle('Test Stream - Live Stream');
      expect(iframe).toBeInTheDocument();
      expect(iframe).toHaveAttribute('src', expect.stringContaining('cloudflarestream.com'));
    });

    it('should show live indicator without player when no playback URL', () => {
      const liveStream: Stream = {
        ...baseStream,
        status: 'live'
        // No playbackUrl
      };

      render(VideoPlayerCard, { stream: liveStream });

      expect(screen.getByText('🔴 LIVE')).toBeInTheDocument();
      expect(screen.getByText('Stream is broadcasting')).toBeInTheDocument();
      expect(screen.getByText('No playback URL available')).toBeInTheDocument();
    });
  });

  describe('Ending State (Processing)', () => {
    it('should render processing animation when stream is ending', () => {
      const endingStream: Stream = {
        ...baseStream,
        status: 'ending'
      };

      render(VideoPlayerCard, { stream: endingStream });

      // Should show processing indicator
      expect(screen.getByText('🎬 PROCESSING RECORDING')).toBeInTheDocument();
      
      // Should show processing message
      expect(screen.getByText('Stream has ended, preparing recording...')).toBeInTheDocument();
      
      // Should show estimated time
      expect(screen.getByText('This usually takes 1-3 minutes')).toBeInTheDocument();
      expect(screen.getByText('⏱️ Estimated: 2-3 minutes remaining')).toBeInTheDocument();
      
      // Should show spinning animation
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
      
      // Should show progress bar
      const progressBar = document.querySelector('.bg-orange-500.animate-pulse');
      expect(progressBar).toBeInTheDocument();
    });

    it('should show correct status badge for ending state', () => {
      const endingStream: Stream = {
        ...baseStream,
        status: 'ending'
      };

      render(VideoPlayerCard, { stream: endingStream });

      // Should show PROCESSING badge with orange styling
      const badge = screen.getByText('PROCESSING');
      expect(badge).toBeInTheDocument();
      expect(badge.closest('div')).toHaveClass('bg-orange-50', 'border-orange-200');
    });
  });

  describe('Completed State (Recorded)', () => {
    it('should render recorded video player', () => {
      const recordedStream: Stream = {
        ...baseStream,
        status: 'completed',
        recordingReady: true,
        recordingUrl: 'https://cloudflarestream.com/recording/iframe'
      };

      render(VideoPlayerCard, { stream: recordedStream });

      // Should show recorded indicator
      expect(screen.getByText('📹 RECORDED')).toBeInTheDocument();
      
      // Should show iframe with recording
      const iframe = screen.getByTitle('Test Stream - Recorded Service');
      expect(iframe).toBeInTheDocument();
      expect(iframe).toHaveAttribute('src', expect.stringContaining('recording'));
    });

    it('should show processing state when completed but recording not ready', () => {
      const processingStream: Stream = {
        ...baseStream,
        status: 'completed',
        recordingReady: false
      };

      render(VideoPlayerCard, { stream: processingStream });

      // Should show legacy processing state
      expect(screen.getByText('PROCESSING')).toBeInTheDocument();
    });
  });

  describe('Scheduled State', () => {
    it('should render scheduled stream with time', () => {
      const scheduledTime = new Date(Date.now() + 3600000); // 1 hour from now
      const scheduledStream: Stream = {
        ...baseStream,
        status: 'scheduled',
        scheduledStartTime: scheduledTime
      };

      render(VideoPlayerCard, { stream: scheduledStream });

      expect(screen.getByText('SCHEDULED')).toBeInTheDocument();
      expect(screen.getByText(scheduledTime.toLocaleString())).toBeInTheDocument();
    });
  });

  describe('Ready/Dummy State', () => {
    it('should render ready state with placeholder', () => {
      const readyStream: Stream = {
        ...baseStream,
        status: 'ready'
      };

      render(VideoPlayerCard, { stream: readyStream });

      expect(screen.getByText('⚪ READY')).toBeInTheDocument();
      expect(screen.getByText('Waiting for configuration')).toBeInTheDocument();
    });

    it('should show playback URL in debug info when available', () => {
      const readyStream: Stream = {
        ...baseStream,
        status: 'ready',
        playbackUrl: 'https://cloudflarestream.com/test/iframe'
      };

      render(VideoPlayerCard, { stream: readyStream });

      expect(screen.getByText(/Playback URL: https:\/\/cloudflarestream\.com/)).toBeInTheDocument();
    });
  });

  describe('Stream 4 Special Handling', () => {
    it('should force Stream 4 to live state when ready', () => {
      const stream4: Stream = {
        ...baseStream,
        title: 'Stream 4',
        status: 'ready',
        playbackUrl: 'https://cloudflarestream.com/test/iframe'
      };

      render(VideoPlayerCard, { stream: stream4 });

      // Should be forced to live state
      expect(screen.getByText('🔴 LIVE')).toBeInTheDocument();
      
      // Should show iframe
      const iframe = screen.getByTitle('Stream 4 - Live Stream');
      expect(iframe).toBeInTheDocument();
    });
  });

  describe('Debug Information', () => {
    it('should show debug overlay with stream information', () => {
      const debugStream: Stream = {
        ...baseStream,
        status: 'live',
        playbackUrl: 'https://cloudflarestream.com/test/iframe'
      };

      render(VideoPlayerCard, { stream: debugStream });

      // Should show debug info
      expect(screen.getByText('Debug Info:')).toBeInTheDocument();
      expect(screen.getByText('State: live')).toBeInTheDocument();
      expect(screen.getByText(/Original URL:/)).toBeInTheDocument();
      expect(screen.getByText(/Generated URL:/)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper iframe titles', () => {
      const liveStream: Stream = {
        ...baseStream,
        status: 'live',
        playbackUrl: 'https://cloudflarestream.com/test/iframe'
      };

      render(VideoPlayerCard, { stream: liveStream });

      const iframe = screen.getByTitle('Test Stream - Live Stream');
      expect(iframe).toHaveAttribute('allowfullscreen');
      expect(iframe).toHaveAttribute('allow', expect.stringContaining('autoplay'));
    });

    it('should have proper heading structure', () => {
      render(VideoPlayerCard, { stream: baseStream });

      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toHaveTextContent('Test Stream');
    });
  });
});
