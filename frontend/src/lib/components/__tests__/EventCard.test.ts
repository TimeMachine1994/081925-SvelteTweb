import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import EventCard from '../minimal-modern/EventCard.svelte';
import { setupTestEnvironment } from '../../../../test-utils/test-helpers';

// Mock the theme system
vi.mock('$lib/design-tokens/minimal-modern-theme', () => ({
  getTheme: vi.fn(() => ({
    card: 'bg-white border border-gray-200 rounded-lg shadow-sm',
    text: 'text-gray-900',
    hero: {
      sub: 'text-gray-600'
    },
    font: {
      heading: 'Inter, sans-serif'
    }
  }))
}));

// Mock Button and Badge components
vi.mock('../minimal-modern/Button.svelte', () => ({
  default: vi.fn(({ onclick, children, theme, variant, class: className }) => {
    const button = document.createElement('button');
    button.textContent = typeof children === 'string' ? children : 'Button';
    button.className = `btn ${variant || 'primary'} ${className || ''}`;
    if (onclick) {
      button.addEventListener('click', onclick);
    }
    return { $$: { fragment: button } };
  })
}));

vi.mock('../minimal-modern/Badge.svelte', () => ({
  default: vi.fn(({ children, theme, class: className }) => {
    const badge = document.createElement('span');
    badge.textContent = typeof children === 'string' ? children : 'Badge';
    badge.className = `badge ${className || ''}`;
    return { $$: { fragment: badge } };
  })
}));

