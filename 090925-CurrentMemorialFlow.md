# TributeStream User Flow Analysis: Memorial Collections and APIs

**Date:** September 9, 2025  
**Analysis of:** Complete user journey from memorial creation to payment completion

## Complete User Flow

### 1. **Homepage Portal → Memorial Creation**
**Route:** `/` → `/register/loved-one`

**Collections Used:**
- `users` - Creates new user account with owner role
- `memorials` - Creates new memorial document

**APIs/Code:**
- **Frontend:** `/routes/+page.svelte` - Homepage with "Create Tribute" button
- **Server:** `/routes/register/loved-one/+page.server.ts` - Memorial creation logic
- **Process:**
  1. User enters loved one's name on homepage
  2. Redirects to `/register/loved-one?name={lovedOneName}`
  3. Creates Firebase Auth user with random password
  4. Sets custom claim `role: 'owner'`
  5. Creates user profile in `users` collection
  6. Creates memorial in `memorials` collection with:
     - `lovedOneName`, `slug`, `fullSlug`
     - `createdByUserId`, `creatorEmail`, `creatorUid`
     - Auto-generated slug: `celebration-of-life-for-{name}`
  7. Indexes memorial in Algolia for search
  8. Sends registration email with login credentials
  9. Auto-login via custom token redirect

### 2. **Custom Memorial Page Display**
**Route:** `/tributes/[fullSlug]`

**Collections Used:**
- `memorials` - Retrieves memorial data by slug
- `memorials/{id}/followers` - Checks if user is following

**APIs/Code:**
- **Server:** `/routes/tributes/[fullSlug]/+page.server.ts`
- **Frontend:** `/routes/tributes/[fullSlug]/+page.svelte`
- **Process:**
  1. Queries `memorials` collection where `slug == fullSlug`
  2. Converts Firestore timestamps to ISO strings
  3. Checks ownership (`locals.user.uid === memorial.createdByUserId`)
  4. Checks follow status in subcollection
  5. Displays memorial with livestream player, photos, follow button

### 3. **Profile Page Navigation**
**Route:** `/profile`

**Collections Used:**
- `users` - User profile data
- `memorials` - User's owned memorials (where `creatorUid == user.uid`)

**APIs/Code:**
- **Server:** `/routes/profile/+page.server.ts`
- **Component:** `/lib/components/Profile.svelte`
- **Process:**
  1. Loads user profile from `users` collection
  2. Queries memorials owned by user
  3. Converts timestamps safely
  4. Displays role-specific UI (Owner/Funeral Director themes)
  5. Shows memorial cards with "Schedule" buttons

### 4. **Schedule Configuration**
**Route:** `/schedule?memorialId={id}` or `/schedule/[memorialId]`

**Collections Used:**
- `memorials` - Memorial data and calculator config storage

**APIs/Code:**
- **Frontend:** `/routes/schedule/+page.svelte` - Main calculator interface
- **Server:** `/routes/schedule/[memorialId]/+page.server.ts` - Memorial-specific route
- **Auto-save API:** `/api/memorials/[memorialId]/schedule/auto-save/+server.ts`
- **Process:**
  1. Loads memorial data and existing calculator config
  2. Real-time form with tier selection, service details, add-ons
  3. Auto-saves every 2 seconds to `memorials.calculatorConfig`
  4. Calculates pricing dynamically using Svelte 5 runes
  5. Stores form data in nested structure:
     ```
     memorial.calculatorConfig = {
       formData: { selectedTier, mainService, addons, etc. },
       autoSave: { formData, timestamp, lastModifiedBy },
       status: 'draft'
     }
     ```

### 5. **Save and Pay Later**
**Action:** Click "Save and Pay Later" button

**Collections Used:**
- `memorials` - Updates calculator config with draft status

