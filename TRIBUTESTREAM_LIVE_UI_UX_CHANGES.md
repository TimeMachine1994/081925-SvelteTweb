# Tributestream Live - UI/UX Transformation

**Date**: November 4, 2025  
**Status**: Planning Phase

## Overview

This document outlines the user interface and user experience changes required to transform from memorial-focused to life events platform.

---

## 1. Branding & Visual Identity

### Color Palette Evolution

**Current Memorial Aesthetic:**
- Gold accent: #D5BA7F (keep, but adjust usage)
- Dark, somber tones
- Muted backgrounds
- Respectful, subdued design

**New Life Events Aesthetic:**
- **Primary Gold**: #D5BA7F (signature color - keep)
- **Secondary Vibrant**: Add celebratory accent colors
  - Wedding: Soft rose #F4C2C2
  - Birthday: Bright coral #FF6B6B
  - Graduation: Royal blue #4A90E2
  - Fundraiser: Green #4CAF50
  - Memorial: Keep current gold/gray (respectful)
- **Neutral Base**: Clean whites, light grays
- **Typography**: ABeeZee (keep - professional yet approachable)

### Logo & Brand Name

**Current:** "Tributestream" or "TributeStream"  
**New:** "Tributestream Live"

- Add "Live" to emphasize livestreaming focus
- Consider icon update: Blend video play button with heart/celebration
- Tagline options:
  - "Your moments. Live. Forever."
  - "Stream life's important moments"
  - "Celebrate together, wherever you are"

---

## 2. Navigation & Site Structure

### Current Navigation
```
For Families | For Funeral Directors | Blog | Contact
```

### New Navigation
```
Events | Browse | For Professionals | Pricing | Blog
```

**Updated Menu Items:**
- **Events** (dropdown)
  - Create New Event
  - My Events Library
  - Browse Public Events
  - Event Types (sub-menu with all categories)
  
- **Browse**
  - Discover Events
  - Find Professionals
  - Community Fundraisers

- **For Professionals**
  - Join as Streamer
  - Professional Dashboard
  - Pricing & Packages
  - Resources & Training

- **Pricing**
  - DIY Streaming Plans
  - Professional Services
  - Fundraising Fees

---

## 3. Homepage Transformation

### Current Homepage Structure
```
Hero: "Beautiful, reliable memorial livestreams"
↓
Social Proof (testimonials)
↓
How It Works (Families/Directors tabs)
↓
Packages & Pricing
↓
FAQ
```

### New Homepage Structure
```
Hero: "Stream Life's Important Moments"
↓
Event Types Showcase (visual cards)
↓
How It Works (DIY/Professional paths)
↓
Recent Public Events (carousel)
↓
Success Stories (multi-category testimonials)
↓
Fundraising Impact Section
↓
Pricing Overview
↓
FAQ
```

### Hero Section Redesign

**New Hero:**
```html
Headline: "Your Personal Livestream Library"
Subheadline: "Celebrate, share, and support the moments that matter"

[Visual: Split-screen or carousel showing:]
- Wedding ceremony streaming
- Birthday party with family on screens
- Graduation celebration
- Community fundraiser
- Memorial service (still included)

CTAs:
[Create Your Event] (Primary - gold)
[Browse Events] (Secondary)
[Find a Professional] (Tertiary link)
```

**Trust Indicators:**
- "1000+ Events Streamed"
- "99.9% Uptime Guarantee"
- "Stream from Your Phone"
- "$XXX Raised for Causes"

---

## 4. Event Types Showcase

### Visual Card Grid (Homepage)

```
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│  💒 Wedding │ │ 🎂 Birthday │ │ 🎓 Graduation│
│             │ │             │ │             │
│ Stream your │ │ Celebrate   │ │ Share the   │
│ special day │ │ with family │ │ achievement │
└─────────────┘ └─────────────┘ └─────────────┘

┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│💝 Fundraiser│ │🕊️ Memorial  │ │ 🏆 Events   │
│             │ │             │ │             │
│ Raise money │ │ Honor loved │ │ Community & │
│ for causes  │ │ ones        │ │ more        │
└─────────────┘ └─────────────┘ └─────────────┘
```