describe('EventCard Component', () => {
  const mockMemorial = {
    id: 'event-123',
    name: 'John Michael Doe',
    dates: 'January 15, 1950 - December 20, 2023',
    description: 'A loving father, husband, and friend who touched the lives of everyone he met.',
    imageUrl: 'https://example.com/event-photo.jpg',
    location: 'St. Mary\'s Church, Springfield',
    serviceDate: 'December 25, 2023 at 2:00 PM'
  };

  beforeEach(() => {
    setupTestEnvironment();
  });

  describe('Basic Rendering', () => {
    it('renders event name and dates', () => {
      render(EventCard, {
        props: {
          event: mockMemorial
        }
      });

      expect(screen.getByText('John Michael Doe')).toBeInTheDocument();
      expect(screen.getByText('January 15, 1950 - December 20, 2023')).toBeInTheDocument();
    });

    it('renders event description when provided', () => {
      render(EventCard, {
        props: {
          event: mockMemorial
        }
      });

      expect(screen.getByText('A loving father, husband, and friend who touched the lives of everyone he met.')).toBeInTheDocument();
    });

    it('renders location when provided', () => {
      render(EventCard, {
        props: {
          event: mockMemorial
        }
      });

      expect(screen.getByText('📍 St. Mary\'s Church, Springfield')).toBeInTheDocument();
    });

    it('renders service date when provided', () => {
      render(EventCard, {
        props: {
          event: mockMemorial
        }
      });

      expect(screen.getByText('Service:')).toBeInTheDocument();
      expect(screen.getByText('December 25, 2023 at 2:00 PM')).toBeInTheDocument();
    });

    it('renders without optional fields', () => {
      const minimalMemorial = {
        id: 'event-456',
        name: 'Jane Smith',
        dates: '1960 - 2023'
      };

      render(EventCard, {
        props: {
          event: minimalMemorial
        }
      });

      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('1960 - 2023')).toBeInTheDocument();
      expect(screen.queryByText('Service:')).not.toBeInTheDocument();
    });
  });

  describe('Image Handling', () => {
    it('renders event image when provided', () => {
      render(EventCard, {
        props: {
          event: mockMemorial
        }
      });

      const image = screen.getByAltText('John Michael Doe');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', 'https://example.com/event-photo.jpg');
    });

    it('does not render image container when no image provided', () => {
      const memorialWithoutImage = {
        ...mockMemorial,
        imageUrl: undefined
      };

      render(EventCard, {
        props: {
          event: memorialWithoutImage
        }
      });

      expect(screen.queryByAltText('John Michael Doe')).not.toBeInTheDocument();
    });
  });

  describe('Live Status', () => {
    it('shows live badge when event is live', () => {
      const liveMemorial = {
        ...mockMemorial,
        isLive: true
      };

      render(EventCard, {
        props: {
          event: liveMemorial
        }
      });

      expect(screen.getByText('🔴 Live')).toBeInTheDocument();
      expect(screen.getByText('Watch Live')).toBeInTheDocument();
    });

    it('shows regular view button when not live', () => {
      const regularMemorial = {
        ...mockMemorial,
        isLive: false
      };

      render(EventCard, {
        props: {
          event: regularMemorial
        }
      });

      expect(screen.queryByText('🔴 Live')).not.toBeInTheDocument();
      expect(screen.getByText('View Event')).toBeInTheDocument();
    });

    it('shows correct viewer count text for live event', () => {
      const liveMemorial = {
        ...mockMemorial,
        isLive: true,
        viewerCount: 15
      };

      render(EventCard, {
        props: {
          event: liveMemorial
        }
      });

      expect(screen.getByText('15 viewers watching')).toBeInTheDocument();
    });

    it('shows correct viewer count text for completed event', () => {
      const completedMemorial = {
        ...mockMemorial,
        isLive: false,
        viewerCount: 42
      };

      render(EventCard, {
        props: {
          event: completedMemorial
        }
      });

      expect(screen.getByText('42 viewers attended')).toBeInTheDocument();
    });

    it('handles singular viewer count correctly', () => {
      const memorialWithOneViewer = {
        ...mockMemorial,
        isLive: true,
        viewerCount: 1
      };

      render(EventCard, {
        props: {
          event: memorialWithOneViewer
        }
      });

      expect(screen.getByText('1 viewer watching')).toBeInTheDocument();
    });
  });

  describe('Privacy Status', () => {
    it('shows private badge when event is private', () => {
      const privateMemorial = {
        ...mockMemorial,
        isPrivate: true
      };

      render(EventCard, {
        props: {
          event: privateMemorial
        }
      });

      expect(screen.getByText('🔒 Private')).toBeInTheDocument();
    });

    it('does not show private badge for public memorials', () => {
      const publicMemorial = {
        ...mockMemorial,
        isPrivate: false
      };

      render(EventCard, {
        props: {
          event: publicMemorial
        }
      });

      expect(screen.queryByText('🔒 Private')).not.toBeInTheDocument();
    });
  });

  describe('Action Buttons', () => {
    it('renders view button and calls onView when clicked', async () => {
      const onView = vi.fn();

      render(EventCard, {
        props: {
          event: mockMemorial,
          onView
        }
      });

      const viewButton = screen.getByText('View Event');
      await fireEvent.click(viewButton);

      expect(onView).toHaveBeenCalledTimes(1);
    });

    it('renders share button when onShare provided', () => {
      const onShare = vi.fn();

      render(EventCard, {
        props: {
          event: mockMemorial,
          onShare
        }
      });

      expect(screen.getByText('Share')).toBeInTheDocument();
    });

    it('does not render share button when onShare not provided', () => {
      render(EventCard, {
        props: {
          event: mockMemorial
        }
      });

      expect(screen.queryByText('Share')).not.toBeInTheDocument();
    });

    it('calls onShare when share button clicked', async () => {
      const onShare = vi.fn();

      render(EventCard, {
        props: {
          event: mockMemorial,
          onShare
        }
      });

      const shareButton = screen.getByText('Share');
      await fireEvent.click(shareButton);

      expect(onShare).toHaveBeenCalledTimes(1);
    });
  });

  describe('Theme Support', () => {
    it('applies custom theme', () => {
      const { getTheme } = require('$lib/design-tokens/minimal-modern-theme');

      render(EventCard, {
        props: {
          event: mockMemorial,
          theme: 'elegant'
        }
      });

      expect(getTheme).toHaveBeenCalledWith('elegant');
    });

    it('uses default minimal theme when no theme specified', () => {
      const { getTheme } = require('$lib/design-tokens/minimal-modern-theme');

      render(EventCard, {
        props: {
          event: mockMemorial
        }
      });

      expect(getTheme).toHaveBeenCalledWith('minimal');
    });

    it('applies custom CSS classes', () => {
      const { container } = render(EventCard, {
        props: {
          event: mockMemorial,
          class: 'custom-event-card'
        }
      });

      const card = container.querySelector('.custom-event-card');
      expect(card).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('provides proper alt text for event image', () => {
      render(EventCard, {
        props: {
          event: mockMemorial
        }
      });

      const image = screen.getByAltText('John Michael Doe');
      expect(image).toBeInTheDocument();
    });

    it('uses semantic heading for event name', () => {
      render(EventCard, {
        props: {
          event: mockMemorial
        }
      });

      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toHaveTextContent('John Michael Doe');
    });

    it('provides proper button roles', () => {
      const onView = vi.fn();
      const onShare = vi.fn();

      render(EventCard, {
        props: {
          event: mockMemorial,
          onView,
          onShare
        }
      });

      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(2);
      expect(buttons[0]).toHaveTextContent('View Event');
      expect(buttons[1]).toHaveTextContent('Share');
    });
  });

  describe('Content Truncation', () => {
    it('applies line clamp to long descriptions', () => {
      const memorialWithLongDescription = {
        ...mockMemorial,
        description: 'This is a very long description that should be truncated after three lines. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.'
      };

      const { container } = render(EventCard, {
        props: {
          event: memorialWithLongDescription
        }
      });

      const description = container.querySelector('.line-clamp-3');
      expect(description).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles missing event data gracefully', () => {
      const incompleteMemorial = {
        id: 'incomplete',
        name: '',
        dates: ''
      };

      render(EventCard, {
        props: {
          event: incompleteMemorial
        }
      });

      // Should not crash and should render basic structure
      expect(screen.getByText('View Event')).toBeInTheDocument();
    });

    it('handles zero viewer count', () => {
      const memorialWithZeroViewers = {
        ...mockMemorial,
        viewerCount: 0
      };

      render(EventCard, {
        props: {
          event: memorialWithZeroViewers
        }
      });

      expect(screen.getByText('0 viewers attended')).toBeInTheDocument();
    });

    it('handles undefined viewer count', () => {
      const memorialWithoutViewerCount = {
        ...mockMemorial,
        viewerCount: undefined
      };

      render(EventCard, {
        props: {
          event: memorialWithoutViewerCount
        }
      });

      expect(screen.queryByText(/viewers/)).not.toBeInTheDocument();
    });
  });

  describe('Visual States', () => {
    it('shows live indicator with proper styling', () => {
      const liveMemorial = {
        ...mockMemorial,
        isLive: true,
        imageUrl: 'https://example.com/image.jpg'
      };

      render(EventCard, {
        props: {
          event: liveMemorial
        }
      });

      const liveBadge = screen.getByText('🔴 Live');
      expect(liveBadge).toBeInTheDocument();
      expect(liveBadge.closest('.badge')).toHaveClass('bg-red-500 text-white animate-pulse');
    });

    it('shows private indicator with proper styling', () => {
      const privateMemorial = {
        ...mockMemorial,
        isPrivate: true
      };

      render(EventCard, {
        props: {
          event: privateMemorial
        }
      });

      const privateBadge = screen.getByText('🔒 Private');
      expect(privateBadge).toBeInTheDocument();
      expect(privateBadge.closest('.badge')).toHaveClass('bg-slate-100 text-slate-700 text-xs');
    });
  });
});
