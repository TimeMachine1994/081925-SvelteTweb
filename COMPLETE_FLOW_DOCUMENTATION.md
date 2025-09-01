# TributeStream Complete Flow Documentation
## User Flow, Data Flow & Firebase Operations: Login → Portal → Calculator → Checkout

This document provides a comprehensive breakdown of the complete user journey and technical implementation for recreating the TributeStream application.

---

## 🔄 **COMPLETE USER FLOW**

### **1. LOGIN FLOW**
```
User visits /login → Enters credentials → Firebase Auth → Session Creation → Redirect to /my-portal
```

**Components:**
- `/routes/login/+page.svelte` → `Login.svelte`
- `/routes/api/session/+server.ts`

**User Actions:**
1. User enters email/password OR clicks Google Sign-in
2. Firebase Authentication validates credentials
3. Client gets Firebase ID token
4. POST to `/api/session` with ID token
5. Server creates session cookie (5-day expiry)
6. Redirect to `/my-portal`

---

### **2. MY PORTAL FLOW**
```
/my-portal loads → Server fetches user's memorials → Display latest memorial + older cards → User actions
```

**Components:**
- `/routes/my-portal/+page.svelte` → `OwnerPortal.svelte`
- `/routes/my-portal/+page.server.ts`

**User Experience:**
1. **Latest Memorial** (full display at top)
   - Loved one's name prominently displayed
   - "Latest" badge
   - Status badge (Complete/In Progress/Setup Required)
   - Livestream link
   - Package details
   - Edit/manage buttons
   - Delete button (if unpaid)

2. **Older Memorials** (collapsible cards)
   - Loved one's name + status in header
   - Click to expand/collapse
   - Compact actions when expanded
   - Delete functionality for unpaid

**User Actions:**
- View memorial livestream page
- Edit memorial details → Calculator
- Manage photos
- Delete unpaid memorials
- Create new memorial

---

### **3. CALCULATOR FLOW**
```
Calculator loads → Configure package → Add services → Calculate total → Proceed to checkout
```

**Components:**
- `/routes/app/calculator/+page.svelte` → `Calculator.svelte`
- `/routes/app/calculator/+page.server.ts`
- `StripeCheckout.svelte`

**User Experience:**
1. **Package Selection**
   - Basic/Standard/Premium tiers
   - Service date/time selection
   - Location details

2. **Additional Services**
   - Recording options
   - Extended streaming
   - Additional features

3. **Payment Processing**
   - Real-time total calculation
   - Stripe payment form
   - Payment intent creation

**User Actions:**
- Select livestream package
- Configure service details
- Add additional services
- Review total cost
- Enter payment information
- Submit payment

---

### **4. CHECKOUT FLOW**
```
Payment submitted → Stripe processing → Success page → Email receipt → Update memorial status
```

**Components:**
- `/routes/app/checkout/success/+page.svelte`
- `/routes/app/checkout/success/+page.server.ts`

**User Experience:**
1. Payment processing indicator
2. Success confirmation
3. Receipt email sent
4. Memorial status updated
5. Return to portal

---

## 🗄️ **FIREBASE DATA FLOW**

### **Collections & Documents Structure**

#### **1. memorials**
```javascript
{
  id: "memorial_id",
  lovedOneName: "John Doe",
  slug: "john-doe-memorial",
  creatorUid: "user_uid",
  creatorEmail: "user@example.com",
  memorialDate: "2024-01-15",
  memorialTime: "14:00",
  memorialLocationName: "St. Mary's Church",
  imageUrl: "https://...",
  isPublic: true,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

#### **2. livestreamConfigurations**
```javascript
{
  id: "config_id",
  memorialId: "memorial_id",
  userId: "user_uid",
  formData: {
    selectedTier: "standard",
    serviceDate: "2024-01-15",
    serviceTime: "14:00"
  },
  bookingItems: [
    {
      name: "Standard Package",
      price: 299,
      quantity: 1
    }
  ],
  total: 299,
  paymentStatus: "paid|unpaid|processing",
  stripePaymentIntentId: "pi_...",
  createdAt: Timestamp
}
```

#### **3. invitations**
```javascript
{
  id: "invitation_id",
  memorialId: "memorial_id",
  inviteeEmail: "family@example.com",
  status: "pending|accepted|declined",
  createdAt: Timestamp
}
```

#### **4. users (Firebase Auth + Custom Claims)**
```javascript
// Firebase Auth User
{
  uid: "user_uid",
  email: "user@example.com",
  displayName: "User Name"
}

// Custom Claims
{
  role: "owner|family_member|viewer|admin",
  admin: false
}
```

---

## 🔥 **FIREBASE OPERATIONS BY FLOW**

### **LOGIN OPERATIONS**
```javascript
// Client-side (Login.svelte)
signInWithEmailAndPassword(auth, email, password)
userCredential.user.getIdToken()

// Server-side (/api/session)
adminAuth.createSessionCookie(idToken, { expiresIn })
cookies.set('session', sessionCookie)
```

### **MY PORTAL OPERATIONS**
```javascript
// Server-side (+page.server.ts)
// Query user's memorials
memorialsRef.where('creatorUid', '==', userId).orderBy('createdAt', 'desc').get()

// For each memorial, get livestream config
livestreamConfigsRef.where('memorialId', '==', memorialId).limit(1).get()

// Get invitations
invitationsRef.where('memorialId', 'in', memorialIds).get()
```

### **CALCULATOR OPERATIONS**
```javascript
// Load existing config
livestreamConfigsRef.doc(memorialId).get()

// Load memorial data
memorialsRef.doc(memorialId).get()