**APIs/Code:**
- **Function:** `handleSaveAndPayLater()` in schedule page
- **API:** `/api/memorials/[memorialId]/schedule/auto-save/+server.ts` (POST)
- **Process:**
  1. Validates memorial permissions (owner, funeral director, family member)
  2. Saves complete schedule configuration to `memorial.calculatorConfig`
  3. Sets status to 'draft'
  4. Redirects to `/profile`

### 6. **Return to Schedule**
**Route:** Back to `/schedule?memorialId={id}`

**Collections Used:**
- `memorials` - Retrieves saved calculator config

**APIs/Code:**
- **Auto-save API:** `/api/memorials/[memorialId]/schedule/auto-save/+server.ts` (GET)
- **Process:**
  1. Loads existing `calculatorConfig.autoSave.formData`
  2. Populates all form fields with saved data
  3. Continues auto-saving changes
  4. Maintains pricing calculations

### 7. **Payment Processing**
**Route:** `/schedule` → `/payment`

**Collections Used:**
- `memorials` - Payment history and status updates

**APIs/Code:**
- **Payment Intent:** `/api/create-payment-intent/+server.ts`
- **Payment Page:** `/routes/payment/+page.svelte`
- **Process:**
  1. Click "Book Now" calls `handleBookNow()`
  2. Creates Stripe payment intent via API
  3. Updates memorial with:
     ```
     memorial.paymentHistory[] = {
       paymentIntentId, status: 'pending', amount, createdAt
     }
     memorial.calculatorConfig.status = 'pending_payment'
     memorial.calculatorConfig.paymentIntentId = paymentIntentId
     ```
  4. Redirects to payment page with encoded booking data
  5. Stripe payment confirmation
  6. Success redirect to receipt page

## Key Memorial Collection Fields

The `memorials` collection stores comprehensive data:

```typescript
{
  // Basic Info
  lovedOneName: string,
  slug: string,
  fullSlug: string,
  
  // Ownership
  createdByUserId: string,
  creatorUid: string, // legacy
  ownerUid: string,
  funeralDirectorUid?: string,
  
  // Calculator Configuration
  calculatorConfig: {
    formData: CalculatorFormData,
    autoSave: { formData, timestamp, lastModifiedBy },
    status: 'draft' | 'pending_payment' | 'paid',
    paymentIntentId?: string
  },
  
  // Payment History
  paymentHistory: [{
    paymentIntentId: string,
    status: string,
    amount: number,
    createdAt: Timestamp
  }],
  
  // Timestamps
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

## Permission System

All APIs implement comprehensive permission checking:
- **Admin:** Full access to all memorials
- **Owner:** Access via `ownerUid` or `createdByUserId` match
- **Funeral Director:** Access via `funeralDirectorUid` match  
- **Family Member:** Access via `familyMemberUids` array inclusion

## Key API Endpoints Summary

| Endpoint | Method | Purpose | Collections |
|----------|--------|---------|-------------|
| `/register/loved-one` | POST | Create memorial & user | `users`, `memorials` |
| `/tributes/[fullSlug]` | GET | Display memorial page | `memorials`, `followers` |
| `/profile` | GET | Load user memorials | `users`, `memorials` |
| `/api/memorials/[id]/schedule/auto-save` | GET/POST | Save/load schedule config | `memorials` |
| `/api/create-payment-intent` | POST | Create Stripe payment | `memorials` |
| `/payment` | GET | Process payment | `memorials` |

## Technical Implementation Notes

- **Auto-save:** Debounced 2-second intervals using Svelte 5 `$effect()` runes
- **Permissions:** Consistent across all APIs with role-based access control
- **Data Flow:** Memorial document serves as single source of truth
- **Payment Integration:** Stripe with webhook support for status updates
- **Search:** Algolia indexing for memorial discovery
- **Authentication:** Firebase Auth with custom claims for role management

This flow demonstrates a complete memorial lifecycle from creation through payment, with robust auto-saving, permission controls, and seamless user experience transitions.
