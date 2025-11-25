# Tributestream - Master Product Requirements Document

**Version:** 2.0 (Post-Simplification)  
**Last Updated:** November 6, 2025  
**Status:** Current Production System

---

## Executive Summary

### What is Tributestream?

Tributestream is a SaaS platform enabling funeral homes and families to create, manage, and livestream event services online. It provides a complete solution for hosting dignified online memorials with livestreaming, photo slideshows, and permanent event pages.

### Target Users

1. **Funeral Directors** - Professional users managing multiple services
2. **Event Owners** - Family members scheduling individual services  
3. **Administrators** - Platform operators with full system access
4. **Viewers** - Public visitors attending virtual event services

### Current Technology Stack

**Frontend:** SvelteKit 2.x + TypeScript + TailwindCSS  
**Backend:** SvelteKit Server Routes + Firebase Admin SDK  
**Database:** Firebase Firestore + Authentication  
**Storage:** Firebase Storage (images) + Cloudflare Stream (video)  
**Email:** SendGrid  
**Payments:** Stripe

---

## Core Platform Components

```
Event Pages → Service Calculator → Stream Manager → Live Streaming
     ↓               ↓                    ↓               ↓
  Slideshow → Payment System → Email System → Cloudflare Stream
```

---

## User Roles & Permissions

### Role Definitions

**Admin** - Full system access, emergency overrides, all memorials  
**Funeral Director** - Create memorials, manage streams, professional account  
**Owner** - Family account, use calculator, view streams (read-only management)  
**Viewer** - Public/guest, watch streams, view memorials

### Permission Matrix

| Feature | Admin | Funeral Director | Owner | Viewer |
|---------|-------|------------------|-------|--------|
| Create Event | ✅ | ✅ | ❌ | ❌ |
| Create Stream (Manual) | ✅ | ✅ | ❌ | ❌ |
| Use Calculator | ✅ | ✅ | ✅ | ❌ |
| Emergency Override | ✅ | ❌ | ❌ | ❌ |
| Upload Slideshow | ✅ | ✅ | ✅ | ❌ |

---

## Core Features

### 1. Event Management
- Permanent tribute pages with biography, photos, dates
- Custom URL slugs (tributestream.com/event-name)
- Public/private visibility settings
- Owner and funeral director assignment

### 2. Livestreaming System (OBS RTMP Only)
- Create stream → Get RTMP URL + Stream Key
- Stream via OBS software → Cloudflare Live Input
- Automatic recording (10s timeout after end)
- Real-time status polling (10-second intervals)
- Emergency override system (Vimeo/YouTube embed fallback)

**Stream States:**
- `scheduled` - Future date/time set
- `ready` - Can start streaming now  
- `live` - Currently broadcasting
- `completed` - Stream ended, may have recording
- `error` - Technical issue

### 3. Service Calculator
- Owner schedules services with date/time/location
- Auto-creates streams for each service
- Calculator → Stream bidirectional sync
- Payment integration (Stripe)

**Auto-Stream Creation:**
```
Main service → Stream titled "{Location Name} Service"
Additional locations → Streams titled "Additional Location - {Name}"
Additional days → Streams titled "Additional Day - {Name}"
```

### 4. Photo Slideshows
- Upload multiple photos
- Generate video slideshow (5s per photo)
- Store in Firebase Storage or Cloudflare Stream
- Embed on event page

### 5. Emergency Override System
- Admin pastes Vimeo/YouTube embed code
- Toggle `overrideActive` to replace stream instantly
- Invisible to viewers (seamless fallback)
- Original stream data preserved

---

## Data Models

### Event
```typescript
{
  id: string;
  fullSlug: string;              // URL slug
  lovedOneName: string;
  dateOfBirth: string;
  dateOfDeath: string;
  biography: string;
  profilePhotoUrl: string;
  ownerUid: string;
  funeralDirectorUid: string;
  isPublic: boolean;
  createdAt: string;
}
```

### Stream
```typescript
{
  id: string;
  title: string;
  memorialId: string;
  status: 'scheduled' | 'ready' | 'live' | 'completed' | 'error';
  
  // OBS RTMP
  rtmpUrl: string;
  streamKey: string;
  cloudflareInputId: string;
  
  // Emergency Override
  overrideEmbedCode?: string;
  overrideActive?: boolean;
  
  // Recording
  recordingReady?: boolean;
  recordingPlaybackUrl?: string;
  cloudflareStreamId?: string;
  
  // Calculator Integration
  calculatorServiceType?: 'main' | 'location' | 'day';
  serviceHash?: string;
  syncStatus?: 'synced' | 'outdated' | 'orphaned';
  
  // Scheduling
  scheduledStartTime?: string;
  
  createdBy: string;
  createdAt: string;
}
```

