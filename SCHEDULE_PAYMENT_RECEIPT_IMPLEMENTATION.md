# Schedule Page Payment Receipt Implementation Plan

## Overview
Transform the schedule calculator page (`/schedule/[memorialId]`) to show a summary receipt when a memorial is marked as paid, while allowing users to request edits through a form submission system.

---

## 1. Schedule Page Conditional Rendering

### Current Behavior
- Always shows calculator form regardless of payment status
- Users can edit services, tiers, add-ons freely

### New Behavior
- **Check `memorial.isPaid` flag** on page load
- **If UNPAID**: Show calculator form (existing behavior)
- **If PAID**: Show receipt summary with edit request button

### Files to Modify
- `/routes/schedule/[memorialId]/+page.server.ts` - Add `isPaid` to loaded data
- `/routes/schedule/[memorialId]/+page.svelte` - Add conditional rendering

---

## 2. Receipt Summary Component

### Design
Reuse existing receipt page styling from `/payment/receipt/+page.svelte`

### Data Source
Use `memorial.calculatorConfig` fields:
```typescript
{
  bookingItems: [
    { name: string, price: number, quantity: number, total: number }
  ],
  total: number,
  status: 'paid',
  paidAt: Timestamp,
  paymentIntentId?: string,
  checkoutSessionId?: string,
  formData: {
    selectedTier: 'record' | 'live' | 'legacy',
    addons: { ... }
  }
}
```

### Display Sections

#### A. Payment Status Header
```
✅ Payment Confirmed
Your memorial service booking is confirmed and paid
```

#### B. Package Summary
- Tier name (Tributestream Record/Live/Legacy)
- Base price
- Service date and time (from `memorial.services.main.time`)
- Location (from `memorial.services.main.location`)

#### C. Order Details
- Line items from `calculatorConfig.bookingItems[]`
- Each item: name, quantity, price, total
- **Total Paid**: Bold, prominent

#### D. Payment Information (if available)
- Payment Date: `calculatorConfig.paidAt`
- Payment Method: 
  - If `manualPayment` exists: Show method (cash, check, etc.)
  - If `checkoutSessionId` exists: "Credit Card (Stripe)"
  - Otherwise: "Payment Confirmed"
- Payment ID: `paymentIntentId` or `checkoutSessionId`
- Marked by: `manualPayment.markedPaidBy` (for admin payments)

#### E. Service Details
- Main service: Date, time, location, hours
- Additional services (if any)
  - Additional Location
  - Additional Day

#### F. Actions
- **"Request Schedule Changes"** button (primary)
- **"View Memorial Page"** link
- **"Manage Streams"** link
- **"Download Receipt"** button (optional)

### Missing Data Handling
If `calculatorConfig.bookingItems` is missing or empty:
```
✅ Payment Confirmed

This memorial service has been marked as paid.

Memorial: [lovedOneName]
Status: Paid
Payment Date: [paidAt or createdAt]

[Request Schedule Changes button]
[View Memorial Page link]
```

---

## 3. Edit Request System

### User Flow
1. User clicks "Request Schedule Changes" button
2. Modal/form appears with:
   - **Textarea**: "Describe the changes you'd like to make"
   - **Character limit**: 500 characters
   - **Required field**
3. User submits request
4. Request saved to Firestore
5. Success message: "Edit request submitted. Our team will review and contact you."

### Data Structure

#### New Collection: `schedule_edit_requests`
```typescript
{
  id: string,                    // Auto-generated
  memorialId: string,            // Reference to memorial
  memorialName: string,          // For quick reference
  requestedBy: string,           // User UID
  requestedByEmail: string,      // User email
  requestDetails: string,        // User's description
  status: 'pending' | 'approved' | 'denied' | 'completed',
  createdAt: Timestamp,
  reviewedAt?: Timestamp,
  reviewedBy?: string,           // Admin UID
  adminNotes?: string,           // Admin response/notes
  
  // Snapshot of current config for reference
  currentConfig: {
    tier: string,
    services: {...},
    bookingItems: [...],
    total: number
  }
}
```

### API Endpoint
**POST** `/api/memorials/[memorialId]/schedule/request-edit`

```typescript
// Request body
{
  requestDetails: string
}

// Response
{
  success: boolean,
  requestId: string,
  message: string
}

// Permissions: memorial owner, funeral director, or admin
```

---

## 4. Admin Panel Enhancement

### New Section: "Schedule Edit Requests"
Location: Admin portal Overview tab or new dedicated tab

### UI Components

#### A. Requests List View
Table with columns:
- **Memorial Name** (with link to memorial)
- **Requested By** (email)
- **Request Date**
- **Status Badge** (pending/approved/denied/completed)
- **Actions**

#### B. Request Detail Modal
When admin clicks on a request:

```
Schedule Edit Request

Memorial: [Name] [View Memorial link]
Requested by: [Email] on [Date]
Status: [Badge]

CURRENT BOOKING
Tier: Tributestream Live - $1,299
Main Service: [Date/Time/Location]
[Additional services if any]
Total: $X,XXX

REQUESTED CHANGES
[User's description text]

ADMIN ACTIONS
[Textarea for admin notes]
[Approve] [Deny] [Mark Completed] [Close]
```