**Each card includes:**
- Event type icon and name
- Brief description
- "Learn More" link
- Example use cases

---

## 5. Event Creation Flow

### Current Flow (Memorial)
```
1. Register → "Create Memorial for Loved One"
2. Enter loved one's name
3. Private by default
4. Go to calculator for service scheduling
```

### New Flow (Universal Event)

**Step 1: Event Type Selection**
```
┌──────────────────────────────────────┐
│  What are you celebrating?           │
│                                      │
│  [Choose Event Type]                 │
│  ○ Wedding                           │
│  ○ Birthday Party                    │
│  ○ Graduation                        │
│  ○ Memorial Service                  │
│  ○ Fundraiser                        │
│  ○ Other ___________                 │
└──────────────────────────────────────┘
```

**Step 2: Event Details**
```
┌──────────────────────────────────────┐
│  Event Name: [Jane's 50th Birthday] │
│                                      │
│  Date: [MM/DD/YYYY] Time: [HH:MM]   │
│                                      │
│  Location: [Virtual/Physical/Both]  │
│  └─ [Optional address fields]        │
│                                      │
│  Description:                        │
│  [Text area for event details]       │
│                                      │
│  Cover Image: [Upload]               │
└──────────────────────────────────────┘
```

**Step 3: Streaming Options**
```
┌──────────────────────────────────────┐
│  How will you stream?                │
│                                      │
│  ○ Stream from my phone (DIY)       │
│     └─ Free to start, $XX/hour      │
│                                      │
│  ○ Hire a professional              │
│     └─ Starting at $XXX             │
│     └─ [Browse Professionals]       │
│                                      │
│  ⊙ Decide later                     │
└──────────────────────────────────────┘
```

**Step 4: Privacy & Fundraising**
```
┌──────────────────────────────────────┐
│  Privacy Settings                    │
│  ○ Public (anyone can watch)        │
│  ○ Private (invite only)            │
│  ○ Password protected               │
│                                      │
│  ☑ Allow viewers to donate          │
│  └─ Set fundraising goal: $____     │
│  └─ Cause: [Dropdown]               │
│  └─ Tell your story: [Text]         │
└──────────────────────────────────────┘
```

**Step 5: Confirmation**
```
┌──────────────────────────────────────┐
│  ✓ Event Created!                    │
│                                      │
│  Your event page:                    │
│  tributestream.live/events/jane-50th │
│                                      │
│  Next steps:                         │
│  • Share your event link             │
│  • Set up your stream                │
│  • Test before the event             │
│                                      │
│  [Go to Event Dashboard]             │
└──────────────────────────────────────┘
```

---

## 6. Event Page Layout

### Public Event Page Structure

```
┌──────────────────────────────────────────────────────┐
│  [Cover Image]                                       │
│  Jane's 50th Birthday Celebration 🎂                │
│  Saturday, June 15, 2025 • 7:00 PM EST              │
│                                                      │
│  [Share] [Save to Calendar] [Donate]                │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│  ┌──────────────────────┐  ┌────────────────────┐   │
│  │                      │  │ FUNDRAISING        │   │
│  │   LIVESTREAM         │  │                    │   │
│  │   PLAYER             │  │ Goal: $5,000       │   │
│  │                      │  │ Raised: $3,247     │   │
│  │   [Status Indicator] │  │ [═══════░░] 65%    │   │
│  │                      │  │                    │   │
│  │                      │  │ [Donate Now]       │   │
│  └──────────────────────┘  └────────────────────┘   │
│                                                      │
│  Tabs:                                               │
│  [About] [Comments] [Donors] [Photos]               │
│                                                      │
│  Description:                                        │
│  Join us in celebrating Jane's milestone birthday!  │
│  ...                                                 │
└──────────────────────────────────────────────────────┘
```

### Key Components

**1. Event Header**
- Event name with emoji/icon
- Date, time, timezone
- Location (if physical)
- Host information
- Social sharing buttons

