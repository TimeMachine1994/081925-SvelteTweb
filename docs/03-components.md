# Component Architecture

## Overview

TributeStream's frontend is built with Svelte 5 components organized in a hierarchical structure. Components follow modern patterns with reactive state management using runes ($state, $derived, $effect) and proper separation of concerns.

## Component Hierarchy

### Core Layout Components

#### Navbar.svelte
Main navigation component with role-based menu items.

**Props:**
- `user: User | null` - Current authenticated user

**Features:**
- Role-based navigation (Admin, Funeral Director, Owner)
- Responsive mobile menu
- Authentication status indicators
- Quick access to profile and admin functions

---

#### Footer.svelte
Site footer with links and branding.

**Features:**
- Company information and links
- Social media integration
- Copyright and legal information

---

### Authentication Components

#### Login.svelte
Complete authentication interface with Firebase integration.

**Features:**
- Email/password login
- Password reset functionality
- Registration redirect
- Error handling and validation
- Glassmorphism design

**State Management:**
```typescript
let email = $state('');
let password = $state('');
let isLoading = $state(false);
let showResetForm = $state(false);
let resetMessage = $state('');
let errorMessage = $state('');
```

**Key Functions:**
- `handleLogin()` - Process user authentication
- `handlePasswordReset()` - Send password reset email
- `showResetForm()` - Switch to reset mode
- `hideResetForm()` - Return to login mode

---

#### Register.svelte
User registration component with role selection.

**Features:**
- Multi-step registration process
- Role-based form fields
- Email verification
- Terms acceptance
- Auto-redirect after registration

---

### Profile & Portal Components

#### Profile.svelte
User profile management with role-specific theming.

**Features:**
- Role-specific UI theming (Owner: amber, Funeral Director: purple)
- Glassmorphism design with animated backgrounds
- Profile information display and editing
- Role-specific feature access
- Responsive design with mobile optimization

**Styling:**
- Animated background with floating orbs
- Role-based color schemes
- 3D shadows and gradient overlays
- Smooth fade-in animations

---

#### Portal Components

Located in `/lib/components/portals/`:

##### AdminPortal.svelte
Administrative dashboard for system management.

**Features:**
- User management interface
- System statistics and analytics
- Funeral director approval workflow
- Audit log access
- System configuration

##### FuneralDirectorPortal.svelte
Professional interface for funeral directors.

**Features:**
- Memorial management dashboard
- Client memorial creation
- Livestream control access
- Business profile management
- Analytics and reporting

##### OwnerPortal.svelte
Family member interface for memorial owners.

**Features:**
- Memorial content management
- Photo and video uploads
- Livestream scheduling
- Family member invitations
- Memorial sharing tools

##### ViewerPortal.svelte
Public interface for memorial visitors.

**Features:**
- Memorial browsing
- Follow/unfollow functionality
- Comment and tribute posting
- Memorial search
- Social sharing

---

### Livestream Components

#### LivestreamControl.svelte
Main livestream management interface.

**Props:**
- `memorialId: string` - Memorial identifier
- `user: User` - Current user

**Features:**
- Start/stop livestream controls
- Real-time status monitoring
- Stream configuration management
- Archive visibility controls
- WHIP/RTMP endpoint management

**State Management:**
```typescript
let livestream = $state(null);
let isLoading = $state(false);
let isStarting = $state(false);
let statusMessage = $state('');
let streamStatus = $derived(livestream?.status || 'ready');
```

---

#### LivestreamManager.svelte
Comprehensive stream management with analytics.

**Features:**
- Multiple stream management
- Real-time viewer analytics
- Recording status monitoring
- Stream scheduling
- Visibility controls

---

#### LivestreamPlayer.svelte
Video player component for memorial pages.

**Props:**
- `memorialId: string` - Memorial identifier
- `scheduledServices?: ScheduledService[]` - Service information

**Features:**
- Automatic live/recorded detection
- Multiple stream support
- Cloudflare Stream integration
- Mobile-responsive player
- Status indicators (live, recorded, processing)

**Player Logic:**
```typescript
let streams = $state([]);
let liveStreams = $derived(streams.filter(s => s.status === 'live'));
let recordedStreams = $derived(streams.filter(s => s.recordingReady));
```

---

#### LivestreamArchive.svelte
Archive management interface for completed streams.

