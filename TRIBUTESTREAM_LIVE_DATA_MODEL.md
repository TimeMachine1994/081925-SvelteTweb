# Tributestream Live - Data Model Refactor

**Date**: November 4, 2025  
**Status**: Planning Phase

## Overview

This document outlines the database schema changes required to transform from memorial-focused to life events platform with integrated fundraising.

---

## 1. Core Collections Renaming

### Current → New Structure

| Current Collection | New Collection | Reason |
|-------------------|----------------|---------|
| `memorials` | `events` | More inclusive terminology for all event types |
| `streams` | `streams` | Keep as-is (already generic) |
| `users` | `users` | Keep as-is |

---

## 2. Events Collection (formerly Memorials)

### Schema Transformation

```typescript
// OLD: Memorial Interface
interface Memorial {
  id: string;
  lovedOneName: string;  // ❌ Too specific
  fullSlug: string;
  ownerUid: string;
  services: {
    main: ServiceDetails;
    additional: AdditionalServiceDetails[];
  };
  isPublic: boolean;
  isPaid: boolean;
  createdAt: Date;
  // ... memorial-specific fields
}

// NEW: Event Interface
interface Event {
  id: string;
  eventName: string;  // ✅ Generic event name
  eventType: EventType;  // ✅ NEW: Type categorization
  fullSlug: string;
  ownerUid: string;
  eventDate: Date;  // ✅ NEW: When event occurs
  eventDetails: EventDetails;  // ✅ NEW: Flexible event info
  privacy: PrivacySettings;  // ✅ Enhanced privacy controls
  isPaid: boolean;
  fundraising?: FundraisingDetails;  // ✅ NEW: Optional fundraising
  createdAt: Date;
  updatedAt: Date;
}
```

### New Types & Interfaces

```typescript
// Event type categorization
enum EventType {
  WEDDING = 'wedding',
  BIRTHDAY = 'birthday',
  GRADUATION = 'graduation',
  ANNIVERSARY = 'anniversary',
  MEMORIAL = 'memorial',  // Keep memorial as one option
  FUNERAL = 'funeral',
  FUNDRAISER = 'fundraiser',
  COMMUNITY_EVENT = 'community_event',
  FAMILY_REUNION = 'family_reunion',
  BABY_SHOWER = 'baby_shower',
  RETIREMENT = 'retirement',
  CONFERENCE = 'conference',
  OTHER = 'other'
}

// Flexible event details
interface EventDetails {
  description: string;
  location?: LocationDetails;
  duration?: number;  // minutes
  expectedViewers?: number;
  tags?: string[];
  coverImage?: string;
  customFields?: Record<string, any>;  // User-defined fields
}

interface LocationDetails {
  name: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  isVirtual?: boolean;
  virtualLink?: string;
}

// Enhanced privacy settings
interface PrivacySettings {
  isPublic: boolean;
  requirePassword?: boolean;
  password?: string;
  allowedViewers?: string[];  // Email list
  allowComments?: boolean;
  allowSharing?: boolean;
  allowDownload?: boolean;
}

// Fundraising details (NEW)
interface FundraisingDetails {
  enabled: boolean;
  goal?: number;  // Dollar amount
  currentAmount: number;
  causeType: CauseType;
  causeDescription: string;
  beneficiary?: BeneficiaryDetails;
  donationSettings: DonationSettings;
  donors?: DonorInfo[];  // Summary info, not full details
  stripeAccountId?: string;  // For payouts
}

enum CauseType {
  PERSONAL_MEDICAL = 'personal_medical',
  PERSONAL_EDUCATION = 'personal_education',
  PERSONAL_EMERGENCY = 'personal_emergency',
  MEMORIAL_FUND = 'memorial_fund',
  MEMORIAL_SCHOLARSHIP = 'memorial_scholarship',
  CHARITABLE_NONPROFIT = 'charitable_nonprofit',
  CHARITABLE_COMMUNITY = 'charitable_community',
  CELEBRATION_GIFT = 'celebration_gift',
  OTHER = 'other'
}

interface BeneficiaryDetails {
  name: string;
  type: 'individual' | 'organization' | 'charity';
  taxId?: string;  // For 501(c)(3) charities
  description?: string;
}

interface DonationSettings {
  minAmount?: number;
  maxAmount?: number;
  suggestedAmounts?: number[];
  allowCustomAmount: boolean;
  showDonorNames: boolean;  // Public donor wall
  showDonorAmounts: boolean;
  acceptedPaymentMethods: string[];
}

interface DonorInfo {
  displayName?: string;  // Anonymous if not provided
  amount?: number;  // Hidden if showDonorAmounts = false
  message?: string;
  donatedAt: Date;
}
```

---