// Save/update configuration
livestreamConfigsRef.doc(memorialId).set({
  formData,
  bookingItems,
  total,
  paymentStatus: 'unpaid',
  stripePaymentIntentId,
  updatedAt: Timestamp.now()
})

// Create Stripe payment intent
stripe.paymentIntents.create({
  amount: total * 100,
  currency: 'usd',
  metadata: { memorialId, userId }
})
```

### **CHECKOUT OPERATIONS**
```javascript
// Update payment status
livestreamConfigsRef.doc(configId).update({
  paymentStatus: 'paid',
  updatedAt: Timestamp.now()
})

// Send receipt email
sendReceiptEmail(userEmail, receiptData)
```

### **DELETE MEMORIAL OPERATIONS**
```javascript
// Batch delete all related data
const batch = adminDb.batch()

// Delete livestream config
batch.delete(livestreamConfigRef)

// Delete invitations
invitationsSnapshot.docs.forEach(doc => batch.delete(doc.ref))

// Delete embeds subcollection
embedsSnapshot.docs.forEach(doc => batch.delete(doc.ref))

// Delete followers subcollection
followersSnapshot.docs.forEach(doc => batch.delete(doc.ref))

// Delete memorial document
batch.delete(memorialRef)

batch.commit()
```

---

## 🔐 **AUTHENTICATION & AUTHORIZATION**

### **Session Management**
- **Client**: Firebase Auth handles authentication
- **Server**: Session cookies for server-side auth
- **Expiry**: 5-day session cookies
- **Security**: httpOnly, secure cookies

### **Role-Based Access**
```javascript
// User roles stored in custom claims
roles: ['owner', 'family_member', 'viewer', 'admin']

// Portal access logic
if (user.admin) {
  // Access all memorials
} else if (user.role === 'family_member') {
  // Access invited memorials only
} else {
  // Access own memorials only
}
```

---

## 💳 **PAYMENT INTEGRATION**

### **Stripe Flow**
1. **Client**: Stripe Elements for secure card input
2. **Server**: Create payment intent with memorial metadata
3. **Client**: Confirm payment with Stripe
4. **Server**: Webhook handles payment success
5. **Database**: Update payment status to 'paid'

### **Environment Variables**
```bash
STRIPE_SECRET_KEY=sk_test_...
VITE_STRIPE_PUBLIC_KEY=pk_test_...
```

---

## 📧 **EMAIL INTEGRATION**

### **SendGrid Operations**
```javascript
// Receipt email after payment
sendReceiptEmail(userEmail, {
  memorialId,
  lovedOneName,
  packageDetails,
  total,
  paymentDate
})

// Registration emails
sendRegistrationEmail(email, password)
sendEnhancedRegistrationEmail(registrationData)
```

### **Environment Variables**
```bash
SENDGRID_API_KEY=SG....
```

---

## 🏗️ **TECHNICAL ARCHITECTURE**

### **Frontend Stack**
- **Framework**: SvelteKit
- **Styling**: TailwindCSS + Skeleton UI
- **Icons**: Lucide Svelte
- **State**: Svelte 5 runes ($state, $derived)

### **Backend Stack**
- **Runtime**: Node.js
- **Database**: Firebase Firestore
- **Auth**: Firebase Authentication
- **Payments**: Stripe
- **Email**: SendGrid

### **Key Files for Recreation**
```
frontend/
├── src/
│   ├── lib/
│   │   ├── components/
│   │   │   ├── Login.svelte
│   │   │   ├── portals/OwnerPortal.svelte
│   │   │   └── calculator/
│   │   │       ├── Calculator.svelte
│   │   │       └── StripeCheckout.svelte
│   │   ├── server/
│   │   │   ├── firebase.ts
│   │   │   ├── stripe.ts
│   │   │   └── email.ts
│   │   └── types/
│   │       ├── memorial.ts
│   │       ├── livestream.ts
│   │       └── invitation.ts
│   └── routes/
│       ├── login/+page.svelte
│       ├── my-portal/
│       │   ├── +page.svelte
│       │   └── +page.server.ts
│       ├── app/calculator/
│       │   ├── +page.svelte
│       │   └── +page.server.ts
│       ├── app/checkout/success/
│       │   ├── +page.svelte
│       │   └── +page.server.ts
│       └── api/
│           ├── session/+server.ts
│           └── memorials/[id]/+server.ts
```

---

## 🚀 **RECREATION CHECKLIST**

### **1. Setup & Configuration**
- [ ] Initialize SvelteKit project
- [ ] Install dependencies (Firebase, Stripe, SendGrid, TailwindCSS)
- [ ] Configure Firebase project
- [ ] Set up Stripe account
- [ ] Configure SendGrid
- [ ] Set environment variables

### **2. Authentication System**
- [ ] Implement Firebase Auth client-side
- [ ] Create session management API
- [ ] Build login component
- [ ] Set up role-based access control

### **3. Database Schema**
- [ ] Create Firestore collections
- [ ] Set up security rules
- [ ] Implement data models/types

### **4. Core Components**
- [ ] Build OwnerPortal with latest/older memorial UX
- [ ] Create Calculator with package selection
- [ ] Implement StripeCheckout component
- [ ] Build success/confirmation pages

### **5. Server-Side Logic**
- [ ] Memorial CRUD operations
- [ ] Livestream configuration management
- [ ] Payment processing
- [ ] Email notifications

### **6. Integration & Testing**
- [ ] Test complete user flow
- [ ] Verify payment processing
- [ ] Test email delivery
- [ ] Validate data consistency

This documentation provides everything needed to recreate the TributeStream application with the same user experience, data flow, and technical architecture.
