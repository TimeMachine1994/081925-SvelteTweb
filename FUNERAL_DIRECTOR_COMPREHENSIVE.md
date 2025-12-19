# Funeral Director Role - Comprehensive Documentation

**Generated:** December 18, 2024  
**System:** TributeStream Memorial Platform

---

## Table of Contents

1. [Overview](#overview)
2. [Type Definitions & Interfaces](#type-definitions--interfaces)
3. [Data Flows](#data-flows)
4. [API Endpoints](#api-endpoints)
5. [Accessible Pages & Routes](#accessible-pages--routes)
6. [Layouts & UI Components](#layouts--ui-components)
7. [Permissions & Access Control](#permissions--access-control)
8. [Email Templates & Notifications](#email-templates--notifications)
9. [Database Collections](#database-collections)
10. [Complete User Journey](#complete-user-journey)

---

## Overview

The **Funeral Director** role in TributeStream enables funeral home professionals to:
- Register and manage their professional profile
- Create memorial pages for families they serve
- Manage livestream services
- Track memorials they've created
- Access specialized dashboard features

**Key Characteristics:**
- Role identifier: `'funeral_director'`
- Auto-approved status in V1 (no manual approval required)
- Can create memorials on behalf of families
- Has edit access to memorials they create
- Tracked via `funeralDirectorUid` field in memorial documents

---

## Type Definitions & Interfaces

### 1. FuneralDirector Interface

**Location:** `frontend/src/lib/types/funeral-director.ts`

```typescript
export interface FuneralDirector {
  id: string;

  // Basic Info
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;

  // Address (simplified)
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };

  // Account Status (V1: auto-approved)
  status: 'approved' | 'suspended' | 'inactive';

  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Storage:** Firestore collection `funeral_directors/{uid}`

---

### 2. ServiceDetails Interface

```typescript
export interface ServiceDetails {
  date: string;
  time: string;
  location: string;
  address: string;
  officiant?: string;
  notes?: string;
}
```

---

### 3. FuneralDirectorMemorialRequest Interface

**Purpose:** Data structure for comprehensive memorial creation by funeral directors

```typescript
export interface FuneralDirectorMemorialRequest {
  // Deceased Information (Enhanced)
  deceased: {
    firstName: string;
    lastName: string;
    middleName?: string;
    nickname?: string;
    dateOfBirth: string;
    dateOfDeath: string;
    placeOfBirth?: string;
    placeOfDeath?: string;
    causeOfDeath?: string;

    // Physical Description
    profilePhoto?: File;
    height?: string;
    eyeColor?: string;
    hairColor?: string;

    // Life Details
    occupation?: string;
    education?: string;
    militaryService?: boolean;
    militaryBranch?: string;
    militaryRank?: string;
  };

  // Family Information (Enhanced)
  family: {
    spouse?: {
      name: string;
      status: 'surviving' | 'predeceased';
      marriageDate?: string;
    };
    children?: Array<{
      name: string;
      relationship: 'son' | 'daughter' | 'stepson' | 'stepdaughter';
      status: 'surviving' | 'predeceased';
    }>;
    parents?: Array<{
      name: string;
      relationship: 'father' | 'mother' | 'stepfather' | 'stepmother';
      status: 'surviving' | 'predeceased';
    }>;
    siblings?: Array<{
      name: string;
      relationship: 'brother' | 'sister' | 'stepbrother' | 'stepsister';
      status: 'surviving' | 'predeceased';
    }>;
  };

  // Service Information
  services: {
    viewingDetails?: ServiceDetails;
    funeralDetails?: ServiceDetails;
    burialDetails?: ServiceDetails;
    memorialDetails?: ServiceDetails;
  };

  // Funeral Director Information (Auto-filled)
  funeralDirector: {
    id: string;
    companyName: string;
    contactPerson: string;
    phone: string;
    email: string;
    licenseNumber: string;
  };

  // Owner Information
  owner: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    relationship: string;
    address?: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
    };
  };

  // Memorial Configuration
  memorial: {
    title?: string;
    description?: string;
    isPublic: boolean;
    allowComments: boolean;
    allowPhotos: boolean;
    allowTributes: boolean;
    customSlug?: string;
  };

  // Additional Options
  options: {
    sendNotifications: boolean;
    createGuestbook: boolean;
    enableDonations: boolean;
    donationRecipient?: string;
    enableFlowers: boolean;
    flowerProvider?: string;
  };
}
```

---

### 4. Email Data Interfaces

**Location:** `frontend/src/lib/server/email.ts`

```typescript
export interface FuneralDirectorWelcomeEmailData {
  email: string;
  displayName: string;
}

export interface FuneralDirectorRegistrationEmailData {
  email: string;
  familyName: string;
  lovedOneName: string;
  memorialUrl: string;
  password?: string; // Only for new users
  additionalNotes?: string;
  calculatorMagicLink?: string; // Magic link for calculator access
}
```

---

### 5. User Context Interface

**Location:** `frontend/src/lib/utils/memorialAccess.ts`

```typescript
export interface UserContext {
  uid: string;
  email: string | null;
  role: 'admin' | 'owner' | 'funeral_director';
  isAdmin?: boolean;
}
```

---

## Data Flows

### Flow 1: Funeral Director Registration

```
┌─────────────────────────────────────────────────────────────┐
│ 1. User Signs Up via Firebase Auth                          │
│    - Email/Password registration                             │
│    - Firebase creates user account                           │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. POST /api/funeral-director/register                      │
│    Request Body: {                                           │
│      companyName, contactPerson, email, phone, address       │
│    }                                                          │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Server Processing                                         │
│    a. Validate required fields                               │
│    b. Validate profile data structure                        │
│    c. Create FuneralDirector document in Firestore           │
│       Collection: funeral_directors/{uid}                    │
│       Status: 'approved' (auto-approved in V1)               │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Set Custom Claims                                         │
│    Firebase Auth: setCustomUserClaims(uid, {                 │
│      role: 'funeral_director'                                │
│    })                                                         │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Response & Redirect                                       │
│    - Success message returned                                │
│    - User redirected to dashboard                            │
│    - Session updated with new role                           │
└─────────────────────────────────────────────────────────────┘
```

---

### Flow 2: Creating Memorial for Family (Quick Registration)

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Funeral Director Navigates to                             │
│    /register/funeral-director                                │
│    - Form pre-populated with FD profile data                 │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. FD Fills Out Form                                         │
│    Required:                                                 │
│    - Loved one's name                                        │
│    - Family contact email                                    │
│    - Family contact phone                                    │
│    - Director name                                           │
│    - Funeral home name                                       │
│    Optional:                                                 │
│    - Service date/time/location                              │
│    - Additional notes                                        │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. POST /register/funeral-director (form action)            │
│    Server receives form data                                 │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Check if Family User Exists                               │
│    adminAuth.getUserByEmail(familyContactEmail)              │
│                                                               │
│    IF EXISTS:                                                │
│    - Use existing user account                               │
│    - Update user profile with new memorial info              │
│    - No password generated                                   │
│                                                               │
│    IF NOT EXISTS:                                            │
│    - Create new Firebase Auth user                           │
│    - Generate random password                                │
│    - Set role: 'owner'                                       │
│    - Create user profile in Firestore                        │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Generate Unique Memorial Slug                             │
│    - Based on loved one's name                               │
│    - Add timestamp for uniqueness                            │
│    - Format: firstname-lastname-{timestamp}                  │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. Create Memorial Document                                  │
│    Collection: memorials                                     │
│    Fields:                                                   │
│    - lovedOneName, slug, fullSlug                            │
│    - ownerUid: family user's UID                             │
│    - funeralDirectorUid: FD's UID                            │
│    - funeralDirector: { id, companyName, contactPerson... }  │
│    - services: { main: { location, time, hours }, additional }│
│    - createdByRole: 'funeral_director'                       │
│    - status: 'active'                                        │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. Index Memorial in Algolia                                 │
│    - Memorial searchable immediately                         │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 8. Generate Magic Links                                      │
│    a. Calculator Magic Link:                                 │
│       - Custom token with memorial_id claim                  │
│       - URL: /auth/session?token={token}&redirect=schedule/{id}│
│    b. Standard access token for family                       │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 9. Send Email to Family                                      │
│    Function: sendFuneralDirectorRegistrationEmail()          │
│    Template: SendGrid Dynamic Template                       │
│    Contains:                                                 │
│    - Memorial URL                                            │
│    - Login credentials (if new user)                         │
│    - Calculator magic link                                   │
│    - Funeral director contact info                           │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 10. Return Success Response                                  │
│     - Memorial created message                               │
│     - Memorial slug                                          │
│     - Family email confirmation                              │
│     - Auto-redirect to /profile after 3 seconds              │
└─────────────────────────────────────────────────────────────┘
```

---

### Flow 3: Creating Memorial via API (Advanced)

```
┌─────────────────────────────────────────────────────────────┐
│ 1. POST /api/funeral-director/create-memorial                │
│    Headers: Session cookie (authenticated)                   │
│    Body: FuneralDirectorMemorialRequest                      │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Authentication & Authorization Check                      │
│    - Verify user is authenticated                            │
│    - Fetch funeral director profile from Firestore           │
│    - Verify status === 'approved'                            │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Generate Memorial Slug & Title                            │
│    - Title from request or generate from deceased name       │
│    - Slug from customSlug or name-based                      │
│    - fullSlug with timestamp for uniqueness                  │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Create Owner User Account                                 │
│    - Generate random password                                │
│    - Create Firebase Auth user                               │
│    - Set custom claims: { role: 'owner' }                    │
│    - Create user profile in Firestore users collection       │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Create Comprehensive Memorial Document                    │
│    Includes:                                                 │
│    - Full deceased information                               │
│    - Family members with relationships                       │
│    - Service details (viewing, funeral, burial, memorial)    │
│    - Funeral director information                            │
│    - Owner/family contact info                               │
│    - Memorial settings & options                             │
│    - Permissions: funeralDirectorCanEdit: true               │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. Send Registration Email                                   │
│    Function: sendEnhancedRegistrationEmail()                 │
│    Includes:                                                 │
│    - Password (for new account)                              │
│    - Memorial URL                                            │
│    - Funeral director contact info                           │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. Return Success Response                                   │
│    {                                                         │
│      success: true,                                          │
│      memorialId: string,                                     │
│      fullSlug: string,                                       │
│      message: string                                         │
│    }                                                         │
└─────────────────────────────────────────────────────────────┘
```

---

### Flow 4: Dashboard Profile Management

```
┌─────────────────────────────────────────────────────────────┐
│ 1. GET /funeral-director/dashboard                           │
│    - Load function executes                                  │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Authentication Check                                      │
│    - Verify locals.user exists                               │
│    - Verify role === 'funeral_director'                      │
│    - Redirect to /login or /profile if unauthorized          │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Fetch Funeral Director Profile                            │
│    adminDb.collection('funeral_directors')                   │
│      .doc(locals.user.uid).get()                             │
│                                                               │
│    IF NOT EXISTS:                                            │
│    - Return empty profile structure                          │
│    - Allow creation via form                                 │
│                                                               │
│    IF EXISTS:                                                │
│    - Load all profile data                                   │
│    - Convert Timestamps to ISO strings                       │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Render Dashboard Page                                     │
│    - Pre-populate form with existing data                    │
│    - Display company info, contact details, address          │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. POST ?/updateProfile (form submission)                    │
│    - Extract form data                                       │
│    - Validate required fields                                │
│    - Update funeral_directors/{uid} document                 │
│    - Add updatedAt timestamp                                 │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. Return Success/Error                                      │
│    - Show success message in UI                              │
│    - Keep user on dashboard page                             │
└─────────────────────────────────────────────────────────────┘
```

---

### Flow 5: Viewing Managed Memorials

```
┌─────────────────────────────────────────────────────────────┐
│ 1. GET /api/funeral-director/memorials                       │
│    - Authenticated request                                   │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Query Firestore                                           │
│    memorials.where('funeralDirector.id', '==', user.uid)     │
│             .orderBy('createdAt', 'desc')                    │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Return Memorial List                                      │
│    {                                                         │
│      memorials: [                                            │
│        { id, lovedOneName, fullSlug, createdAt, ... }        │
│      ]                                                       │
│    }                                                         │
└─────────────────────────────────────────────────────────────┘
```

---

## API Endpoints

### Funeral Director Registration

#### POST `/api/funeral-director/register`

**Purpose:** Register a new funeral director profile

**Authentication:** Required (user must be signed in)

**Request Body:**
```typescript
{
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
}
```

**Process:**
1. Validates required fields
2. Validates data structure via `validateUserProfileData()`
3. Creates `FuneralDirector` document in Firestore
4. Sets Firebase custom claims: `{ role: 'funeral_director' }`
5. Auto-approves (status: 'approved')

**Response:**
```typescript
{
  success: true;
  message: string;
  id: string; // User UID
}
```

**Error Codes:**
- 401: Authentication required
- 400: Missing/invalid fields
- 500: Server error

**File:** `frontend/src/routes/api/funeral-director/register/+server.ts`

---

### Memorial Creation (Advanced API)

#### POST `/api/funeral-director/create-memorial`

**Purpose:** Create comprehensive memorial with full deceased/family info

**Authentication:** Required (funeral_director role)

**Request Body:** `FuneralDirectorMemorialRequest` (see Type Definitions)

**Process:**
1. Verify funeral director is approved
2. Generate memorial title and slug
3. Create owner user account with random password
4. Set owner custom claims: `{ role: 'owner' }`
5. Create comprehensive memorial document
6. Send registration email to owner
7. Return memorial details

**Response:**
```typescript
{
  success: true;
  memorialId: string;
  fullSlug: string;
  message: string;
}
```

**File:** `frontend/src/routes/api/funeral-director/create-memorial/+server.ts`

---

### Memorial Creation (Customer/Quick Flow)

#### POST `/api/funeral-director/create-customer-memorial`

**Purpose:** Quick memorial creation for immediate customer setup

**Authentication:** Required (funeral_director role)

**Request Body:**
```typescript
{
  lovedOne: {
    firstName: string;
    lastName: string;
    middleName?: string;
    dateOfBirth?: string;
    dateOfDeath?: string;
  };
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    relationship: string;
  };
  service: {
    date: string;
    time: string;
    durationHours: number;
    serviceType: string;
    location?: string;
    additionalDays?: Array<any>;
  };
  memorial: {
    customMessage?: string;
    isPublic: boolean;
    allowComments: boolean;
    allowPhotos: boolean;
    allowTributes: boolean;
  };
}
```

**Process:**
1. Verify funeral director is approved
2. Generate memorial slug
3. Create customer user account with temporary password
4. Set custom claims: `{ role: 'owner' }`
5. Create memorial with service details
6. Create user profile in Firestore
7. Send enhanced registration email
8. Return memorial and customer details

**Response:**
```typescript
{
  success: true;
  memorialId: string;
  fullSlug: string;
  customerEmail: string;
  customerUserId: string;
  message: string;
}
```

**File:** `frontend/src/routes/api/funeral-director/create-customer-memorial/+server.ts`

---

### Profile Management

#### GET `/api/funeral-director/profile`

**Purpose:** Fetch funeral director profile

**Authentication:** Required

**Response:**
```typescript
FuneralDirector // Full profile object
```

**File:** `frontend/src/routes/api/funeral-director/profile/+server.ts`

---

#### PATCH `/api/funeral-director/profile`

**Purpose:** Update funeral director profile

**Authentication:** Required

**Request Body:** Partial `FuneralDirector` (fields to update)

**Restricted Fields:**
- id (auto-managed)
- createdAt (immutable)
- status (admin-only)
- verificationStatus (admin-only)
- permissions (admin-only)

**Response:**
```typescript
{
  success: true;
  message: string;
}
```

---

### List Managed Memorials

#### GET `/api/funeral-director/memorials`

**Purpose:** Get all memorials created by this funeral director

**Authentication:** Required

**Query:** None (uses authenticated user's UID)

**Response:**
```typescript
{
  memorials: Array<{
    id: string;
    // ...memorial fields
  }>;
}
```

**Query:** `memorials.where('funeralDirector.id', '==', user.uid).orderBy('createdAt', 'desc')`

**File:** `frontend/src/routes/api/funeral-director/memorials/+server.ts`

---

### Admin Endpoints (Funeral Director Management)

#### POST `/api/admin/approve-funeral-director`

**Purpose:** Approve pending funeral director (future use)

**Authentication:** Admin only

**Request Body:**
```typescript
{
  directorId: string;
}
```

**Process:**
1. Verify admin role
2. Update funeral director status to 'approved'
3. Add approvedAt timestamp and approvedBy UID
4. Log audit event

**File:** `frontend/src/routes/api/admin/approve-funeral-director/+server.ts`

---

#### POST `/api/admin/reject-funeral-director`

**Purpose:** Reject pending funeral director application

**Authentication:** Admin only

**Request Body:**
```typescript
{
  directorId: string;
  reason?: string;
}
```

---

#### POST `/api/admin/delete-funeral-director`

**Purpose:** Delete funeral director account

**Authentication:** Admin only

**Request Body:**
```typescript
{
  directorId: string;
}
```

---

#### POST `/api/admin/update-funeral-director`

**Purpose:** Admin-level update of funeral director profile

**Authentication:** Admin only

---

## Accessible Pages & Routes

### Public Routes (Pre-Authentication)

#### `/for-funeral-directors`

**Purpose:** Marketing/information page for funeral directors

**Layout:** Standard public layout (`+layout.svelte`)

**Components:**
- Hero section with call-to-action
- Benefits showcase
- Partnership packages
- Step-by-step guide
- Contact information

**CTAs:**
- "Book Free Demo" → `/book-demo`
- "Create Your Director Account" → `/register/funeral-home`

**File:** `frontend/src/routes/for-funeral-directors/+page.svelte`

---

### Authentication Required Routes

#### `/register/funeral-director`

**Purpose:** Quick family memorial registration form

**Authentication:** Required (funeral_director or admin role)

**Access Control:**
```typescript
// +page.server.ts load function
if (!locals.user) {
  throw redirect(302, '/login?redirect=/register/funeral-director');
}

if (locals.user.role !== 'funeral_director' && locals.user.role !== 'admin') {
  throw redirect(302, '/profile?error=access-denied');
}
```

**Pre-population:**
- If funeral_director role: Loads profile from `funeral_directors/{uid}`
- Pre-fills director name, email, funeral home name

**Form Fields:**
- **Memorial Information:** Loved one's name
- **Family Contact:** Name, email, phone, contact preference
- **Director Information:** Name, email, funeral home name
- **Service Information:** Date, time, location name, location address
- **Additional Notes:** Special instructions

**On Submit:**
- Checks if family email exists (creates or reuses account)
- Creates memorial document
- Generates magic links for calculator access
- Sends registration email to family
- Redirects to `/profile` after 3 seconds

**File:** `frontend/src/routes/register/funeral-director/+page.svelte`

**Server:** `frontend/src/routes/register/funeral-director/+page.server.ts`

---

#### `/funeral-director/dashboard`

**Purpose:** Funeral director profile management dashboard

**Authentication:** Required (funeral_director role only)

**Access Control:**
```typescript
if (!locals.user) {
  throw redirect(303, '/login');
}

if (locals.user.role !== 'funeral_director') {
  throw redirect(303, '/profile');
}
```

**Features:**
- View/edit company information
- Update contact details
- Manage business address
- Save profile changes

**Form Sections:**
1. **Company Information:** Company name, contact person
2. **Contact Information:** Email, phone
3. **Business Address:** Street, city, state, ZIP

**Actions:**
- `updateProfile`: Updates `funeral_directors/{uid}` document

**UI Theme:** Amber/orange gradient (funeral director theme)

**Files:**
- `frontend/src/routes/funeral-director/dashboard/+page.svelte`
- `frontend/src/routes/funeral-director/dashboard/+page.server.ts`

---

#### `/profile`

**Purpose:** User profile page (includes role-specific features)

**Funeral Director Features:**
- Link to funeral director dashboard
- Display of managed memorials
- Role badge indicator

**Access:**
- Sidebar link to `/funeral-director/dashboard`
- Displays funeral home name if available

**File:** `frontend/src/routes/profile/+page.svelte` (role detection)

---

### Memorial Access (Edit Permissions)

Funeral directors have **edit access** to memorials where:
- `memorial.funeralDirectorUid === user.uid`
- OR `memorial.funeralDirector.id === user.uid`

**Access Levels:**
- **View:** All public memorials
- **Edit:** Memorials they created
- **Admin:** Same as edit for their memorials

**Permission Check Function:**
```typescript
// From memorialAccess.ts
if (user.role === 'funeral_director' && memorial.funeralDirectorUid === user.uid) {
  return {
    hasAccess: true,
    accessLevel: 'edit',
    reason: 'funeral_director'
  };
}
```

---

## Layouts & UI Components

### Root Layout

**File:** `frontend/src/routes/+layout.svelte`

**Features:**
- Navbar with role-based display
- Footer
- Demo mode banner (if applicable)
- Dev role switcher (development only)
- Recaptcha provider wrapper

**Role Detection:**
```svelte
{#if data.user?.role === 'funeral_director'}
  <!-- Show funeral director specific UI -->
{/if}
```

**Layout Server Load:**
```typescript
// +layout.server.ts
export const load: LayoutServerLoad = async ({ locals }) => {
  return {
    user: locals.user // Includes role information
  };
};
```

---

### Navbar Component

**File:** `frontend/src/lib/components/Navbar.svelte`

**Funeral Director Display:**
- Shows "Funeral Director Dashboard" link when role === 'funeral_director'
- Displays funeral home name if available
- Amber/gold color scheme for role badge

**Navigation Links:**
```
- Logo (home)
- Memorials
- Profile
- [Role-Specific Links]
  - Funeral Director Dashboard (/funeral-director/dashboard)
  - Quick Family Registration (/register/funeral-director)
- Sign Out
```

---

### Dashboard UI Theme

**Color Scheme:**
- Primary: Amber (`from-amber-50 to-orange-50`)
- Accent: Amber-600
- Buttons: `from-amber-500 to-amber-600`
- Focus rings: `ring-amber-500`

**Icons:** Lucide Svelte
- `Building2` - Company/business
- `User` - Contact person
- `Mail` - Email
- `Phone` - Phone number
- `MapPin` - Address
- `Save` - Save action
- `ArrowLeft` - Back navigation

**UI Pattern:**
- Rounded corners: `rounded-xl`, `rounded-3xl`
- Glass morphism: `bg-white/70 backdrop-blur-xl`
- Gradient backgrounds
- Shadow elevation: `shadow-2xl`

---

### Registration Form UI

**Layout:** Centered, max-width container

**Sections:**
1. Header with role indicator badge
2. Form in white card with shadow
3. Success/error message banners
4. Multi-section form layout
5. Submit button with loading state

**Responsive:** Grid layout (`grid-cols-1 md:grid-cols-2`)

**Validation:**
- Client-side: Real-time validation on submit
- Server-side: SvelteKit form actions
- Error display: Inline field errors and summary banner

---

## Permissions & Access Control

### Authentication Flow

**Session Management:** Firebase session cookies

**Hook:** `frontend/src/hooks.server.ts`

```typescript
export const handle: Handle = async ({ event, resolve }) => {
  // Verify session cookie
  const sessionCookie = event.cookies.get('session');
  
  if (sessionCookie) {
    const decodedToken = await adminAuth.verifySessionCookie(sessionCookie);
    const userRecord = await adminAuth.getUser(decodedToken.uid);
    
    event.locals.user = {
      uid: userRecord.uid,
      email: userRecord.email || null,
      displayName: userRecord.displayName,
      role: userRecord.customClaims?.role || 'owner',
      isAdmin: userRecord.customClaims?.role === 'admin'
    };
  }
  
  return resolve(event);
};
```

---

### Firestore Security Rules

**File:** `firestore.rules`

```javascript
// Funeral Directors collection rules
match /funeral_directors/{funeralDirectorId} {
  // Only the funeral director can read/write their own document
  allow read, write: if request.auth != null 
    && request.auth.uid == funeralDirectorId;
  
  // Admins can read all funeral director documents
  allow read: if request.auth != null 
    && isAdmin(request.auth.uid);
}
```

---

### Memorial Access Control

**Class:** `MemorialAccessVerifier`

**Location:** `frontend/src/lib/utils/memorialAccess.ts`

#### View Access

```typescript
static async checkViewAccess(memorialId: string, user: UserContext) {
  const memorial = await fetchMemorial(memorialId);
  
  // Public memorials: anyone can view
  if (memorial.isPublic) {
    return { hasAccess: true, accessLevel: 'view' };
  }
  
  // Admin: can view all
  if (user.role === 'admin') {
    return { hasAccess: true, accessLevel: 'admin' };
  }
  
  // Owner: can view their memorial
  if (memorial.ownerUid === user.uid) {
    return { hasAccess: true, accessLevel: 'admin' };
  }
  
  // Funeral director: can view assigned memorials
  if (user.role === 'funeral_director' && memorial.funeralDirectorUid === user.uid) {
    return { hasAccess: true, accessLevel: 'edit' };
  }
  
  return { hasAccess: false, accessLevel: 'none' };
}
```

#### Edit Access

```typescript
static async checkEditAccess(memorialId: string, user: UserContext) {
  // Admin: full edit access
  if (user.role === 'admin') {
    return { hasAccess: true, accessLevel: 'admin' };
  }
  
  const memorial = await fetchMemorial(memorialId);
  
  // Owner: can edit their memorial
  if (memorial.ownerUid === user.uid) {
    return { hasAccess: true, accessLevel: 'admin' };
  }
  
  // Funeral director: can edit assigned memorials
  if (user.role === 'funeral_director' && memorial.funeralDirectorUid === user.uid) {
    return { hasAccess: true, accessLevel: 'edit' };
  }
  
  return { hasAccess: false, accessLevel: 'none', reason: 'no_permission' };
}
```

---

### Middleware Usage

**Pattern:** All sensitive API endpoints use permission checks

```typescript
// Example from memorial API
import { requireEditAccess } from '$lib/utils/memorialAccess';

export const POST: RequestHandler = async ({ params, locals }) => {
  await requireEditAccess({
    memorialId: params.id,
    user: locals.user
  });
  
  // Proceed with operation
};
```

---

## Email Templates & Notifications

### 1. Funeral Director Welcome Email

**Function:** `sendFuneralDirectorWelcomeEmail()`

**Trigger:** After successful funeral director registration

**Data:**
```typescript
{
  email: string;
  displayName: string;
}
```

**SendGrid Template:** To be configured

**Content:**
- Welcome message
- Dashboard link
- Getting started guide
- Support contact information

---

### 2. Family Registration Email (from FD)

**Function:** `sendFuneralDirectorRegistrationEmail()`

**Trigger:** After funeral director creates memorial for family

**Data:**
```typescript
{
  email: string;
  familyName: string;
  lovedOneName: string;
  memorialUrl: string;
  password?: string; // Only for new accounts
  additionalNotes?: string;
  calculatorMagicLink?: string;
}
```

**SendGrid Template ID:** Dynamic template

**Content:**
- Personalized greeting
- Memorial URL
- Login credentials (new users only)
- Calculator magic link (direct access to schedule/payment)
- Funeral director contact info
- Additional notes from FD
- Next steps instructions

**Magic Link Format:**
```
{baseUrl}/auth/session?token={customToken}&redirect=schedule/{memorialId}
```

**Token Claims:**
```typescript
{
  role: 'owner',
  email: familyEmail,
  memorial_id: memorialId
}
```

---

### 3. Enhanced Registration Email

**Function:** `sendEnhancedRegistrationEmail()`

**Used for:** Comprehensive memorial creation via API

**Data:**
```typescript
{
  email: string;
  password: string;
  lovedOneName: string;
  tributeUrl: string;
  familyContactName: string;
  familyContactEmail: string;
  familyContactPhone: string;
  contactPreference: 'email' | 'phone';
  directorName: string;
  directorEmail: string;
  funeralHomeName: string;
}
```

**Content:**
- Complete welcome package
- All memorial details
- Funeral home information
- Family contact details
- Login credentials
- Memorial customization instructions

---

## Database Collections

### 1. funeral_directors Collection

**Path:** `funeral_directors/{uid}`

**Document Structure:**
```typescript
{
  id: string; // Same as document ID (user UID)
  
  // Basic Information
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  
  // Address
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  
  // Status
  status: 'approved' | 'suspended' | 'inactive';
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
  approvedAt?: Timestamp; // Admin approval timestamp
  approvedBy?: string; // Admin UID who approved
  
  // Optional fields (future)
  licenseNumber?: string;
  website?: string;
  serviceArea?: string[];
  isActive?: boolean;
}
```

**Indexes:**
- Primary: Document ID (uid)
- Status index (for admin queries)
- Email index (for lookup)

**Access Rules:**
- Owner: Read/Write own document
- Admin: Read all documents
- Public: No access

---

### 2. memorials Collection (Funeral Director Fields)

**Relevant Fields:**
```typescript
{
  // ... other memorial fields
  
  // Funeral Director Tracking
  funeralDirectorUid: string; // UID of funeral director
  funeralDirector: {
    id: string;
    companyName: string;
    contactPerson: string;
    phone: string;
    email: string;
    licenseNumber?: string;
  };
  
  // Creation tracking
  createdBy: string; // UID (could be FD or owner)
  createdByRole: 'admin' | 'owner' | 'funeral_director';
  
  // Permissions
  permissions: {
    funeralDirectorCanEdit: boolean;
  };
  
  // Service information (populated by FD)
  services: {
    main: {
      location: {
        name: string;
        address: string;
        isUnknown: boolean;
      };
      time: {
        date: string | null;
        time: string | null;
        isUnknown: boolean;
      };
      hours: number;
    };
    additional: Array<any>; // Additional service days
  };
  
  // Legacy fields (backward compatibility)
  directorFullName?: string;
  funeralHomeName?: string;
  directorEmail?: string;
}
```

**Queries Used by Funeral Directors:**
```typescript
// Get all memorials managed by FD
memorials
  .where('funeralDirector.id', '==', funeralDirectorUid)
  .orderBy('createdAt', 'desc')

// Alternative query
memorials
  .where('funeralDirectorUid', '==', funeralDirectorUid)
  .orderBy('createdAt', 'desc')
```

---

### 3. users Collection (Funeral Director-Created Users)

**Special Fields:**
```typescript
{
  // ... standard user fields
  
  // Tracking
  createdByFuneralDirector?: string; // FD UID
  createdBy?: string; // Generic creator UID
  createdByRole?: 'funeral_director';
  
  // Contact preferences (set by FD during registration)
  familyContactName?: string;
  familyContactPhone?: string;
  contactPreference?: 'email' | 'phone';
  
  // Memorial associations
  primaryMemorialId?: string;
  memorialIds?: string[];
  memorialCount?: number;
}
```

---

## Complete User Journey

### Journey 1: Funeral Director Onboarding

```
┌─────────────────────────────────────────────────────────────┐
│ STEP 1: Discovery                                            │
│ - Visits /for-funeral-directors marketing page               │
│ - Learns about features and benefits                         │
│ - Clicks "Create Your Director Account"                      │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 2: Sign Up                                              │
│ - Navigates to /register or /register/funeral-home           │
│ - Creates Firebase Auth account (email/password)             │
│ - Basic account created with 'owner' role initially          │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 3: Complete Funeral Director Profile                    │
│ - POST /api/funeral-director/register                        │
│ - Provides: Company name, contact person, email, phone, address│
│ - Role changed to 'funeral_director' via custom claims       │
│ - Status set to 'approved' (auto-approved in V1)             │
│ - Document created in funeral_directors collection           │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 4: Access Dashboard                                     │
│ - Session refreshed with new role                            │
│ - Redirected to /profile or /funeral-director/dashboard      │
│ - Navbar shows funeral director specific links               │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 5: Ready to Create Memorials                            │
│ - Can access /register/funeral-director                      │
│ - Can manage profile at /funeral-director/dashboard          │
│ - Can view managed memorials at /profile                     │
└─────────────────────────────────────────────────────────────┘
```

---

### Journey 2: Creating Memorial for Family (Quick Flow)

```
┌─────────────────────────────────────────────────────────────┐
│ STEP 1: Navigate to Quick Registration                       │
│ - Funeral director logs in                                   │
│ - Clicks "Quick Family Registration" in navbar               │
│ - OR navigates to /register/funeral-director                 │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 2: Form Pre-Population                                  │
│ - Page loads funeral director profile                        │
│ - Director name, email, funeral home auto-filled             │
│ - Form ready for family information input                    │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 3: Fill Out Family Information                          │
│ - Loved one's name (required)                                │
│ - Family contact email (required)                            │
│ - Family contact phone (required)                            │
│ - Service details (optional)                                 │
│ - Additional notes (optional)                                │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 4: Submit Form                                          │
│ - Client-side validation runs                                │
│ - Form submitted to server                                   │
│ - Loading state shown                                        │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 5: Server Processing                                    │
│ - Check if family email already has account                  │
│   - YES: Use existing account, add memorial                  │
│   - NO: Create new account with random password              │
│ - Generate unique memorial slug                              │
│ - Create memorial document with FD tracking                  │
│ - Link memorial to funeral director                          │
│ - Index in Algolia for search                                │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 6: Email Notification                                   │
│ - Generate calculator magic link                             │
│ - Send email to family with:                                 │
│   - Memorial URL                                             │
│   - Login credentials (if new user)                          │
│   - Direct link to schedule/calculator                       │
│   - Funeral director contact info                            │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 7: Success Confirmation                                 │
│ - Success message shown on page                              │
│ - Memorial URL displayed                                     │
│ - Family email confirmed                                     │
│ - Auto-redirect to /profile after 3 seconds                  │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 8: Family Receives Email                                │
│ - Family clicks memorial link                                │
│ - OR clicks calculator magic link for direct access          │
│ - New users: Log in with provided credentials                │
│ - Existing users: Already authenticated or log in normally   │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 9: Family Manages Memorial                              │
│ - View memorial page                                         │
│ - Customize content, photos, videos                          │
│ - Configure livestream schedule                              │
│ - Set up payment/calculator                                  │
│ - Funeral director maintains edit access                     │
└─────────────────────────────────────────────────────────────┘
```

---

### Journey 3: Managing Existing Memorials

```
┌─────────────────────────────────────────────────────────────┐
│ STEP 1: Access Profile                                       │
│ - Funeral director navigates to /profile                     │
│ - System queries memorials by funeralDirector.id             │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 2: View Memorial List                                   │
│ - Memorials displayed with:                                  │
│   - Loved one's name                                         │
│   - Creation date                                            │
│   - Memorial URL                                             │
│   - Family contact info                                      │
│   - Edit link                                                │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 3: Click Memorial to View/Edit                          │
│ - Navigate to memorial page /[fullSlug]                      │
│ - OR edit page /[fullSlug]/edit                              │
│ - Permission check passes (FD has edit access)               │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 4: Edit Memorial                                        │
│ - Update service details                                     │
│ - Help family with content                                   │
│ - Configure livestream settings                              │
│ - All changes tracked with FD UID                            │
└─────────────────────────────────────────────────────────────┘
```

---

## Summary

The Funeral Director role in TributeStream provides a complete system for funeral homes to:

1. **Register** their business profile with contact and address details
2. **Create memorials** quickly for families with full service information
3. **Manage** created memorials with edit permissions
4. **Track** all memorials they've created via dashboard
5. **Communicate** with families through automated email notifications

**Key Technical Points:**
- Role stored in Firebase custom claims: `{ role: 'funeral_director' }`
- Profile stored in Firestore: `funeral_directors/{uid}`
- Memorial association via `funeralDirectorUid` and `funeralDirector.id`
- Auto-approved status in V1 (future: approval workflow)
- Edit permissions automatically granted for created memorials
- Email automation for family onboarding and communication

**Data Flow Architecture:**
- Session-based authentication via Firebase
- Server-side permission checks on all sensitive operations
- Firestore queries for memorial management
- SendGrid for email delivery
- Algolia for memorial search indexing

**UI/UX:**
- Amber/orange color theme for funeral director pages
- Pre-populated forms for efficiency
- Role-specific navigation and dashboard
- Responsive design for mobile access
- Clear success/error messaging

---

**End of Documentation**