#### C. Status Management
- **Pending**: New requests (yellow badge)
- **Approved**: Admin approved, waiting for implementation (green badge)
- **Denied**: Admin rejected request (red badge)
- **Completed**: Changes applied (gray badge)

#### D. Filters
- Status filter dropdown
- Date range filter
- Search by memorial name or requester email

### Admin Actions API
**PATCH** `/api/admin/schedule-edit-requests/[requestId]`

```typescript
// Request body
{
  status: 'approved' | 'denied' | 'completed',
  adminNotes: string
}

// Permissions: admin only
```

---

## 5. Implementation Steps

### Phase 1: Schedule Page Receipt (2-3 hours)
1. ✅ Update `+page.server.ts` to include `isPaid` in loaded data
2. ✅ Create receipt component reusing existing styling
3. ✅ Add conditional rendering in schedule page
4. ✅ Handle missing data scenarios
5. ✅ Test with paid and unpaid memorials

### Phase 2: Edit Request System (2-3 hours)
1. ✅ Create edit request modal component
2. ✅ Build API endpoint for submitting requests
3. ✅ Create Firestore collection and security rules
4. ✅ Add success/error messaging
5. ✅ Test request submission flow

### Phase 3: Admin Panel Integration (3-4 hours)
1. ✅ Add "Schedule Edit Requests" section to AdminPortal
2. ✅ Create requests list table
3. ✅ Build request detail modal
4. ✅ Implement status update API
5. ✅ Add filters and search
6. ✅ Test admin workflow

### Phase 4: Notifications (Optional - 1-2 hours)
1. ✅ Email notification to admin when request submitted
2. ✅ Email notification to user when request status changes
3. ✅ Badge count for pending requests in admin nav

---

## 6. Technical Specifications

### TypeScript Interfaces

```typescript
// Add to memorial.ts
export interface Memorial {
  // ... existing fields
  isPaid?: boolean;
  paymentStatus?: 'paid' | 'unpaid';
  paidAt?: Timestamp;
  manualPayment?: ManualPaymentInfo;
  calculatorConfig?: CalculatorConfig;
}

export interface ManualPaymentInfo {
  markedPaidBy: string;
  markedPaidAt: Timestamp;
  method: 'cash' | 'check' | 'venmo' | 'zelle' | 'manual';
  notes?: string;
}

export interface CalculatorConfig {
  status: 'draft' | 'paid';
  isPaid?: boolean;
  paidAt?: Timestamp;
  bookingItems?: BookingItem[];
  total?: number;
  paymentIntentId?: string;
  checkoutSessionId?: string;
  formData?: CalculatorFormData;
  lastModified?: Timestamp;
  lastModifiedBy?: string;
}

// New file: schedule-edit-request.ts
export interface ScheduleEditRequest {
  id: string;
  memorialId: string;
  memorialName: string;
  requestedBy: string;
  requestedByEmail: string;
  requestDetails: string;
  status: 'pending' | 'approved' | 'denied' | 'completed';
  createdAt: Timestamp;
  reviewedAt?: Timestamp;
  reviewedBy?: string;
  reviewedByEmail?: string;
  adminNotes?: string;
  currentConfig: {
    tier: string;
    services: any;
    bookingItems: BookingItem[];
    total: number;
  };
}
```

### Firestore Security Rules

```javascript
// Add to firestore.rules
match /schedule_edit_requests/{requestId} {
  // Users can create requests for their own memorials
  allow create: if request.auth != null 
    && request.resource.data.requestedBy == request.auth.uid;
  
  // Users can read their own requests
  allow read: if request.auth != null 
    && (resource.data.requestedBy == request.auth.uid 
        || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
  
  // Only admins can update
  allow update: if request.auth != null 
    && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
  
  // No deletes (keep audit trail)
  allow delete: if false;
}
```

### Component Structure

```
/routes/schedule/[memorialId]/
  +page.svelte                    # Main page with conditional rendering
  +page.server.ts                 # Load isPaid status
  _components/
    ScheduleReceipt.svelte        # Receipt summary component
    EditRequestModal.svelte       # Edit request form modal

/lib/components/admin/
  ScheduleEditRequests.svelte     # Admin panel section
  EditRequestDetail.svelte        # Request detail modal

/routes/api/memorials/[memorialId]/schedule/
  request-edit/+server.ts         # User request submission

/routes/api/admin/schedule-edit-requests/
  [requestId]/+server.ts          # Admin status updates
  +server.ts                      # List/filter requests
```

---

## 7. User Experience Flow

### Scenario A: Unpaid Memorial
1. User visits `/schedule/{memorialId}`
2. Sees full calculator interface
3. Can edit services, tiers, add-ons
4. Clicks "Save and Pay Later" or "Book Now"

### Scenario B: Paid Memorial (Full Data)
1. User visits `/schedule/{memorialId}`
2. Sees receipt summary with:
   - ✅ Payment confirmed header
   - Package details (Tributestream Live - $1,299)
   - Service details (date, time, location)
   - Line items breakdown
   - Payment information
