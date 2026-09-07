# Memorial Creation Flow

## Overview

Tributestream memorials follow a multi-step creation process from initial setup to livestream. The system supports both direct user creation and funeral director-assisted creation.

## Creation Methods

### 1. Direct User Creation
**Entry Point**: `/create-memorial` → redirects to `/onboarding`

**Flow**:
1. User signs up / logs in
2. Memorial setup form
3. Service details configuration
4. Payment/calculator (optional)
5. Memorial goes live

### 2. Funeral Director Assisted
**Entry Point**: Funeral director creates on behalf of family

**Flow**:
1. FD logs in via magic link
2. Creates memorial with client details
3. Sends invitation to family
4. Family claims ownership
5. Family completes setup

## Memorial Data Model

### Core Fields

```typescript
interface Memorial {
  // Identity
  fullSlug: string;              // unique URL identifier (e.g., "john-smith-2024")
  lovedOneName: string;          // deceased person's name
  
  // Ownership
  createdBy: string;             // Firebase UID
  creatorEmail: string;
  creatorName: string;
  
  // Service Information
  services: {
    main: {
      type: 'funeral' | 'celebration' | 'memorial' | 'other';
      time: {
        date: string;            // YYYY-MM-DD
        time: string;            // HH:MM
        isUnknown: boolean;
      };
      location: {
        name: string;
        address: string;
      };
    };
  };
  
  // Livestream
  livestream?: {
    isActive: boolean;
    streamId: string;            // Mux livestream ID
    playbackId: string;          // Mux playback ID
  };
  
  // Status
  isPublic: boolean;             // visible to public
  isComplete: boolean;           // setup completed
  
  // Payment
  calculatorConfig?: {
    status: 'draft' | 'pending' | 'paid';
    totalPrice: number;
    isPaid: boolean;
  };
  
  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

## Step-by-Step Flow

### Step 1: Initial Memorial Setup

**Route**: `/onboarding` or `/create-memorial`

**Required Information**:
- Loved one's name
- Creator's name and email
- Relationship to deceased

**Backend Action**:
```typescript
const memorial = {
  lovedOneName,
  fullSlug: generateSlug(lovedOneName),
  createdBy: user.uid,
  creatorEmail: user.email,
  creatorName: user.displayName,
  isPublic: false,
  isComplete: false,
  createdAt: now,
  updatedAt: now
};

await adminDb.collection('memorials').add(memorial);
```

### Step 2: Service Details

**Route**: `/memorial/[fullSlug]/edit`

**Configuration**:
- Service type (funeral, celebration, memorial)
- Date and time (or mark as "TBD")
- Location (name and address)
- Service description

**Data Structure**:
```typescript
services: {
  main: {
    type: 'funeral',
    time: {
      date: '2024-12-15',
      time: '14:00',
      isUnknown: false
    },
    location: {
      name: 'Grace Community Church',
      address: '123 Main St, City, ST 12345'
    },
    description: 'A celebration of life...'
  }
}
```

### Step 3: Additional Services (Optional)

Can configure multiple services:
- Visitation
- Wake
- Burial
- Reception

Each follows same structure as main service.

### Step 4: Livestream Setup

**Route**: `/memorial/[fullSlug]/livestream`

**Options**:

#### Option A: Schedule Stream (Recommended)
- Creates Mux livestream
- Generates RTMP credentials
- Sets up stream for specific time
- Auto-starts at scheduled time

#### Option B: Manual Stream
- Create on-demand
- Manual start/stop control
- Good for testing

**Mux Integration**:
```typescript
const stream = await mux.video.liveStreams.create({
  playback_policy: ['public'],
  new_asset_settings: {
    playback_policy: ['public']
  }
});