**Features:**
- Archive entry listing
- Visibility toggle controls
- Recording status tracking
- Bulk management operations
- Search and filtering

---

#### LivestreamArchivePlayer.svelte
Multi-player component for displaying archived streams.

**Props:**
- `memorialId: string` - Memorial identifier
- `canManage?: boolean` - Management permissions

**Features:**
- Multiple recording playback
- Chronological organization
- Visibility-based filtering
- Recording status indicators
- Responsive grid layout

---

### Video Player Components

#### VideoPlayerCard.svelte
Unified video player with multiple format support.

**Props:**
- `stream: Stream` - Stream data
- `memorial?: Memorial` - Memorial context

**Features:**
- HLS/DASH playback support
- Cloudflare Stream iframe integration
- Live stream detection
- Recording status handling
- Error fallback mechanisms

**Player Selection Logic:**
```typescript
let playerType = $derived((() => {
  if (stream.status === 'live' && stream.cloudflareStreamId) {
    return 'hls'; // Prefer HLS for live streams
  }
  if (stream.recordingReady && stream.recordingUrl) {
    return 'video'; // Use native video for recordings
  }
  return 'iframe'; // Fallback to iframe
})());
```

---

#### StreamVideoPlayer.svelte
Specialized player for stream content.

**Features:**
- Adaptive bitrate streaming
- Custom controls overlay
- Fullscreen support
- Mobile optimization
- Analytics integration

---

#### TailwindVideoPlayer.svelte
Styled video player with Tailwind CSS.

**Features:**
- Custom styled controls
- Responsive design
- Accessibility features
- Keyboard navigation
- Progress tracking

---

### Calculator & Booking Components

Located in `/lib/components/calculator/`:

#### Calculator.svelte
Main pricing calculator with tier selection.

**Props:**
- `memorial: Memorial` - Memorial data
- `initialData?: CalculatorFormData` - Pre-filled data

**Features:**
- Tier selection (Solo, Live, Legacy)
- Add-on services selection
- Real-time pricing updates
- Auto-save functionality
- Validation and error handling

**State Management:**
```typescript
let selectedTier = $state('solo');
let addons = $state({
  photography: false,
  audioVisualSupport: false,
  liveMusician: false,
  woodenUsbDrives: 0
});
let bookingItems = $derived.by(() => calculateBookingItems());
let total = $derived(bookingItems.reduce((sum, item) => sum + item.total, 0));
```

---

#### TierSelector.svelte
Service tier selection component.

**Props:**
- `selectedTier: Tier` - Current selection
- `onchange: (tier: Tier) => void` - Change handler

**Features:**
- Visual tier comparison
- Feature highlighting
- Pricing display
- Responsive cards

---

#### BookingForm.svelte
Booking summary and form submission.

**Features:**
- Itemized pricing breakdown
- Payment method selection
- Terms and conditions
- Stripe integration
- Confirmation workflow

---

#### Summary.svelte
Booking summary with itemized breakdown.

**Props:**
- `bookingItems: BookingItem[]` - Line items
- `total: number` - Total amount

**Features:**
- Line item display
- Tax calculations
- Discount applications
- Payment breakdown

---

#### StripeCheckout.svelte
Stripe payment integration component.

**Features:**
- Stripe Elements integration
- Payment method collection
- 3D Secure support
- Error handling
- Success confirmation

---

### UI Components

Located in `/lib/components/ui/`:

#### MemorialCard.svelte
Memorial display card for listings.

**Props:**
- `memorial: Memorial` - Memorial data
- `showActions?: boolean` - Action buttons

**Features:**
- Memorial preview
- Service information
- Action buttons (edit, view, delete)
- Responsive layout
- Image handling

---

#### ActionButtons.svelte
Reusable action button group.

**Props:**
- `actions: Action[]` - Button configurations
- `size?: 'sm' | 'md' | 'lg'` - Button size

**Features:**
- Consistent styling
- Icon support
- Loading states
- Disabled states
- Accessibility

---

#### PaymentStatusBadge.svelte
Payment status indicator.

**Props:**
- `status: PaymentStatus` - Payment state
- `amount?: number` - Payment amount

**Features:**
- Color-coded status
- Status text
- Amount display
- Responsive sizing

---

