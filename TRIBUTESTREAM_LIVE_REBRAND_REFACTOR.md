# Tributestream Live Rebrand Refactor Plan

**Document Version:** 1.0  
**Date:** November 15, 2025  
**Objective:** Transform funeral/memorial-focused platform into "Tributestream Live" - a vibrant events livestreaming platform for birthdays, weddings, and celebrations

---

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [Brand Transformation Overview](#brand-transformation-overview)
3. [Phase 1: Design System & Theme](#phase-1-design-system--theme)
4. [Phase 2: Terminology & Content](#phase-2-terminology--content)
5. [Phase 3: UI/UX Components](#phase-3-uiux-components)
6. [Phase 4: Data Model Updates](#phase-4-data-model-updates)
7. [Phase 5: Marketing Pages](#phase-5-marketing-pages)
8. [Phase 6: User Roles & Workflows](#phase-6-user-roles--workflows)
9. [Phase 7: Testing & Deployment](#phase-7-testing--deployment)
10. [Rollback Strategy](#rollback-strategy)

---

## Executive Summary

### Current State
- **Brand:** Tributestream (funeral/memorial livestreaming)
- **Theme:** Gold (#D5BA7F) and slate gray memorial aesthetic
- **Target Market:** Funeral homes and grieving families
- **Content:** Death-focused, somber tone

### Target State
- **Brand:** Tributestream Live (events livestreaming)
- **Theme:** Blue and white celebration aesthetic
- **Target Market:** Event planners, families celebrating life moments
- **Content:** Celebration-focused, joyful tone

### Impact Assessment
- **Files to Update:** ~102 Svelte components
- **Color References:** ~245 instances of gold color (#D5BA7F)
- **Terminology Changes:** ~1,914 instances of funeral/memorial terms
- **Estimated Effort:** 40-60 hours

---

## Brand Transformation Overview

### Color Palette Change

#### Current (Memorial Theme)
```
Primary: #D5BA7F (Memorial Gold)
Background: #faf8f5 (Warm beige)
Text: Slate 800
Accent: Slate 900
```

#### New (Events Theme)
```
Primary: #3B82F6 (Bright Blue)
Secondary: #60A5FA (Light Blue)
Background: #FFFFFF (Pure White)
Accent: #1E40AF (Deep Blue)
Success: #10B981 (Emerald)
Celebration: #F59E0B (Amber)
```

### Typography
- **Keep:** ABeeZee font (clean and modern, works for celebrations)
- **Update:** Messaging from somber to celebratory

---

## Phase 1: Design System & Theme

**Priority:** HIGH  
**Estimated Time:** 8-12 hours  
**Dependencies:** None

### 1.1 Update Theme Definition

**File:** `frontend/src/lib/design-tokens/minimal-modern-theme.ts`

**Changes:**
```typescript
// Update primary colors
--mm-color-primary: #3B82F6; // Blue
--mm-color-primary-light: #60A5FA;
--mm-color-primary-dark: #1E40AF;
--mm-color-accent: #F59E0B; // Celebration amber
--mm-color-success: #10B981; // Event success

// Update backgrounds
--mm-color-background: #FFFFFF;
--mm-color-background-soft: #F0F9FF; // Blue tint

// Update gradients
bg-gradient-to-b from-blue-50 via-white to-blue-50
```

**Action Items:**
- [ ] Update `MINIMAL_MODERN_THEME` object with blue palette
- [ ] Update `BACKGROUND_PRESETS` with celebration-themed gradients
- [ ] Update `generateMinimalModernCSS()` with new CSS variables
- [ ] Create `EVENTS_THEME` variant alongside minimal theme

### 1.2 Update Global Styles

**Files:**
- `frontend/src/app.css`
- `frontend/src/lib/styles/tribute-theme.css`

**Changes:**
- Replace all `#D5BA7F` with `#3B82F6`
- Update gradient backgrounds to blue/white
- Update shadow colors for lighter aesthetic

### 1.3 Component Theme Updates

**Affected Components:** (~49 files with gold color)

**Priority Files:**
1. `routes/+page.svelte` (Homepage - 29 instances)
2. `lib/components/slideshow/PhotoSlideshowCreator.svelte` (21 instances)
3. `routes/pricing-breakdown/+page.svelte` (21 instances)
4. `routes/for-funeral-directors/+page.svelte` → rename to `/for-event-planners`
5. `lib/components/Navbar.svelte` (9 instances)

**Bulk Replace Strategy:**
```bash
# Search and replace in all Svelte files
Find: #D5BA7F
Replace: #3B82F6

Find: bg-\[#D5BA7F\]
Replace: bg-blue-500

Find: text-\[#D5BA7F\]
Replace: text-blue-500

Find: hover:bg-\[#D5BA7F\]
Replace: hover:bg-blue-600
```

---

## Phase 2: Terminology & Content

**Priority:** HIGH  
**Estimated Time:** 12-16 hours  
**Dependencies:** Phase 1

### 2.1 Global Term Replacements

| Old Term | New Term | Context |
|----------|----------|---------|
| Memorial | Event | All contexts |
| Funeral | Celebration/Event | Service descriptions |
| Funeral Director | Event Planner | User role |
| Funeral Home | Event Venue | Business entity |
| Loved One | Guest of Honor | Person being celebrated |
| Condolence | Message/Wish | User submissions |
| Grief | Celebration | Emotional context |
| Service | Event/Celebration | Occasion |
| Tribute | Celebration Video | Content type |
| Passing | Special Day | Occasion |
| Deceased | Celebrated Person | Person reference |

### 2.2 Database Field Mapping

**Firestore Collections to Update:**

#### `memorials` → `events`
```typescript
// Old structure
{
  lovedOneName: string,
  dateOfBirth: string,
  dateOfPassing: string,
  funeralDirectorId: string
}

// New structure
{
  guestOfHonorName: string,
  eventDate: string,
  eventType: 'birthday' | 'wedding' | 'anniversary' | 'graduation' | 'other',
  eventPlannerId: string
}
```

#### User Roles
```typescript
// Old
role: 'owner' | 'funeral_director' | 'admin' | 'viewer'

// New
role: 'host' | 'event_planner' | 'admin' | 'viewer'
```

### 2.3 Content Updates by Page

#### Homepage (`routes/+page.svelte`)
- **Hero:** "Livestream Life's Special Moments"
- **Subheading:** "Bring everyone together for birthdays, weddings, and celebrations"
- **CTA:** "Start Your Event" / "Plan an Event"

#### Navigation Items
- "For Families" → "For Hosts"
- "For Funeral Directors" → "For Event Planners"
- Update all navigation labels

#### Feature Descriptions
- Update from death-focused to celebration-focused
- Add wedding, birthday, anniversary examples
- Remove funeral home partnerships section

---

## Phase 3: UI/UX Components

**Priority:** MEDIUM  
**Estimated Time:** 10-14 hours  
**Dependencies:** Phase 1, Phase 2

### 3.1 Component Updates

#### Button Styles
**Files:** All components using primary buttons

**Current:**
```svelte
<button class="bg-[#D5BA7F] text-[#070707]">
```

**New:**
```svelte
<button class="bg-blue-500 text-white hover:bg-blue-600">
```

#### Card Components
- Update shadows for lighter aesthetic
- Change border colors from slate to blue tints
- Add celebratory accents

#### Icon Updates
- Replace somber icons (heart, candle) with celebration icons
- Add: Cake, Balloon, Gift, Star, Sparkles
- Update Lucide icon imports

### 3.2 Specific Component Refactors

#### `MemorialCard.svelte` → `EventCard.svelte`
```typescript
// Update props
interface EventCardProps {
  eventName: string;
  eventType: 'birthday' | 'wedding' | 'anniversary' | 'graduation';
  eventDate: Date;
  hostName: string;
  thumbnailUrl?: string;
}
```

#### `CondolenceForm.svelte` → `MessageForm.svelte`
- Update placeholder text
- Change submit button to "Send Wishes"
- Update validation messages

#### `CountdownVideoPlayer.svelte`
- Update styling to blue theme
- Change messaging from memorial to event countdown
- Add celebration-themed overlays

---

## Phase 4: Data Model Updates

**Priority:** HIGH (Critical for backward compatibility)  
**Estimated Time:** 8-10 hours  
**Dependencies:** Phase 2

### 4.1 Database Migration Strategy

#### Option A: Dual Schema Support (Recommended)
```typescript
// Support both old and new field names
interface Event {
  // New fields
  guestOfHonorName?: string;
  eventDate?: string;
  eventType?: EventType;
  
  // Legacy fields (deprecated)
  lovedOneName?: string;
  dateOfPassing?: string;
  
  // Migration flag
  _migrated?: boolean;
}
```

#### Option B: Full Migration
- Create migration script to update all existing data
- Run in maintenance window
- Higher risk, cleaner codebase

**Recommendation:** Start with Option A, migrate to Option B over time

### 4.2 API Endpoint Updates

**Rename Endpoints:**
```
/api/memorials/* → /api/events/*
/api/funeral-director/* → /api/event-planner/*
/api/memorials/[id]/streams → /api/events/[id]/streams
```

**Backward Compatibility:**
- Keep old endpoints as aliases
- Add deprecation warnings
- Set sunset date (6 months)

### 4.3 TypeScript Interface Updates

**Files to Update:**
- `lib/types/memorial.ts` → `lib/types/event.ts`
- `lib/types/user.ts` (role updates)
- `lib/types/calculator.ts` (service → event pricing)

---

## Phase 5: Marketing Pages

**Priority:** HIGH  
**Estimated Time:** 12-16 hours  
**Dependencies:** Phase 1, Phase 2, Phase 3

### 5.1 Homepage Redesign

**File:** `routes/+page.svelte`

**New Structure:**
```
1. Hero Section
   - "Livestream Life's Best Moments"
   - Blue/white gradient background
   - Event type cards (Birthday, Wedding, Anniversary)

2. How It Works
   - For Event Hosts
   - For Event Planners
   - Simple 3-step process

3. Event Types Section (NEW)
   - Birthday Parties
   - Weddings
   - Anniversaries
   - Graduations
   - Corporate Events

4. Features
   - HD Livestreaming
   - Guest Messages
   - Photo Slideshows
   - Recording Archives

5. Pricing
   - Event-based packages
   - Remove funeral-specific tiers

6. Testimonials
   - Celebration-focused reviews
   - Wedding/birthday examples
```

### 5.2 "For Event Planners" Page

**File:** `routes/for-funeral-directors/+page.svelte` → `routes/for-event-planners/+page.svelte`

**Content:**
- How event planners can offer livestreaming
- Partnership opportunities for wedding planners, party planners
- Professional dashboard features
- Pricing for business accounts

### 5.3 "For Hosts" Page

**File:** `routes/for-families/+page.svelte` → `routes/for-hosts/+page.svelte`

**Content:**
- How to livestream your celebration
- Event types supported
- Easy setup process
- Share with distant friends/family

### 5.4 Pricing Page Updates

**File:** `routes/pricing-breakdown/+page.svelte`

**Changes:**
- Remove funeral-specific language
- Update package names:
  - "Solo" → "Personal Event"
  - "Live" → "Pro Celebration"
  - "Legacy" → "Premium Event"
- Add event-specific add-ons (confetti overlay, celebration graphics)

---

## Phase 6: User Roles & Workflows

**Priority:** MEDIUM  
**Estimated Time:** 10-12 hours  
**Dependencies:** Phase 2, Phase 4

### 6.1 Role Updates

#### Funeral Director → Event Planner
**Files:**
- `lib/components/portals/FuneralDirectorPortal.svelte` → `EventPlannerPortal.svelte`
- `routes/register/funeral-director/+page.svelte` → `register/event-planner/+page.svelte`
- All authentication/authorization logic

**Portal Changes:**
- Update dashboard terminology
- Change service management to event management
- Update client lists (families → event hosts)

#### Owner → Host
**Files:**
- `lib/components/portals/OwnerPortal.svelte` → `HostPortal.svelte`
- `lib/components/Profile.svelte`

**Changes:**
- Update memorial creation → event creation
- Change "Create Memorial" to "Create Event"
- Update event management UI

### 6.2 Registration Flows

#### Event Host Registration
- Simplified flow for individual users
- Event type selection
- Date/time selection
- Privacy settings

#### Event Planner Registration
- Professional account setup
- Business verification
- Multi-event management
- Client management tools

### 6.3 Calculator Updates

**File:** `lib/components/calculator/Calculator.svelte`

**Changes:**
- Update service types:
  - "Church Service" → "Main Venue"
  - "Graveside" → "Additional Location"
- Add event-specific services:
  - DJ/Music setup
  - Photo booth coverage
  - Multi-camera setups
- Update pricing structure for events

---

## Phase 7: Testing & Deployment

**Priority:** CRITICAL  
**Estimated Time:** 8-12 hours  
**Dependencies:** All previous phases

### 7.1 Testing Checklist

#### Visual Regression Testing
- [ ] Homepage displays correctly with blue theme
- [ ] All buttons use new blue color scheme
- [ ] Navigation items updated
- [ ] Footer links updated
- [ ] Event cards render properly

#### Functional Testing
- [ ] Event creation workflow
- [ ] Stream management
- [ ] Slideshow creation
- [ ] User registration (all roles)
- [ ] Payment processing
- [ ] Email notifications

#### Database Testing
- [ ] New events use new schema
- [ ] Legacy memorials still load correctly
- [ ] Data migration scripts work
- [ ] API backward compatibility

#### Cross-Browser Testing
- [ ] Chrome/Edge
- [ ] Firefox
- [ ] Safari
- [ ] Mobile browsers

### 7.2 Deployment Strategy

#### Stage 1: Development Environment
- Deploy all changes to dev
- Internal team testing
- Fix critical bugs

#### Stage 2: Staging Environment
- Full deployment to staging
- Beta user testing
- Performance testing
- SEO validation

#### Stage 3: Production (Phased)
- **Week 1:** Theme and visual updates only
- **Week 2:** Terminology updates
- **Week 3:** Data model updates
- **Week 4:** Full rollout

### 7.3 Monitoring

**Metrics to Track:**
- Page load times
- Error rates
- User registration conversions
- Event creation rates
- Stream health
- User feedback

---

## Rollback Strategy

### Quick Rollback (< 1 hour)
If critical issues arise, revert to previous deployment:
```bash
# Vercel rollback
vercel rollback [deployment-url]

# Git revert
git revert [commit-hash]
git push origin main
```

### Partial Rollback
Revert specific phases while keeping others:
- Theme only: Restore old theme file
- Content only: Restore old copy
- Database: Use dual schema support

### Data Rollback
- Firestore data cannot be easily rolled back
- Keep backups before migration
- Use dual schema for safety

---

## File-by-File Refactor Checklist

### Core Theme Files
- [ ] `lib/design-tokens/minimal-modern-theme.ts`
- [ ] `lib/styles/tribute-theme.css`
- [ ] `app.css`

### Navigation & Layout
- [ ] `lib/components/Navbar.svelte`
- [ ] `lib/components/Footer.svelte`
- [ ] `routes/+layout.svelte`

### Marketing Pages
- [ ] `routes/+page.svelte` (Homepage)
- [ ] `routes/for-funeral-directors/+page.svelte` → `/for-event-planners`
- [ ] `routes/for-families/+page.svelte` → `/for-hosts`
- [ ] `routes/pricing-breakdown/+page.svelte`
- [ ] `routes/book-demo/+page.svelte`

### User Portals
- [ ] `lib/components/portals/FuneralDirectorPortal.svelte` → `EventPlannerPortal.svelte`
- [ ] `lib/components/portals/OwnerPortal.svelte` → `HostPortal.svelte`
- [ ] `lib/components/Profile.svelte`

### Event Management
- [ ] `routes/[fullSlug]/+page.svelte`
- [ ] `lib/components/MemorialStreamDisplay.svelte` → `EventStreamDisplay.svelte`
- [ ] `routes/schedule/[memorialId]/+page.svelte`
- [ ] `lib/components/calculator/Calculator.svelte`

### Components (High Priority)
- [ ] `lib/components/minimal-modern/MemorialCard.svelte` → `EventCard.svelte`
- [ ] `lib/components/minimal-modern/CondolenceForm.svelte` → `MessageForm.svelte`
- [ ] `lib/components/CountdownVideoPlayer.svelte`
- [ ] `lib/components/slideshow/PhotoSlideshowCreator.svelte`

### Admin Pages
- [ ] `lib/components/portals/AdminPortal.svelte`
- [ ] `routes/admin/mvp-dashboard/+page.svelte`
- [ ] `routes/admin/services/memorials/+page.svelte`

---

## Success Criteria

### Phase 1 Complete
- [ ] All color references updated to blue theme
- [ ] Theme file generates correct CSS
- [ ] No gold colors visible on any page

### Phase 2 Complete
- [ ] No "funeral" or "memorial" references in user-facing content
- [ ] All roles renamed
- [ ] Database supports both old and new terminology

### Phase 3 Complete
- [ ] All components use new blue styling
- [ ] Celebration-themed icons in use
- [ ] UI feels vibrant and celebratory

### Phase 4 Complete
- [ ] New events use new data model
- [ ] Legacy data still accessible
- [ ] All APIs support new terminology

### Phase 5 Complete
- [ ] Marketing pages reflect events focus
- [ ] SEO optimized for event keywords
- [ ] No funeral references in public pages

### Phase 6 Complete
- [ ] User workflows updated
- [ ] Registration flows work for all roles
- [ ] Calculator supports event pricing

### Phase 7 Complete
- [ ] All tests passing
- [ ] No critical bugs
- [ ] Performance metrics stable
- [ ] Deployed to production

---

## Estimated Timeline

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| Phase 1: Design System | 8-12 hours | None |
| Phase 2: Terminology | 12-16 hours | Phase 1 |
| Phase 3: Components | 10-14 hours | Phase 1, 2 |
| Phase 4: Data Model | 8-10 hours | Phase 2 |
| Phase 5: Marketing | 12-16 hours | Phase 1, 2, 3 |
| Phase 6: Workflows | 10-12 hours | Phase 2, 4 |
| Phase 7: Testing | 8-12 hours | All phases |
| **Total** | **68-92 hours** | **~2-3 weeks** |

---

## Risk Assessment

### High Risk
- **Database migration** - Could break existing memorials
  - *Mitigation:* Use dual schema support
- **SEO impact** - URL changes could hurt rankings
  - *Mitigation:* 301 redirects, sitemap updates

### Medium Risk
- **User confusion** - Existing users may not understand rebrand
  - *Mitigation:* Email announcement, banner notification
- **Broken links** - External links to old URLs
  - *Mitigation:* Maintain redirects indefinitely

### Low Risk
- **Theme updates** - Visual changes are reversible
- **Content updates** - Can be updated incrementally

---

## Next Steps

1. **Review and approve** this refactor plan
2. **Create feature branch:** `feature/tributestream-live-rebrand`
3. **Start with Phase 1:** Design system updates (lowest risk)
4. **Set up staging environment** for testing
5. **Create migration scripts** for database updates
6. **Schedule deployment windows** for each phase

---

## Notes & Considerations

### Brand Transition
- Consider keeping "Tributestream" brand for 6 months with subtitle "Now Streaming Life's Celebrations"
- Gradual transition helps maintain SEO and brand recognition

### Legacy Support
- Keep memorial/funeral functionality available
- Create separate "memorial" subdomain for legacy customers
- Offer migration path for existing funeral home partners

### Event Types to Support
- Birthdays (milestone birthdays: 1st, 16th, 21st, 50th, etc.)
- Weddings (ceremony, reception)
- Anniversaries (milestone anniversaries)
- Graduations (high school, college)
- Corporate events (conferences, product launches)
- Religious events (baptisms, bar/bat mitzvahs)
- Reunions (family, class)
- Retirement parties
- Baby showers

### Market Research
- Survey existing customers about rebrand
- A/B test celebration messaging vs memorial messaging
- Monitor conversion rates during transition

---

**Document prepared for:** Tributestream Development Team  
**Prepared by:** AI Assistant  
**Last updated:** November 15, 2025
