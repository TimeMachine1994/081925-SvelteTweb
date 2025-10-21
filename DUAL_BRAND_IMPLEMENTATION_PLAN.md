# TributeStream Dual Brand Implementation Plan

## Overview

Transform the existing TributeStream website into a dual-brand platform with:
- **TributeStream Legacy**: Memorial and funeral services (current focus)
- **TributeStream Live**: Living celebrations and fun events (new market)

## Goals

### Primary Objectives
1. **Market Expansion**: Tap into the living events market (birthdays, graduations, celebrations)
2. **Brand Differentiation**: Clear separation between memorial services and celebratory events
3. **User Experience**: Seamless brand selection and navigation
4. **Technical Efficiency**: Single codebase with shared infrastructure

### Success Metrics
- Increased user acquisition from living events market
- Clear brand recognition and user flow completion
- Maintained performance and SEO rankings
- Reduced development and maintenance overhead

## Current State Analysis

### Existing Architecture
- **Framework**: SvelteKit with file-based routing
- **Theme System**: Role-based theming (gold/black color scheme)
- **Authentication**: Firebase Auth with role management
- **Database**: Firestore with memorial-focused data models
- **Payments**: Stripe integration for memorial services
- **Streaming**: Cloudflare Stream with RTMP/WHIP support

### Current Page Structure
```
/                          → Homepage (memorial-focused)
/for-families             → Family landing page
/for-funeral-directors    → Funeral director landing page
/register/loved-one       → Memorial creation
/register/funeral-director → FD registration
/admin                    → Admin portal
/profile                  → User dashboard
/[fullSlug]               → Individual memorials
/blog                     → Content marketing
```

## Implementation Strategy

### Approach: Route-Based Dual Branding
**Chosen over subdomain approach for:**
- Single codebase maintenance
- Shared infrastructure and costs
- Unified analytics and user management
- SEO benefits under single domain
- Faster development and deployment

## Phase 1: Foundation Setup

### 1.1 Brand Selection Splash Page
**Timeline**: Week 1
**Files to Create/Modify**:
- `/frontend/src/routes/+page.svelte` → Brand selection page
- `/frontend/src/routes/legacy/+layout.svelte` → Legacy brand layout
- `/frontend/src/routes/live/+layout.svelte` → Live brand layout

**Features**:
- Clean brand selection interface
- "TributeStream Legacy" vs "TributeStream Live" options
- Brand preference persistence (localStorage)
- Routing to appropriate brand experience

### 1.2 Route Structure Implementation
**Timeline**: Week 1-2
**New Route Structure**:
```
/                          → Brand selection splash
/legacy/                   → Legacy homepage (current memorial focus)
/legacy/for-families       → Legacy family landing
/legacy/for-funeral-directors → Legacy FD landing
/legacy/register/loved-one → Memorial creation
/legacy/[fullSlug]         → Memorial pages
/live/                     → Live homepage (celebration focus)
/live/for-families         → Live family landing
/live/for-hosts           → Event host landing (replaces FD)
/live/register/event      → Event creation
/live/[fullSlug]          → Event pages
```

### 1.3 Theme System Extension
**Timeline**: Week 2
**Files to Modify**:
- `/frontend/src/lib/styles/tribute-theme.css`
- `/frontend/src/lib/design-tokens/minimal-modern-theme.ts`

**New Theme Variables**:
```css
/* Legacy Theme (Current) */
.theme-legacy {
  --theme-primary: #d5ba7f;    /* Gold */
  --theme-secondary: #c5aa6f;
  --theme-accent: #e5ca8f;
  --theme-mood: memorial;
}

/* Live Theme (New) */
.theme-live {
  --theme-primary: #10b981;    /* Emerald Green */
  --theme-secondary: #059669;
  --theme-accent: #34d399;
  --theme-mood: celebration;
}
```

## Phase 2: Content Differentiation

### 2.1 Homepage Variations
**Timeline**: Week 3
**Legacy Homepage** (`/legacy/`):
- Hero: "Honor Your Loved One's Memory"
- Focus: Memorial services, funeral streaming
- CTAs: "Create Memorial", "For Funeral Directors"
- Testimonials: Funeral and memorial experiences

**Live Homepage** (`/live/`):
- Hero: "Celebrate Life's Special Moments"
- Focus: Birthday parties, graduations, celebrations
- CTAs: "Plan Your Event", "For Event Hosts"
- Testimonials: Celebration and party experiences

### 2.2 Landing Page Adaptations
**Timeline**: Week 3-4

**Legacy Pages**:
- `/legacy/for-families` → Memorial creation focus
- `/legacy/for-funeral-directors` → Professional funeral services

**Live Pages**:
- `/live/for-families` → Event planning focus
- `/live/for-hosts` → Event hosting services (party planners, venues)

### 2.3 Registration Flow Updates
**Timeline**: Week 4

**Legacy Registration**:
- `/legacy/register/loved-one` → Memorial creation (existing)
- Form fields: Deceased name, memorial details, funeral info

**Live Registration**:
- `/live/register/event` → Event creation (new)
- Form fields: Event name, celebration details, host info

## Phase 3: Data Model Extensions

### 3.1 Database Schema Updates
**Timeline**: Week 5
**Collections to Extend**:

**Memorials Collection** (existing):
```typescript
interface Memorial {
  // Existing fields...
  brandType: 'legacy' | 'live';
  eventType?: 'memorial' | 'birthday' | 'graduation' | 'anniversary' | 'celebration';
  // Legacy-specific fields
  deathDate?: string;
  birthDate?: string;
  // Live-specific fields
  celebrationDate?: string;
  eventDate?: string;
}
```