#### LoadingSpinner.svelte
Loading indicator component.

**Props:**
- `size?: 'sm' | 'md' | 'lg'` - Spinner size
- `message?: string` - Loading message

**Features:**
- Animated spinner
- Customizable sizing
- Optional message
- Accessibility labels

---

### Utility Components

#### ErrorBoundary.svelte
Error handling wrapper component.

**Props:**
- `fallback?: Component` - Fallback component

**Features:**
- Error catching
- Error reporting
- Graceful degradation
- Recovery mechanisms

---

#### DevRoleSwitcher.svelte
Development tool for role switching.

**Features:**
- Quick role switching
- Development mode only
- User impersonation
- Testing utilities

---

#### RolePreviewer.svelte
Component for previewing role-based interfaces.

**Features:**
- Role simulation
- UI preview
- Permission testing
- Development aid

---

## Component Communication Patterns

### Props Down, Events Up
Components follow the standard Svelte pattern of passing data down via props and communicating up via events or callback functions.

```typescript
// Parent component
let selectedTier = $state('solo');

// Child component
<TierSelector 
  {selectedTier} 
  onchange={(tier) => selectedTier = tier} 
/>
```

### State Management
Components use Svelte 5 runes for reactive state:

```typescript
// Reactive state
let count = $state(0);

// Derived state
let doubled = $derived(count * 2);

// Side effects
$effect(() => {
  console.log(`Count is now ${count}`);
});
```

### Context API
Shared state is managed through Svelte's context API:

```typescript
// Provider
setContext('user', user);

// Consumer
const user = getContext('user');
```

## Component Testing

### Unit Tests
Components have comprehensive unit tests using Vitest and Testing Library:

```typescript
import { render, screen } from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';
import Calculator from './Calculator.svelte';

describe('Calculator', () => {
  it('renders tier selection', () => {
    render(Calculator, { memorial: mockMemorial });
    expect(screen.getByText('Select Service Tier')).toBeInTheDocument();
  });
});
```

### Integration Tests
End-to-end tests verify component interactions:

```typescript
import { test, expect } from '@playwright/test';

test('livestream control workflow', async ({ page }) => {
  await page.goto('/livestream/memorial123');
  await page.click('[data-testid="start-stream"]');
  await expect(page.locator('[data-testid="stream-status"]')).toContainText('Live');
});
```

## Component Styling

### Tailwind CSS
Components use Tailwind CSS for styling with custom design system:

```html
<div class="bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 
           backdrop-blur-sm border border-white/20 rounded-xl p-6 
           shadow-2xl hover:shadow-purple-500/25 transition-all duration-300">
```

### CSS Custom Properties
Dynamic theming uses CSS custom properties:

```css
:root {
  --primary-color: theme('colors.purple.600');
  --secondary-color: theme('colors.blue.600');
  --accent-color: theme('colors.amber.500');
}
```

### Responsive Design
Components are mobile-first responsive:

```html
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
```

## Performance Optimization

### Lazy Loading
Components implement lazy loading for better performance:

```typescript
import { onMount } from 'svelte';

let component = $state(null);

onMount(async () => {
  const module = await import('./HeavyComponent.svelte');
  component = module.default;
});
```

### Virtual Scrolling
Large lists use virtual scrolling:

```typescript
import { createVirtualizer } from '@tanstack/svelte-virtual';

const virtualizer = createVirtualizer({
  count: items.length,
  getScrollElement: () => scrollElement,
  estimateSize: () => 50
});
```

### Memoization
Expensive computations are memoized:

```typescript
let expensiveValue = $derived.by(() => {
  return heavyComputation(data);
});
```

## Accessibility

### ARIA Labels
Components include proper ARIA attributes:

```html
<button 
  aria-label="Start livestream" 
  aria-describedby="stream-status"
  role="button">
  Start Stream
</button>
```

### Keyboard Navigation
All interactive components support keyboard navigation:

```typescript
function handleKeydown(event) {
  if (event.key === 'Enter' || event.key === ' ') {
    handleClick();
  }
}
```

### Screen Reader Support
Components provide screen reader announcements:

```html
<div aria-live="polite" aria-atomic="true">
  {statusMessage}
</div>
```

---

*For implementation details and integration patterns, see [Integration Flows](./07-integration-flows.md) documentation.*