**2. Livestream Section**
- Video player (main focal point)
- Status: [Upcoming | Live Now | Ended]
- Viewer count (when live)
- Chat/comments (optional)

**3. Fundraising Widget** (if enabled)
- Goal progress bar
- Current amount raised
- Donor count
- Recent donations scroll
- Prominent "Donate" CTA

**4. Content Tabs**
- **About**: Event description, details
- **Comments**: Viewer messages (moderated)
- **Donors**: Recognition wall (if public)
- **Photos**: Event gallery/slideshow

**5. Related Actions**
- Add to calendar (ics download)
- Set reminder notification
- Share on social media
- Report/flag inappropriate

---

## 7. User Dashboard (Event Library)

### Current Dashboard (Profile)
```
- User profile info
- List of memorials
- Create memorial button
```

### New Dashboard (Event Library)

```
┌──────────────────────────────────────────────────────┐
│  My Tributestream Live                               │
│  [Create New Event] [Account] [Settings]             │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│  Upcoming Events (3)                                 │
│                                                      │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐      │
│  │ Wedding    │ │ Birthday   │ │ Fundraiser │      │
│  │ Jun 15     │ │ Jul 4      │ │ Aug 10     │      │
│  │ [Manage]   │ │ [Manage]   │ │ [Manage]   │      │
│  └────────────┘ └────────────┘ └────────────┘      │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│  Past Events (12)                  [View All →]      │
│                                                      │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐      │
│  │ Graduation │ │ Memorial   │ │ Reunion    │      │
│  │ May 2025   │ │ Apr 2025   │ │ Mar 2025   │      │
│  │ 47 views   │ │ 102 views  │ │ 28 views   │      │
│  └────────────┘ └────────────┘ └────────────┘      │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│  Fundraising Summary                                 │
│  Total Raised: $12,450                               │
│  Active Campaigns: 2                                 │
│  [View Details →]                                    │
└──────────────────────────────────────────────────────┘
```

**Dashboard Features:**
- Quick stats overview
- Event cards with status indicators
- Calendar view option
- Filter by event type
- Search events
- Archive old events

---

## 8. Donation Flow (New Feature)

### Donation Widget on Event Page

```
┌──────────────────────────────────────┐
│  Support This Event                  │
│                                      │
│  Goal: $5,000  •  Raised: $3,247    │
│  [═══════════════════░░░] 65%       │
│                                      │
│  Choose Amount:                      │
│  [$25] [$50] [$100] [Custom: $___ ] │
│                                      │
│  ☑ Display my name publicly         │
│  ☐ Add a message (optional)         │
│                                      │
│  [Donate with Credit Card]           │
│                                      │
│  Recent Donors:                      │
│  • Sarah M. donated $50 - 5 min ago │
│  • Anonymous donated $25 - 1hr ago  │
│  • John D. donated $100 - 2hrs ago  │
└──────────────────────────────────────┘
```

### Donation Confirmation

```
┌──────────────────────────────────────┐
│  ✓ Thank You for Your Donation!      │
│                                      │
│  You donated $50 to:                 │
│  Jane's 50th Birthday Celebration    │
│                                      │
│  Your donation helps make this       │
│  event possible and supports the     │
│  cause.                              │
│                                      │
│  Receipt sent to: your@email.com     │
│                                      │
│  [Share Your Support]                │
│  [Back to Event]                     │
└──────────────────────────────────────┘
```

### Event Owner Donation Dashboard

```
┌──────────────────────────────────────┐
│  Fundraising Dashboard               │
│  Event: Jane's 50th Birthday         │
│                                      │
│  ┌────────────┐ ┌────────────┐      │
│  │ $3,247     │ │ 47 Donors  │      │
│  │ Raised     │ │            │      │
│  └────────────┘ └────────────┘      │
│                                      │
│  Recent Donations:                   │
│  • $100 - John D. - "Happy Birthday!"│
│  • $50 - Sarah M. - 5 min ago        │
│  • $25 - Anonymous - 1 hr ago        │
│                                      │
│  [Download Donor List]               │
│  [Request Payout]                    │
└──────────────────────────────────────┘
```