---

## API Structure

### Event APIs
- `GET /api/memorials` - List memorials
- `POST /api/memorials` - Create event
- `GET /api/memorials/[id]` - Get event details
- `PUT /api/memorials/[id]` - Update event
- `DELETE /api/memorials/[id]` - Delete event (admin)

### Stream APIs
- `GET /api/memorials/[memorialId]/streams` - List streams
- `POST /api/memorials/[memorialId]/streams` - Create stream (returns RTMP)
- `PUT /api/streams/[id]` - Update stream
- `DELETE /api/streams/[id]` - Delete stream

### Stream Status APIs
- `POST /api/streams/check-live-status` - Batch status check (polling)
- `GET /api/streams/[id]/recordings` - Check for recordings
- `GET /api/streams/playback/[streamId]/embed` - Emergency override
- `GET /api/streams/playback/[streamId]/status` - Individual status

### Calculator API
- `POST /api/calculator/schedule` - Save schedule, auto-create streams

---

## Streaming Architecture

```
Funeral Director (OBS)
        │
        │ RTMP Stream
        ↓
Cloudflare Stream Live Input
        │
        ├──→ Live Viewers (HLS/DASH)
        ├──→ Automatic Recording (10s timeout)
        └──→ Cloudflare Stream Storage
                    ↓
             Recording Available
                    ↓
          Event Page Playback
```

**Status Detection:** 10-second polling checks Cloudflare API for connection state

**Recording:** Automatic after stream ends, 2-5 minute processing time

---

## Key User Flows

### Funeral Director: Create Event & Stream
1. Login with magic link
2. Create event (name, dates, bio, photos)
3. Navigate to Stream Manager
4. Click "Create Stream" → Get RTMP URL + Stream Key
5. Copy credentials to OBS
6. Stream on service day → Auto-goes live
7. Stream ends → Recording generated

### Event Owner: Schedule Service
1. Receive welcome email with login
2. Access event → Click "Schedule Service"
3. Fill calculator (date/time/location)
4. Pay or save → Streams auto-created
5. Funeral director receives RTMP credentials
6. Service day → Funeral director streams, owner/guests watch

### Admin: Emergency Override
1. Stream has issues on service day
2. Navigate to Stream Manager
3. Click "Emergency Override"
4. Paste Vimeo/YouTube embed code
5. Toggle "Override Active" ON
6. Event page shows embedded video seamlessly
7. After service, toggle OFF

---

## Authentication & Security

### Firebase Authentication
- Email/Password, Magic Links (passwordless)
- Server-side ID token validation on every API call
- Role-based access control via custom claims

### Authorization Checks
```typescript
// API routes check:
- locals.user exists (authenticated)
- locals.user.role (admin/funeral_director/owner)
- event.ownerUid === locals.user.uid (ownership)
```

### Firestore Security Rules
- Public memorials: Readable by anyone
- Private memorials: Require authentication + ownership/role check
- Streams: Create/update by funeral directors, admins, owners (calculator)
- Users: Read own data, admins read all

---

## Email System (SendGrid)

### Transactional Emails
- Welcome email (new event owner)
- Magic link authentication (funeral directors)
- Payment confirmations
- Stream credentials delivery
- Service reminders

### Templates
- Dynamic template IDs stored in environment variables
- Personalization data passed at send time

---

## Payment System (Stripe)

### Integration
- Checkout Sessions API for one-time payments
- Payment Intent for custom flows
- Webhook handling for payment confirmations

### Pricing
- Per-service base price
- Additional location fees
- Additional day fees
- Slideshow add-ons

---

## Frontend Component Library

