# TributeStream V1 - Component Inventory

## Overview
This document provides a comprehensive inventory of all Svelte components in TributeStream V1, organized by category with detailed specifications for each component.

## Component Architecture

### Design Patterns
- **Composition Over Inheritance**: Components built from smaller, focused components
- **Props-Down, Events-Up**: Clear data flow patterns
- **Role-Based Rendering**: Conditional UI based on user permissions
- **Type Safety**: Full TypeScript support with typed props
- **Reactive State**: Svelte 5 runes ($state, $derived, $effect)
- **Accessibility**: ARIA labels and keyboard navigation support

## Core Layout Components

### `+layout.svelte`
**Location**: `/src/routes/+layout.svelte`
**Purpose**: Main application layout wrapper

#### Features
- Global user state management via Svelte 5 runes
- Conditional styling for different page types (calculator, homepage)
- Integration of navbar, footer, and dev tools
- Responsive design with max-width constraints

#### Props
```typescript
{ children: Snippet; data: LayoutData }
```

#### Key Functionality
- User state synchronization with server data
- Page-specific styling classes
- Global component orchestration

### `Navbar.svelte`
**Location**: `/src/lib/components/Navbar.svelte`
**Purpose**: Primary navigation component

#### Features
- Role-based navigation menu items
- Gold/black theme implementation (correct theme)
- Responsive design with mobile considerations
- Dynamic CTA button based on authentication state

#### State Management
```typescript
// Uses Svelte 5 runes for reactive state
let user = $state(null);
```

#### Navigation Logic
- Authenticated users: Role-specific portal links
- Unauthenticated users: Login link
- Admin users: Direct admin portal access

### `Footer.svelte`
**Location**: `/src/lib/components/Footer.svelte`
**Purpose**: Application footer with links and information

### `DevRoleSwitcher.svelte`
**Location**: `/src/lib/components/DevRoleSwitcher.svelte`
**Purpose**: Development utility for role testing

#### Features
- Switch between user roles in development
- Test account integration
- Firebase emulator compatibility

## Authentication Components

### `Login.svelte`
**Location**: `/src/lib/components/Login.svelte`
**Purpose**: User authentication interface

#### Features
- Email/password authentication via Firebase Auth
- Google OAuth integration (signInWithPopup)
- Password reset functionality
- Session cookie creation via `/api/session`
- Loading states and error handling
- Show/hide password toggle

#### State Management
```typescript
let email = $state('');
let password = $state('');
let error: string | null = $state(null);
let loading = $state(false);
let showPassword = $state(false);
```

#### Key Functions
- `handleSubmit()`: Email/password login
- `handleGoogleLogin()`: Google OAuth
- `handlePasswordReset()`: Password reset email
- `createSession()`: Server-side session creation

### `Register.svelte`
**Location**: `/src/lib/components/Register.svelte`
**Purpose**: User registration interface

#### Features
- New user account creation
- Role assignment during registration
- Form validation and error handling

### `Profile.svelte`
**Location**: `/src/lib/components/Profile.svelte`
**Purpose**: User profile management

#### Features
- Role-based profile display
- Memorial management integration
- Schedule modal for memorial services
- Profile editing capabilities
- Role-specific UI rendering with different themes

#### Role Information
```typescript
function getRoleInfo(role: string) {
  switch (role) {
    case 'admin':
      return {
        title: 'Admin',
        icon: Crown,
        gradient: 'from-red-600 via-pink-600 to-purple-600',
        bgGradient: 'from-red-50 to-pink-50',
        accentColor: 'red'
      };
    case 'funeral_director':
      return {
        title: 'Funeral Director',
        icon: Building2,
        gradient: 'from-yellow-600 via-amber-600 to-orange-600',
        bgGradient: 'from-yellow-50 to-amber-50',
        accentColor: 'amber'
      };
    case 'owner':
      return {
        title: 'Memorial Owner',
        icon: Heart,
        gradient: 'from-blue-600 via-purple-600 to-indigo-600',
        bgGradient: 'from-blue-50 to-purple-50',
        accentColor: 'blue'
      };
  }
}
```

## Portal Components (Role-Based Dashboards)