3. Clicks "Request Schedule Changes"
4. Modal opens with textarea
5. Submits request
6. Sees success message
7. Can view memorial or manage streams

### Scenario C: Paid Memorial (Missing Data)
1. User visits `/schedule/{memorialId}`
2. Sees generic paid confirmation:
   - ✅ Payment confirmed
   - Memorial name
   - Status: Paid
3. Can request changes or view memorial

### Scenario D: Admin Reviews Request
1. Admin logs into admin portal
2. Sees badge: "3 pending schedule requests"
3. Clicks on "Schedule Edit Requests" tab
4. Reviews list of requests
5. Clicks on a request
6. Sees modal with:
   - Current booking details
   - User's requested changes
   - Admin notes field
7. Approves/denies with notes
8. System sends email to user

---

## 8. Testing Checklist

### Schedule Page
- [ ] Unpaid memorial shows calculator
- [ ] Paid memorial with full data shows receipt
- [ ] Paid memorial with missing data shows generic message
- [ ] Receipt displays all booking items correctly
- [ ] Payment information displays correctly
- [ ] Manual payment shows correct method
- [ ] Stripe payment shows card payment
- [ ] Service details display correctly
- [ ] Links navigate correctly

### Edit Request System
- [ ] Modal opens on button click
- [ ] Form validation works (required field, character limit)
- [ ] Submission creates Firestore document
- [ ] Success message displays
- [ ] Error handling works
- [ ] Only authorized users can submit
- [ ] Cannot submit for unpaid memorials

### Admin Panel
- [ ] Requests list loads correctly
- [ ] Status badges display correct colors
- [ ] Filters work (status, date, search)
- [ ] Request detail modal shows complete information
- [ ] Admin can update status
- [ ] Admin notes save correctly
- [ ] Only admins can access
- [ ] Pagination works (if implemented)

### Edge Cases
- [ ] Memorial with no calculatorConfig
- [ ] Memorial with partial calculatorConfig
- [ ] Memorial marked paid by admin (manual)
- [ ] Memorial paid via Stripe
- [ ] User has no permission
- [ ] Multiple edit requests for same memorial
- [ ] Request for deleted memorial

---

## 9. Future Enhancements (Out of Scope)

### Automated Approval Workflow
- Auto-approve minor changes (time adjustments < 1 hour)
- Require approval for price-affecting changes

### In-place Editing
- Allow admin to edit schedule directly from request modal
- Apply changes immediately on approval

### Request History
- Show previous edit requests on schedule page
- Timeline view of all changes

### Email Templates
- Customizable email templates for notifications
- Include change summary in emails

### Analytics
- Track most common edit requests
- Response time metrics
- Approval/denial rates

---

## 10. Success Metrics

### User Metrics
- % of users accessing schedule page post-payment
- Edit request submission rate
- User satisfaction with edit process

### Admin Metrics
- Average response time to edit requests
- Approval vs denial rate
- Number of pending requests over time

### System Metrics
- Page load time for receipt view
- API response times
- Error rates

---

## Implementation Priority

**HIGH PRIORITY** (Must Have)
- Schedule page conditional rendering
- Receipt summary with available data
- Edit request submission
- Admin panel requests list

**MEDIUM PRIORITY** (Should Have)
- Request detail modal
- Status management
- Filters and search
- Email notifications

**LOW PRIORITY** (Nice to Have)
- Download receipt button
- Request history
- Advanced analytics
- Automated approval rules

---

## Estimated Timeline

- **Phase 1**: Schedule Receipt - 2-3 hours
- **Phase 2**: Edit Request System - 2-3 hours  
- **Phase 3**: Admin Integration - 3-4 hours
- **Testing & Polish**: 1-2 hours

**Total**: 8-12 hours of development

---

## Dependencies

### Required
- Existing receipt page styling
- Admin portal component
- Memorial type with isPaid field
- User authentication

### Optional
- Email service (SendGrid/Firebase) for notifications
- Badge notification component

---

## Security Considerations

1. **Authorization**: Only memorial owners, funeral directors, or admins can submit edit requests
2. **Data Validation**: Sanitize user input for request details
3. **Rate Limiting**: Prevent spam requests (max 3 per memorial per day)
4. **Audit Trail**: Keep all requests for compliance (no deletes)
5. **Admin-only Updates**: Only admins can change request status
6. **Session Verification**: Validate user session on all API calls

---

## Questions Resolved

✅ **Receipt Design**: Reuse existing `/payment/receipt` styling  
✅ **Payment Details**: Show if available (manual or Stripe)  
✅ **Edit Capability**: Request form with admin approval workflow  
✅ **Missing Data**: Generic "paid" message  
✅ **Actions**: Request changes, view memorial, manage streams  

---

## Ready to Implement?

This plan covers:
- Complete user experience flow
- Technical specifications
- Admin panel enhancements
- Security and testing
- Clear implementation phases

**Next Step**: Review this plan and confirm before starting implementation.