---

## 9. Professional Streamer Features

### Professional Profile Page

```
┌──────────────────────────────────────────────────────┐
│  [Profile Photo]                                     │
│  Premier Event Streaming Co.                         │
│  ★★★★★ 4.9 (127 reviews)                           │
│  Orlando, FL • Serves Central Florida                │
│                                                      │
│  [Book Now] [Message] [Share]                        │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│  About                                               │
│  Professional livestreaming for weddings, corporate  │
│  events, and celebrations. 10+ years experience...   │
│                                                      │
│  Specialties:                                        │
│  • Weddings  • Corporate Events  • Memorials        │
│                                                      │
│  Equipment:                                          │
│  • Multi-camera setup  • Professional audio         │
│  • 4K streaming  • Backup internet                  │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│  Packages & Pricing                                  │
│                                                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│  │ Basic    │ │ Standard │ │ Premium  │            │
│  │ $395     │ │ $895     │ │ $1,695   │            │
│  │ 2 hours  │ │ 4 hours  │ │ 8 hours  │            │
│  │ 1 camera │ │ 2 cameras│ │ 3+ cameras│           │
│  └──────────┘ └──────────┘ └──────────┘            │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│  Recent Events                                       │
│  [Portfolio gallery with sample streams]            │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│  Reviews (127)                    ★★★★★ 4.9         │
│  "Excellent service! Made our wedding stream..."     │
│  - Sarah K., Wedding (Jun 2025)                      │
└──────────────────────────────────────────────────────┘
```

### Booking Flow

```
Step 1: Select Package
Step 2: Choose Date/Time
Step 3: Event Details
Step 4: Payment (deposit)
Step 5: Confirmation
```

---

## 10. Mobile Experience

### Mobile-First Priorities

**1. Phone Streaming (Primary Use Case)**
- One-tap "Go Live" button
- Camera flip toggle
- Audio level indicator
- Viewer count
- Connection quality indicator
- Donation alerts (optional overlay)

**2. Mobile Event Viewing**
- Full-screen video player
- Landscape orientation support
- Picture-in-picture for multitasking
- Mobile-optimized donation flow
- Easy social sharing

**3. Mobile Dashboard**
- Swipeable event cards
- Quick actions (edit, share, delete)
- Push notifications for:
  - Event starting soon
  - Donation received
  - New comments

---

## 11. Accessibility Requirements

### WCAG 2.1 AA Compliance

**Visual:**
- Color contrast ratios 4.5:1 minimum
- Text scaling up to 200%
- Focus indicators on all interactive elements
- Alternative text for all images

**Audio/Video:**
- Closed captions for all streams (auto-generated)
- Audio descriptions option
- Transcript generation for archives

**Navigation:**
- Keyboard navigation support
- Screen reader compatibility
- Skip navigation links
- Logical tab order

**Color-Blind Friendly:**
- Don't rely solely on color for information
- Use icons + text labels
- Test with color-blind simulators

---

## 12. Responsive Breakpoints

### Design System Breakpoints

```css
/* Mobile First */
Mobile: 0-768px
Tablet: 768px-1024px
Desktop: 1024px-1440px
Large Desktop: 1440px+

/* Key Component Adaptations */

Event Cards:
Mobile: 1 column
Tablet: 2 columns
Desktop: 3 columns

Video Player:
Mobile: Full width, 16:9
Tablet: 2/3 width, sidebar
Desktop: 2/3 width, sidebar with details

Navigation:
Mobile: Hamburger menu
Tablet: Hamburger menu
Desktop: Full horizontal nav
```

---

## 13. Terminology Changes

### Global Find & Replace

| Old Term | New Term |
|----------|----------|
| Memorial | Event |
| Loved One | Event Subject/Honoree |
| Funeral Director | Professional Streamer |
| Service | Event/Occasion |
| Memorial Page | Event Page |
| Create Memorial | Create Event |
| My Memorials | My Events |
| Schedule Service | Schedule Event |