## 3. Donations Collection (NEW)

### Schema

```typescript
interface Donation {
  id: string;
  eventId: string;  // Reference to event
  eventOwnerId: string;  // For quick lookups
  
  // Donor information
  donorUserId?: string;  // If authenticated user
  donorEmail?: string;
  donorName?: string;
  isAnonymous: boolean;
  
  // Payment details
  amount: number;  // In cents
  currency: string;  // Default: 'usd'
  stripePaymentIntentId: string;
  stripeChargeId?: string;
  paymentStatus: PaymentStatus;
  
  // Optional message
  message?: string;
  
  // Payout tracking
  payoutStatus: PayoutStatus;
  payoutId?: string;
  payoutDate?: Date;
  
  // Metadata
  createdAt: Date;
  refundedAt?: Date;
  refundReason?: string;
}

enum PaymentStatus {
  PENDING = 'pending',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
  REFUNDED = 'refunded'
}

enum PayoutStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  PAID = 'paid',
  FAILED = 'failed'
}
```

---

## 4. Streams Collection Updates

### Schema Enhancements

```typescript
// Add to existing Stream interface
interface Stream {
  // ... existing fields
  
  eventId: string;  // Reference to parent event
  eventType: EventType;  // Quick reference
  
  // Enhanced metadata
  streamType: StreamType;  // NEW
  scheduledStartTime?: Date;
  actualStartTime?: Date;
  endTime?: Date;
  
  // Viewer analytics
  peakViewers?: number;
  totalUniqueViewers?: number;
  averageWatchTime?: number;  // seconds
  
  // Fundraising during stream
  fundraisingEnabled: boolean;
  liveDonationDisplay: boolean;  // Show donations in real-time
  
  // Professional service tracking
  isProfessionalService: boolean;
  productionTeam?: string[];  // Staff member IDs
  equipment?: string[];  // Camera, mic specs
}

enum StreamType {
  DIY_PHONE = 'diy_phone',
  DIY_BROWSER = 'diy_browser',
  PROFESSIONAL_SINGLE_CAM = 'professional_single_cam',
  PROFESSIONAL_MULTI_CAM = 'professional_multi_cam',
  PROFESSIONAL_PREMIUM = 'professional_premium'
}
```

---

## 5. Users Collection Updates

### Schema Enhancements

```typescript
interface User {
  // ... existing fields
  
  // Role updates
  role: UserRole;  // Updated enum
  
  // Analytics
  totalEventsCreated: number;
  totalStreamsConducted: number;
  totalDonationsReceived?: number;  // For fundraisers
  totalDonationsGiven?: number;  // As a donor
  
  // Preferences
  preferences: UserPreferences;
  
  // Professional streamer profile (NEW)
  professionalProfile?: ProfessionalStreamerProfile;
  
  // Stripe accounts for payouts
  stripeCustomerId?: string;
  stripeConnectedAccountId?: string;  // For receiving donations
}

enum UserRole {
  ADMIN = 'admin',
  EVENT_OWNER = 'event_owner',  // Renamed from 'owner'
  PROFESSIONAL_STREAMER = 'professional_streamer',  // Renamed from 'funeral_director'
  VIEWER = 'viewer'
}

interface UserPreferences {
  defaultEventType?: EventType;
  defaultPrivacy?: PrivacySettings;
  emailNotifications: NotificationPreferences;
  defaultFundraisingSettings?: DonationSettings;
}

interface NotificationPreferences {
  eventReminders: boolean;
  donationReceived: boolean;
  donationMilestones: boolean;
  streamStarted: boolean;
  newComments: boolean;
  weeklyDigest: boolean;
}

// Professional streamer profile
interface ProfessionalStreamerProfile {
  companyName?: string;
  bio?: string;
  serviceAreas: string[];  // Geographic areas
  specializations: EventType[];  // What events they stream
  equipment: string[];
  portfolioLinks?: string[];
  hourlyRate?: number;
  packages?: ServicePackage[];
  availability: AvailabilitySchedule;
  rating?: number;
  reviewCount?: number;
}

interface ServicePackage {
  name: string;
  description: string;
  price: number;
  features: string[];
  durationHours: number;
}

interface AvailabilitySchedule {
  timezone: string;
  recurringAvailability: WeeklySchedule;
  bookedDates: Date[];
}
```

---

## 6. New Collections

### EventComments Collection
```typescript
interface EventComment {
  id: string;
  eventId: string;
  userId?: string;
  userName: string;
  userEmail?: string;
  comment: string;
  isApproved: boolean;  // Moderation
  createdAt: Date;
  deletedAt?: Date;
}
```

