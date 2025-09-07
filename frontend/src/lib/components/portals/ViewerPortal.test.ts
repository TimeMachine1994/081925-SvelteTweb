import { render, screen, fireEvent } from '@testing-library/svelte';
import { describe, it, expect, vi } from 'vitest';
import ViewerPortal from './ViewerPortal.svelte';

const mockViewerUser = {
  uid: 'viewer-123',
  email: 'viewer@example.com',
  role: 'viewer',
  displayName: 'Jane Viewer'
};

describe('ViewerPortal Component', () => {
  it('displays viewer-specific sections', () => {
    render(ViewerPortal, {
      props: {
        user: mockViewerUser,
        followedMemorials: []
      }
    });

    expect(screen.getByText('Viewer Portal')).toBeInTheDocument();
    expect(screen.getByText('Followed Memorials')).toBeInTheDocument();
    expect(screen.getByText('Discover Memorials')).toBeInTheDocument();
  });

  it('shows follow/unfollow functionality', async () => {
    const mockToggleFollow = vi.fn();
    const mockMemorials = [
      { id: '1', name: 'Memorial 1', isFollowing: false }
    ];

    render(ViewerPortal, {
      props: {
        user: mockViewerUser,
        availableMemorials: mockMemorials,
        onToggleFollow: mockToggleFollow
      }
    });

    const followButton = screen.getByRole('button', { name: /follow/i });
    await fireEvent.click(followButton);
    
    expect(mockToggleFollow).toHaveBeenCalledWith('1', true);
  });

  it('hides owner-specific features', () => {
    render(ViewerPortal, {
      props: {
        user: mockViewerUser,
        followedMemorials: []
      }
    });

    // Viewer should NOT see these owner features
    expect(screen.queryByText('Create Memorial')).not.toBeInTheDocument();
    expect(screen.queryByText('Manage Invitations')).not.toBeInTheDocument();
    expect(screen.queryByText('Livestream Management')).not.toBeInTheDocument();
  });
});