### Context-Specific Terminology

Keep "Memorial" terminology when:
- Event type IS specifically a memorial/funeral
- In memorial-specific packages/services
- Historical/archived content

Use "Event" terminology for:
- Generic platform references
- Navigation and UI elements
- Documentation and marketing

---

## 14. Animation & Micro-interactions

### Key Animations

**1. Donation Celebration**
- Confetti animation on successful donation
- Progress bar fills with smooth animation
- Milestone celebrations (50%, 75%, 100% of goal)

**2. Live Status Indicators**
- Pulsing red "LIVE" badge
- Viewer count incrementing
- Chat messages sliding in

**3. Event Card Interactions**
- Hover: Gentle lift shadow
- Click: Slight scale down
- Loading: Skeleton screens

**4. Form Interactions**
- Input focus: Border color change
- Validation: Checkmark/error icon
- Submit: Loading spinner, success checkmark

---

## 15. Design Components Library

### New Components Needed

**Event Type Selector**
- Visual grid of event type cards
- Icon + label + description
- Selected state highlighting

**Fundraising Progress Widget**
- Animated progress bar
- Goal/current amount display
- Donor count
- Recent donor list

**Professional Finder**
- Search/filter interface
- Map view option
- Professional cards with ratings
- Booking CTA

**Event Calendar**
- Month/week/day views
- Event type color coding
- Quick event creation
- Drag-to-reschedule

**Donation Form**
- Amount selector (preset + custom)
- Payment method selector
- Anonymous toggle
- Message field
- Stripe integration

---

## 16. Error States & Empty States

### Error States

**No Internet Connection:**
```
┌──────────────────────────────────────┐
│  📡 No Internet Connection           │
│                                      │
│  Unable to load event. Please check  │
│  your connection and try again.      │
│                                      │
│  [Retry]                             │
└──────────────────────────────────────┘
```

**Event Not Found:**
```
┌──────────────────────────────────────┐
│  🔍 Event Not Found                  │
│                                      │
│  This event may have been deleted    │
│  or the link is incorrect.           │
│                                      │
│  [Browse Events] [Go Home]           │
└──────────────────────────────────────┘
```

**Payment Failed:**
```
┌──────────────────────────────────────┐
│  ⚠️ Payment Failed                   │
│                                      │
│  Your donation could not be          │
│  processed. Please try again or      │
│  use a different payment method.     │
│                                      │
│  [Try Again] [Contact Support]       │
└──────────────────────────────────────┘
```

### Empty States

**No Events Yet:**
```
┌──────────────────────────────────────┐
│  📅 No Events Yet                    │
│                                      │
│  Create your first event to start    │
│  building your livestream library!   │
│                                      │
│  [Create Event]                      │
└──────────────────────────────────────┘
```

**No Donations:**
```
┌──────────────────────────────────────┐
│  💝 No Donations Yet                 │
│                                      │
│  Be the first to support this event! │
│                                      │
│  [Donate Now]                        │
└──────────────────────────────────────┘
```

---

## 17. Success Metrics for UI/UX

### User Testing Goals

**Usability Metrics:**
- Time to create first event: < 3 minutes
- Event discovery success rate: > 80%
- Donation completion rate: > 60%
- Professional booking conversion: > 30%

**User Satisfaction:**
- System Usability Scale (SUS): > 80
- Net Promoter Score (NPS): > 50
- Task completion satisfaction: > 4.5/5

**Technical Metrics:**
- Page load time: < 2 seconds
- Mobile responsiveness score: 100/100
- Accessibility score: 100/100
- Cross-browser compatibility: 100%

---

## Next Steps

1. ✅ Review UI/UX transformation plan
2. Create high-fidelity mockups in Figma
3. Build component library in Storybook
4. Conduct user testing with prototypes
5. Implement design system in code
6. A/B test key conversion flows

---

**Document Owner**: Design Team  
**Last Updated**: November 4, 2025