### Design System
- **Minimal Modern Theme** (ABeeZee font, gold accent #D5BA7F)
- TailwindCSS utility classes
- Svelte 5 runes (`$state`, `$derived`, `$effect`)

### Key Components
- `Button` - Primary/secondary variants
- `Card` - Content containers
- `Input` - Form inputs
- `LoadingSpinner` - Async operations
- Event-specific components in `src/lib/components/`

### Deleted Components (Rebuild Needed)
- `StreamCard` - Stream display (deleted, needs rebuild)
- `CompletedStreamCard` - Completed stream display (deleted)
- `BrowserStreamer` - WHIP browser streaming (deleted, feature removed)
- All streaming method UI components (deleted)

---

## Third-Party Integrations

### Cloudflare Stream
- **Purpose:** Video hosting, live streaming, recording
- **APIs Used:** Live Inputs, Stream List, Stream Details
- **Features:** RTMP ingestion, automatic recording, HLS/DASH playback

### Firebase
- **Authentication:** User login/signup
- **Firestore:** Database for memorials, streams, users
- **Storage:** Photo and video file storage
- **Admin SDK:** Server-side operations

### SendGrid
- **Purpose:** Transactional emails
- **Integration:** Dynamic templates, API v3
- **Features:** Magic links, payment confirmations, reminders

### Stripe
- **Purpose:** Payment processing
- **Integration:** Checkout Sessions, Webhooks
- **Features:** One-time payments, future subscriptions

---

## Current Development State

### ✅ Working Features
- Event CRUD
- OBS RTMP streaming (Cloudflare)
- Emergency override system
- Service calculator with auto-stream creation
- Slideshow creation and playback
- Email system (SendGrid)
- Payment integration (Stripe)
- Magic link authentication
- Role-based access control
- Recording detection and playback

### 🚧 Needs Rebuild
- Stream Manager UI (deleted, minimal scaffold exists)
- Stream card components (deleted)
- Streaming method UI (deleted - was complex, now OBS-only)

### 🔮 Future Roadmap
- Demo mode system (design complete, not implemented)
- Admin dashboard MVP (planned)
- WebSocket real-time updates (replace polling)
- Mobile app (consideration phase)
- Advanced analytics
- Subscription plans

---

## Development Files & Structure

### Key Directories
```
frontend/src/
├── routes/                    # Pages & API endpoints
│   ├── memorials/[id]/        # Event pages
│   ├── memorials/[id]/streams # Stream manager
│   ├── schedule/              # Service calculator
│   └── api/                   # Backend APIs
├── lib/
│   ├── components/            # Svelte components
│   ├── ui/                    # UI component library
│   ├── server/                # Server-side utilities
│   │   ├── cloudflare-stream.ts
│   │   ├── streaming-methods.ts (simplified)
│   │   └── firebase.ts
│   └── types/                 # TypeScript types
│       └── stream.ts
```

### Important Files
- `STREAMING_BACKEND_SIMPLIFIED.md` - Current streaming architecture
- `STREAM_COMPONENTS_DELETED.md` - UI component cleanup details
- `STREAMS_SCAFFOLD.svelte` - Minimal scaffold for rebuilding
- `EMERGENCY_OVERRIDE_EMBED_SYSTEM.md` - Override system docs
- `CALCULATOR_STREAM_INTEGRATION.md` - Calculator integration details

---

## Testing Strategy

### Manual Testing
- Create event → Success
- Create stream → Receive RTMP credentials
- Stream via OBS → Goes live, recording works
- Calculator → Auto-creates streams correctly
- Emergency override → Seamless fallback
- Role permissions → Proper access control

### Future Automated Testing
- E2E tests (Playwright) - planned
- Unit tests (Vitest) - partial coverage
- API integration tests - needed

---

## Deployment

### Platform
- Vercel (frontend + serverless functions)
- Firebase (database, auth, storage)
- Cloudflare (CDN + streaming)

### Environment Variables
```
FIREBASE_PROJECT_ID
FIREBASE_PRIVATE_KEY
CLOUDFLARE_ACCOUNT_ID
CLOUDFLARE_API_TOKEN
SENDGRID_API_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
```

---

## Quick Start for New Developers

1. **Clone repository**
2. **Install dependencies:** `npm install`
3. **Setup Firebase:** Copy `.env.example` → `.env`, add Firebase credentials
4. **Setup Cloudflare:** Add Cloudflare account ID + API token
5. **Run dev server:** `npm run dev`
6. **Review key docs:**
   - `STREAMING_BACKEND_SIMPLIFIED.md`
   - `STREAM_COMPONENTS_DELETED.md`
   - `DOCUMENTATION_AUDIT.md`

---

## Contact & Support

**For Questions:**
- Review `DOCUMENTATION_AUDIT.md` for all docs
- Check `archive/` folder for historical context
- Review API docs in individual `+server.ts` files

**Recent Changes:**
- November 6, 2025: Streaming backend simplified (removed WHIP/WHEP/MUX)
- November 6, 2025: Stream UI components deleted (rebuild needed)
- November 6, 2025: Documentation cleanup (70+ → 20 docs)

---

**This document represents the complete Tributestream system as of November 6, 2025.**