### ServiceBookings Collection
```typescript
interface ServiceBooking {
  id: string;
  eventId: string;
  clientUserId: string;
  professionalUserId: string;
  
  packageDetails: ServicePackage;
  eventDate: Date;
  eventDuration: number;
  
  // Payment
  totalAmount: number;
  depositAmount: number;
  depositPaid: boolean;
  balancePaid: boolean;
  stripePaymentIntents: string[];
  
  // Status
  status: BookingStatus;
  
  createdAt: Date;
  confirmedAt?: Date;
  completedAt?: Date;
  cancelledAt?: Date;
}

enum BookingStatus {
  PENDING = 'pending',
  DEPOSIT_PAID = 'deposit_paid',
  CONFIRMED = 'confirmed',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}
```

---

## 7. Migration Strategy

### Phase 1: Dual Schema Support
- Keep `memorials` collection alongside new `events` collection
- Run migration script to copy data with transformations
- Update code to read from both sources (fallback logic)

### Phase 2: Data Transformation
```typescript
// Migration script pseudocode
function migrateMemorialToEvent(memorial: Memorial): Event {
  return {
    id: memorial.id,
    eventName: memorial.lovedOneName,
    eventType: EventType.MEMORIAL,  // All existing are memorials
    fullSlug: memorial.fullSlug,
    ownerUid: memorial.ownerUid,
    eventDate: memorial.services.main.time.date || new Date(),
    eventDetails: {
      description: `Memorial service for ${memorial.lovedOneName}`,
      location: memorial.services.main.location,
      tags: ['memorial', 'celebration-of-life']
    },
    privacy: {
      isPublic: memorial.isPublic,
      allowComments: true,
      allowSharing: true
    },
    isPaid: memorial.isPaid,
    fundraising: memorial.fundraising || null,  // May be null
    createdAt: memorial.createdAt,
    updatedAt: new Date()
  };
}
```

### Phase 3: Deprecation
- Stop writing to `memorials` collection
- All new events go to `events` collection
- Keep `memorials` read-only for archival

---

## 8. Firestore Security Rules Updates

```javascript
// NEW: events collection rules
match /events/{eventId} {
  // Allow read based on privacy settings
  allow read: if resource.data.privacy.isPublic == true
              || request.auth.uid == resource.data.ownerUid
              || request.auth.uid in resource.data.privacy.allowedViewers;
  
  // Allow create for authenticated users
  allow create: if request.auth != null 
                && request.resource.data.ownerUid == request.auth.uid;
  
  // Allow update only by owner
  allow update: if request.auth.uid == resource.data.ownerUid;
  
  // Allow delete only by owner or admin
  allow delete: if request.auth.uid == resource.data.ownerUid
                || isAdmin();
}

// NEW: donations collection rules
match /donations/{donationId} {
  // Public can create donations
  allow create: if request.auth != null;
  
  // Only event owner and donor can read
  allow read: if request.auth.uid == resource.data.eventOwnerId
              || request.auth.uid == resource.data.donorUserId
              || isAdmin();
  
  // No updates allowed (immutable)
  allow update: if false;
  
  // Only admin can delete (for fraud)
  allow delete: if isAdmin();
}

// Helper functions
function isAdmin() {
  return request.auth.token.role == 'admin';
}
```

---

## 9. API Endpoint Updates

### Endpoints to Rename/Update

| Current Endpoint | New Endpoint | Changes |
|-----------------|--------------|---------|
| `/api/memorials` | `/api/events` | Update to handle event types |
| `/api/memorials/[id]` | `/api/events/[id]` | Add fundraising data |
| `/api/user/memorials` | `/api/user/events` | Return all event types |

### New Endpoints Needed

```
POST   /api/events/[id]/donations          - Create donation
GET    /api/events/[id]/donations          - Get donations for event
GET    /api/donations/[id]                 - Get specific donation

POST   /api/bookings                       - Book professional service
GET    /api/bookings/[id]                  - Get booking details
PUT    /api/bookings/[id]/status           - Update booking status

GET    /api/professional-streamers         - Find professionals
GET    /api/professional-streamers/[id]    - Get profile
```

---

## 10. Backwards Compatibility

### Read Operations
- Check `events` collection first
- Fall back to `memorials` for legacy data
- Transparent to frontend

### Write Operations
- All new creations go to `events`
- Updates check both collections
- Delete from both if exists

### Slug Handling
- Keep `fullSlug` as unique identifier
- Works for both old memorials and new events
- No breaking changes to public URLs

---

## Next Steps

1. ✅ Review data model transformations
2. Create Firestore migration scripts
3. Update TypeScript interfaces in codebase
4. Create new API endpoints
5. Update security rules
6. Test migration with sample data

---

**Document Owner**: Backend Team  
**Last Updated**: November 4, 2025