### `AdminPortal.svelte`
**Location**: `/src/lib/components/portals/AdminPortal.svelte`
**Purpose**: Administrator dashboard

#### Features
- User management with memorial counts
- System statistics dashboard
- Funeral director approval (V1: auto-approved)
- Memorial creation and management
- Comprehensive audit log viewer with filtering

#### Tab Structure
- Overview: System statistics and quick actions
- Funeral Directors: FD management and approval
- Memorials: Memorial oversight and creation
- Create Memorial: Admin memorial creation form
- Audit Logs: Security and action monitoring

#### Audit Log Features
```typescript
let auditFilters = $state({
  action: '',
  userEmail: '',
  resourceType: '',
  dateFrom: '',
  dateTo: '',
  limit: 50
});
```

### `FuneralDirectorPortal.svelte`
**Location**: `/src/lib/components/portals/FuneralDirectorPortal.svelte`
**Purpose**: Funeral director dashboard

#### Features
- Assigned memorial management
- Family support tools
- Memorial creation for families
- Livestream control for assigned memorials
- Quick statistics dashboard

#### Dashboard Stats
- Active memorials count
- Family members count
- Livestream sessions
- Recent activity

### `OwnerPortal.svelte`
**Location**: `/src/lib/components/portals/OwnerPortal.svelte`
**Purpose**: Memorial owner dashboard

#### Features
- Owned memorial management
- Memorial content editing
- Family member invitation (V1: simplified)
- Memorial settings configuration

### `ViewerPortal.svelte`
**Location**: `/src/lib/components/portals/ViewerPortal.svelte`
**Purpose**: Memorial viewing interface

#### Features
- Public memorial viewing
- Memorial content display
- Livestream viewing
- Memorial following functionality

### Simplified Portals (V1)
- **`FamilyMemberPortal.svelte`**: Simplified for V1
- **`RemoteProducerPortal.svelte`**: Placeholder component
- **`OnsiteVideographerPortal.svelte`**: Placeholder component

## Calculator & Booking Components

### `Calculator.svelte`
**Location**: `/src/lib/components/calculator/Calculator.svelte`
**Purpose**: Main livestream service calculator

#### Features
- Service tier selection (Solo, Live, Legacy)
- Memorial.services data integration (loads from server)
- Location and time configuration (writes to Memorial)
- Add-on service selection
- Real-time pricing calculation
- Auto-save functionality with comprehensive logging
- Form validation and error handling
- Svelte 5 runes for reactive state management
- Debug logging for data flow troubleshooting

#### State Management (Svelte 5 Runes - CURRENT)
```typescript
// Memorial data loaded from server-side page load
let memorial = $state(null);
let memorialId = $state('');

// Calculator configuration (booking-specific data)
let calculatorData = $state({
  selectedTier: null,
  addons: {
    photography: false,
    audioVisualSupport: false,
    liveMusician: false,
    woodenUsbDrives: 0
  }
});

// Service details (authoritative source: Memorial.services)
let services = $state({
  main: {
    location: { name: '', address: '', isUnknown: false },
    time: { date: null, time: null, isUnknown: false },
    hours: 2
  },
  additional: [] // AdditionalServiceDetails[]
});

// Auto-save integration
let autoSaveEnabled = $state(true);

// Reactive pricing calculation
let bookingItems = $derived.by(() => {
  // Pricing logic based on services and calculatorData
  return calculateBookingItems(services, calculatorData);
});
```

### `TierSelector.svelte`
**Location**: `/src/lib/components/calculator/TierSelector.svelte`
**Purpose**: Service tier selection interface

#### Tiers
- **Solo**: Basic memorial service
- **Live**: Livestream-enabled service
- **Legacy**: Premium service with additional features

### `BookingForm.svelte`
**Location**: `/src/lib/components/calculator/BookingForm.svelte`
**Purpose**: Service booking form with detailed configuration

#### Features
- Service location configuration
- Date and time selection
- Duration specification
- Additional service options
- Contact information collection

### `Summary.svelte`
**Location**: `/src/lib/components/calculator/Summary.svelte`
**Purpose**: Booking summary and pricing display

#### Features
- Itemized pricing breakdown
- Service summary
- Total cost calculation
- Booking confirmation details