**Users Collection** (existing):
```typescript
interface User {
  // Existing fields...
  preferredBrand?: 'legacy' | 'live';
  // Role adaptations
  role: 'owner' | 'funeral_director' | 'event_host' | 'admin' | 'viewer';
}
```

### 3.2 API Endpoint Updates
**Timeline**: Week 5-6
**Endpoints to Modify**:
- `/api/memorial/create` → Support brand type
- `/api/streams/create` → Support event types
- `/api/user/profile` → Brand preferences

## Phase 4: Component Adaptations

### 4.1 Navigation Updates
**Timeline**: Week 6
**Files to Modify**:
- `/frontend/src/lib/components/Navbar.svelte`

**Brand-Aware Navigation**:
- Detect current brand context
- Show appropriate navigation items
- Brand-specific portal links

### 4.2 Form Component Updates
**Timeline**: Week 6-7
**Components to Adapt**:
- Memorial creation forms → Event creation forms
- Calculator component → Event planning calculator
- Stream management → Event streaming management

### 4.3 Email Template Variations
**Timeline**: Week 7
**Templates to Create**:
- Event registration emails
- Event invitation emails
- Host notification emails

## Phase 5: Testing & Optimization

### 5.1 User Experience Testing
**Timeline**: Week 8
**Test Scenarios**:
- Brand selection flow
- Cross-brand navigation
- Registration completions
- Stream functionality for both brands

### 5.2 SEO Optimization
**Timeline**: Week 8-9
**Tasks**:
- Update meta tags for brand-specific pages
- Create separate sitemaps for each brand
- Optimize content for different search terms
- Set up Google Analytics goals for each brand

### 5.3 Performance Testing
**Timeline**: Week 9
**Metrics to Monitor**:
- Page load times
- Bundle size impact
- Database query performance
- Stream quality consistency

## Phase 6: Launch & Marketing

### 6.1 Soft Launch
**Timeline**: Week 10
**Activities**:
- Deploy to staging environment
- Internal team testing
- Beta user feedback collection
- Bug fixes and optimizations

### 6.2 Marketing Material Updates
**Timeline**: Week 10-11
**Deliverables**:
- Brand-specific marketing pages
- Updated social media profiles
- Email campaign templates
- Sales collateral for both brands

### 6.3 Full Launch
**Timeline**: Week 12
**Go-Live Checklist**:
- Production deployment
- DNS and domain configuration
- Analytics tracking verification
- Customer support training
- Launch announcement campaigns

## Technical Implementation Details

### File Structure Changes
```
frontend/src/routes/
├── +page.svelte                 → Brand selection splash
├── legacy/
│   ├── +layout.svelte          → Legacy brand layout
│   ├── +page.svelte            → Legacy homepage
│   ├── for-families/
│   ├── for-funeral-directors/
│   ├── register/
│   └── [fullSlug]/             → Memorial pages
├── live/
│   ├── +layout.svelte          → Live brand layout
│   ├── +page.svelte            → Live homepage
│   ├── for-families/
│   ├── for-hosts/
│   ├── register/
│   └── [fullSlug]/             → Event pages
└── api/                        → Shared API endpoints
```

### Brand Context Management
```typescript
// Brand context store
export const brandContext = writable<'legacy' | 'live'>('legacy');

// Brand detection utility
export function detectBrand(pathname: string): 'legacy' | 'live' {
  if (pathname.startsWith('/live')) return 'live';
  if (pathname.startsWith('/legacy')) return 'legacy';
  return 'legacy'; // default
}

// Theme application
export function applyBrandTheme(brand: 'legacy' | 'live') {
  document.documentElement.className = `theme-${brand}`;
}
```

## Risk Mitigation

### Technical Risks
1. **SEO Impact**: Implement proper redirects and canonical URLs
2. **Performance**: Monitor bundle size and implement code splitting
3. **User Confusion**: Clear brand indicators and consistent navigation
4. **Data Integrity**: Comprehensive testing of shared database operations

### Business Risks
1. **Brand Dilution**: Maintain clear brand separation and messaging
2. **Market Confusion**: Distinct value propositions for each brand
3. **Resource Allocation**: Prioritize core memorial business during transition

## Success Criteria

### Technical Metrics
- [ ] Zero downtime during deployment
- [ ] Page load times under 3 seconds
- [ ] 100% feature parity between brands where applicable
- [ ] Mobile responsiveness across all new pages

### Business Metrics
- [ ] 25% increase in new user registrations within 3 months
- [ ] 15% of new users choosing "Live" brand
- [ ] Maintained customer satisfaction scores
- [ ] 10% increase in overall revenue within 6 months

## Next Immediate Steps

### Week 1 Priority Tasks
1. **Create brand selection splash page** at root route
2. **Set up basic route structure** with `/legacy/` and `/live/` prefixes
3. **Implement theme switching** mechanism
4. **Create brand detection utilities**
5. **Test basic navigation flow**

### Development Environment Setup
1. Create feature branch: `feature/dual-brand-implementation`
2. Set up staging environment for testing
3. Configure analytics for both brand paths
4. Prepare rollback strategy

## Resources Required

### Development Team
- 1 Full-stack developer (primary)
- 1 UI/UX designer (part-time)
- 1 QA tester (part-time)

### Timeline
- **Total Duration**: 12 weeks
- **MVP Launch**: Week 8 (soft launch)
- **Full Launch**: Week 12

### Budget Considerations
- No additional hosting costs (same infrastructure)
- Minimal additional third-party service costs
- Marketing budget for dual-brand launch campaigns

---

**Document Status**: Draft v1.0  
**Last Updated**: October 21, 2025  
**Next Review**: Weekly during implementation  
**Owner**: Development Team