await adminDb.collection('memorials').doc(memorialId).update({
  'livestream.streamId': stream.id,
  'livestream.playbackId': stream.playback_ids[0].id,
  'livestream.streamKey': stream.stream_key,
  'livestream.isActive': false
});
```

### Step 5: Photo Slideshow (Optional)

**Route**: `/memorial/[fullSlug]/slideshow`

**Features**:
- Upload photos
- Add captions
- Set display order
- Configure transitions
- Add background music

**Storage**:
- Photos stored in Firebase Storage
- Metadata in Firestore
- Optimized for web display

### Step 6: Calculator & Payment

**Route**: `/memorial/[fullSlug]/calculator`

**Services Available**:
- Livestream service
- Recording service
- Additional features (flowers, programs, etc.)

**Payment Flow**:
1. User selects services
2. Price calculated
3. Stripe Checkout session created
4. Payment processed
5. Services activated

**Calculator Config**:
```typescript
calculatorConfig: {
  status: 'paid',
  totalPrice: 499,
  isPaid: true,
  selectedServices: ['livestream', 'recording'],
  stripeSessionId: 'cs_test_...',
  stripePaymentIntentId: 'pi_...'
}
```

### Step 7: Make Public

Once setup complete:
```typescript
await adminDb.collection('memorials').doc(memorialId).update({
  isPublic: true,
  isComplete: true
});
```

Memorial now visible at: `tributestream.com/memorial/[fullSlug]`

## Slug Generation

### Algorithm
```typescript
function generateSlug(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  
  const year = new Date().getFullYear();
  return `${base}-${year}`;
}
```

### Collision Handling
If slug exists, append number:
- `john-smith-2024` → `john-smith-2024-2`
- Check until unique slug found

## Edit vs View Modes

### View Mode
**Route**: `/memorial/[fullSlug]`
- Public-facing memorial page
- Shows all memorial details
- Livestream player (when active)
- Photo slideshow
- Guestbook

### Edit Mode
**Route**: `/memorial/[fullSlug]/edit`
- Owner/admin only
- Edit all memorial details
- Manage services
- Configure livestream
- Upload photos

**Access Check**:
```typescript
if (memorial.createdBy !== locals.user.uid && locals.user.role !== 'admin') {
  throw error(403, 'Unauthorized');
}
```

## Email Notifications

### Memorial Created
Sent to creator:
- Confirmation email
- Setup instructions
- Next steps
- Dashboard link

### Livestream Scheduled
Sent 24 hours before:
- Stream time reminder
- How to start stream
- RTMP credentials
- Technical support

### Service Starting Soon
Sent 1 hour before:
- "Service starting soon" alert
- Link to watch
- Share instructions

## Admin Oversight

**Admin Dashboard**: `/admin`

Admins can:
- View all memorials
- Filter by status (draft, pending payment, live)
- Edit any memorial
- Delete memorials
- View analytics
- Troubleshoot issues

## Common Issues & Solutions

### Slug Already Exists
**Solution**: Append incrementing number to slug

### Livestream Won't Start
**Check**:
- Mux stream created?
- RTMP credentials correct?
- Stream key valid?
- Network connectivity?

### Memorial Not Public
**Check**:
- `isPublic: true` set?
- `isComplete: true` set?
- Firestore rules allowing read?

### Payment Not Processing
**Check**:
- Stripe webhook configured?
- Calculator config saved?
- Payment intent status?

## Related Files

- `src/routes/onboarding/+page.svelte` - Initial setup
- `src/routes/memorial/[fullSlug]/+page.svelte` - View page
- `src/routes/memorial/[fullSlug]/edit/+page.svelte` - Edit page
- `src/routes/memorial/[fullSlug]/livestream/+page.svelte` - Stream setup
- `src/routes/api/mux/+server.ts` - Mux API integration
- `src/lib/types/memorial.ts` - TypeScript types

## Next Steps

See related documentation:
- [[Livestream Integration]] - Mux setup and streaming
- [[Payment & Calculator System]] - Stripe integration
- [[Firestore Data Models]] - Complete database schema