### `StripeCheckout.svelte`
**Location**: `/src/lib/components/calculator/StripeCheckout.svelte`
**Purpose**: Stripe payment integration

#### Features
- Stripe Elements integration
- Payment intent creation
- Payment processing
- Error handling and success states

## Livestream Components

### `LivestreamControl.svelte`
**Location**: `/src/lib/components/LivestreamControl.svelte`
**Purpose**: Livestream start/stop controls

#### Features
- Stream session management
- Real-time status monitoring
- Stream quality controls
- Viewer count display
- Recording controls

### `LivestreamManager.svelte`
**Location**: `/src/lib/components/LivestreamManager.svelte`
**Purpose**: Comprehensive livestream management

#### Features
- Stream configuration
- Multiple stream session support
- Analytics and monitoring
- Stream scheduling
- Access control management

### `FakeVideoPlayer.svelte`
**Location**: `/src/lib/components/FakeVideoPlayer.svelte`
**Purpose**: Development video player placeholder

#### Features
- Mock video player for development
- Testing interface for livestream features

## UI Components

### `ActionButton.svelte`
**Location**: `/src/lib/components/ui/ActionButton.svelte`
**Purpose**: Reusable action button component

#### Props
```typescript
{
  variant: 'primary' | 'secondary' | 'danger';
  size: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
}
```

### `ActionButtons.svelte`
**Location**: `/src/lib/components/ui/ActionButtons.svelte`
**Purpose**: Button group component

#### Features
- Multiple button layout
- Consistent spacing and alignment
- Role-based button visibility

### `LivestreamScheduleTable.svelte`
**Location**: `/src/lib/components/ui/LivestreamScheduleTable.svelte`
**Purpose**: Schedule display table

#### Features
- Tabular schedule display
- Sorting and filtering
- Status indicators
- Action buttons for each row

### `MemorialCard.svelte`
**Location**: `/src/lib/components/ui/MemorialCard.svelte`
**Purpose**: Memorial preview card

#### Features
- Memorial thumbnail display
- Key information summary
- Action buttons (view, edit)
- Status indicators

### `MemorialSelector.svelte`
**Location**: `/src/lib/components/ui/MemorialSelector.svelte`
**Purpose**: Memorial selection dropdown

#### Features
- Searchable memorial list
- Role-based filtering
- Quick selection interface

### Payment Components

#### `PayNowButton.svelte`
**Location**: `/src/lib/components/ui/PayNowButton.svelte`
**Purpose**: Payment action button

#### `PaymentStatusBadge.svelte`
**Location**: `/src/lib/components/ui/PaymentStatusBadge.svelte`
**Purpose**: Payment status indicator

#### `PaymentWarningBanner.svelte`
**Location**: `/src/lib/components/ui/PaymentWarningBanner.svelte`
**Purpose**: Payment warning display

## Utility Components

### `LoadingSpinner.svelte`
**Location**: `/src/lib/components/LoadingSpinner.svelte`
**Purpose**: Loading state indicator

#### Features
- Customizable size and color
- Smooth animation
- Accessibility support

### `ErrorBoundary.svelte`
**Location**: `/src/lib/components/ErrorBoundary.svelte`
**Purpose**: Error handling wrapper

#### Features
- Graceful error handling
- Error reporting
- Fallback UI display
- Recovery mechanisms

### `LiveUrlPreview.svelte`
**Location**: `/src/lib/components/LiveUrlPreview.svelte`
**Purpose**: Memorial URL preview

#### Features
- Real-time URL generation
- Copy to clipboard functionality
- QR code generation (when implemented)
- Social sharing preparation

### `MemorialFollowButton.svelte`
**Location**: `/src/lib/components/MemorialFollowButton.svelte`
**Purpose**: Memorial following functionality

#### Features
- Follow/unfollow toggle
- Follower count display
- Authentication requirement
- Optimistic updates

### `RolePreviewer.svelte`
**Location**: `/src/lib/components/RolePreviewer.svelte`
**Purpose**: Role-based preview utility

#### Features
- Preview components as different roles
- Development and testing utility
- Permission simulation

## Page Components

