# TributeStream V1 - Pages & Routes Inventory

## Public Routes

### `/` (Homepage)
**File**: `/src/routes/+page.svelte`
- Landing page with hero section and CTAs
- Public access, no authentication required

### `/[fullSlug]` (Memorial Pages)
**File**: `/src/routes/[fullSlug]/+page.svelte`
- Public memorial viewing with livestream/archive playback
- Service details, photos, videos
- Memorial following functionality

### `/contact`, `/for-families`, `/for-funeral-directors`
- Information and contact pages
- Public access

## Authentication Routes

### `/login`
**File**: `/src/routes/login/+page.svelte`
- Email/password + Google OAuth
- Password reset functionality
- Role-based redirection after login

### `/logout`, `/clear-session`
- Session termination and cleanup

## Registration Routes

### `/register/family`
- Family memorial registration with auto-save

### `/register/funeral-director`
- Funeral director memorial creation for families

### `/register/funeral-home`
- Funeral director business registration (V1: auto-approved)

### `/register/loved-one`
- Alternative family registration endpoint

## User Management Routes

### `/profile`
**File**: `/src/routes/profile/+page.svelte`
- Role-specific portal rendering
- Modern glassmorphism UI design
- Memorial management and account settings

### `/my-portal`
- Portal redirect handler (owners/FDs → `/profile`, admins → `/admin`)

## Memorial Management Routes

### `/schedule/[memorialId]`
- Service scheduling and livestream calculator
- Pricing calculations with auto-save
- Payment integration

### `/livestream/[memorialId]`
- Livestream control center
- Archive management (2/3 layout) + stream controls (1/3)
- Multi-service streaming with visibility toggles

## Payment Routes

### `/payment/success`, `/payment/cancel`, `/payment/[memorialId]`
- Payment flow pages with Stripe integration

## Admin Routes

### `/admin`
- Admin dashboard with system stats
- User and memorial management
- Admin role required

### `/admin/users`, `/admin/memorials`, `/admin-test`
- Specific admin management interfaces

## Development Routes

### `/app`, `/auth`, `/search`
- Development and testing utilities

## Route Protection

### Server-Side Protection
```typescript
export async function load({ params, locals }) {
  if (!locals.user) throw redirect(302, '/login');
  await requireEditAccess(params.memorialId, locals);
  return { memorial, livestreamConfig };
}
```

### Access Levels
- **requireViewAccess**: Basic memorial viewing
- **requireEditAccess**: Memorial editing permissions  
- **requireLivestreamAccess**: Livestream control permissions

### Role-Based Redirects
- Admin → `/admin`
- Funeral Director → `/profile`
- Owner → `/profile`