### Homepage
**Location**: `/src/routes/+page.svelte`
**Purpose**: Landing page

#### Features
- Hero section with value proposition
- Service overview
- Call-to-action buttons
- Responsive design

### Portal Pages

#### `/admin/+page.svelte`
**Purpose**: Admin portal page
**Features**: AdminPortal component integration

#### `/login/+page.svelte`
**Purpose**: Login page
**Features**: Login component with branding

#### `/profile/+page.svelte`
**Purpose**: Profile management page
**Features**: Profile component with role-specific features

#### `/my-portal/+page.svelte`
**Purpose**: User dashboard page
**Features**: Role-based portal routing

### Service Pages

#### `/payment/+page.svelte`
**Purpose**: Payment processing page
**Features**: Stripe checkout integration

#### `/schedule/+page.svelte`
**Purpose**: Schedule management page
**Features**: Calendar and booking interface

#### `/search/+page.svelte`
**Purpose**: Memorial search page
**Features**: Algolia search integration

### Information Pages

#### `/contact/+page.svelte`
**Purpose**: Contact form page
**Features**: Contact form with validation

#### `/for-families/+page.svelte`
**Purpose**: Family information page
**Features**: Service explanation for families

#### `/for-funeral-directors/+page.svelte`
**Purpose**: FD information page
**Features**: Service explanation for funeral directors

## Component Testing

### Test Coverage
- **Unit Tests**: Component logic testing
- **Integration Tests**: Component interaction testing
- **Visual Tests**: UI regression testing
- **Accessibility Tests**: ARIA and keyboard navigation

### Test Files
```
AdminPortal.test.ts
DevRoleSwitcher.test.ts
Login.test.ts
Profile.test.ts
Calculator.test.ts
Calculator.simple.test.ts
OwnerPortal.test.ts
```

## Theme & Styling

### Theme System
The application uses a consistent gold/black theme throughout:

#### Primary Theme (Gold/Black)
- **Primary Gold**: `#D5BA7F`
- **Primary Black**: `#1a1a1a` 
- **White**: `#ffffff`
- **Used in**: All components, forms, navigation, and UI elements

#### Role-Based Accent Colors
- **Admin**: Red/Pink gradient (`from-red-600 via-pink-600 to-purple-600`)
- **Funeral Director**: Yellow/Amber gradient (`from-yellow-600 via-amber-600 to-orange-600`)
- **Owner**: Blue/Purple gradient (`from-blue-600 via-purple-600 to-indigo-600`)

#### Modern UI Features
- **Glassmorphism**: Frosted glass effects with backdrop blur
- **Gradients**: Smooth color transitions
- **Animations**: Fade-in-up animations with staggered delays
- **3D Effects**: Shadows and depth for modern appearance

### Component Styling Patterns
- **Tailwind CSS**: Utility-first styling approach
- **Responsive Design**: Mobile-first responsive patterns
- **Role-Based Theming**: Different colors for different roles
- **Consistent Spacing**: Standardized spacing scale

## Performance Considerations

### Optimization Strategies
- **Code Splitting**: Route-based component loading
- **Lazy Loading**: On-demand component imports
- **State Management**: Efficient Svelte 5 runes reactive updates
- **Bundle Size**: Tree-shaking and dead code elimination

### Component Optimization
- **Prop Drilling**: Minimized through composition
- **Re-rendering**: Optimized with Svelte's reactivity
- **Memory Usage**: Proper cleanup in component lifecycle
- **Event Handling**: Efficient event delegation

## Migration Recommendations

### High Priority Components
1. **Authentication Components**: Core functionality
2. **Portal Components**: Role-specific dashboards
3. **Calculator Components**: Revenue-generating features
4. **Livestream Components**: Core service delivery

### Medium Priority Components
1. **UI Components**: User experience enhancement
2. **Payment Components**: Transaction processing
3. **Navigation Components**: User flow optimization

### Low Priority Components
1. **Development Utilities**: Internal tooling
2. **Admin Tools**: Administrative features
3. **Testing Components**: Quality assurance tools

This component inventory provides a comprehensive view of the TributeStream V1 frontend architecture, enabling informed decisions about maintenance, enhancement, and migration strategies.
