I'll analyze your SvelteKit application to understand how the login, owner portal, and calculator functionality works with Firestore collections. Let me examine the relevant files to provide you with a detailed explanation.













# **Detailed Explanation: Login, Owner Portal, and Calculator with Firestore Collections**

Based on my analysis of your SvelteKit application, here's how your authentication, owner portal, and calculator functionality integrates with Firestore collections:

## **🔐 Authentication System & Login Flow**

### **Client-Side Login Process**
Your login system uses Firebase Auth with a dual approach:

1. **Email/Password Login** ([Login.svelte](cci:7://file:///c:/Users/sanch/Tweb-083125-import-1/081925-SvelteTweb/frontend/src/lib/components/Login.svelte:0:0-0:0))
   - Uses `signInWithEmailAndPassword()` from Firebase Auth
   - Gets ID token from authenticated user
   - Sends token to `/api/session` endpoint

2. **Google OAuth Login**
   - Uses `signInWithPopup()` with `GoogleAuthProvider`
   - Same token flow as email/password

### **Server-Side Session Management**
The authentication flow creates secure server-side sessions:

1. **Session Creation** ([+page.server.ts](cci:7://file:///c:/Users/sanch/Tweb-083125-import-1/081925-SvelteTweb/frontend/src/routes/login/+page.server.ts:0:0-0:0))
   - Receives ID token from client
   - Uses Firebase Admin SDK to create session cookie (5-day expiry)
   - Sets secure HTTP-only cookie
   - Redirects to `/my-portal`

2. **Session Verification** ([hooks.server.ts](cci:7://file:///c:/Users/sanch/Tweb-083125-import-1/081925-SvelteTweb/frontend/src/hooks.server.ts:0:0-0:0))
   - Intercepts every request
   - Verifies session cookie using Admin SDK
   - Fetches user record with custom claims (role, admin status)
   - Sets `event.locals.user` with user data

### **Role-Based Access Control**
Your system uses Firebase custom claims for roles:
- **Admin**: Full access to all memorials and users
- **Owner**: Can manage their own memorials
- **Family Member**: Access to invited memorials
- **Viewer**: Access to followed memorials
- **Funeral Director**: Professional portal access

## **👑 Owner Portal Functionality**

### **Data Loading Strategy** ([my-portal/+page.server.ts](cci:7://file:///c:/Users/sanch/Tweb-083125-import-1/081925-SvelteTweb/frontend/src/routes/my-portal/+page.server.ts:0:0-0:0))
The owner portal implements role-based data fetching:

```typescript
// Admin users: Fetch ALL memorials + user list
if (locals.user.admin) {
    query = memorialsRef;
    allUsers = await adminAuth.listUsers();
}
// Family members: Fetch invited memorials only
else if (locals.user.role === 'family_member') {
    const invitationsSnap = await adminDb.collection('invitations')
        .where('inviteeEmail', '==', locals.user.email)
        .where('status', '==', 'accepted').get();
}
// Owners: Fetch their created memorials
else {
    query = memorialsRef.where('creatorUid', '==', locals.user.uid);
}
```

### **Memorial Management Features**
The [OwnerPortal.svelte](cci:7://file:///c:/Users/sanch/Tweb-083125-import-1/081925-SvelteTweb/frontend/src/lib/components/portals/OwnerPortal.svelte:0:0-0:0) component provides:

1. **Memorial Overview**
   - Lists all memorials owned by the user
   - Links to view public memorial pages
   - Edit/manage photo functionality

2. **Livestream Management**
   - Shows existing livestream details if configured
   - "Schedule Livestream" button linking to calculator

3. **Family Invitation System**
   - Email input for inviting family members
   - Sends invitations via `/api/memorials/{id}/invite`
   - Displays invitation status (pending/accepted/declined)

## **🧮 Calculator Functionality & Data Flow**

### **Configuration Management**
The calculator uses the `livestreamConfigurations` collection:

1. **Data Loading** ([calculator/+page.server.ts](cci:7://file:///c:/Users/sanch/Tweb-083125-import-1/081925-SvelteTweb/frontend/src/routes/app/calculator/+page.server.ts:0:0-0:0))
   - Checks for existing config using `memorialId`
   - Pre-fills form if configuration exists
   - Falls back to memorial data for basic info

2. **Pricing Logic** ([Calculator.svelte](cci:7://file:///c:/Users/sanch/Tweb-083125-import-1/081925-SvelteTweb/frontend/src/lib/components/calculator/Calculator.svelte:0:0-0:0))
   - **Base Packages**: Solo ($599), Live ($1,299), Legacy ($1,599)
   - **Hourly Overages**: $125/hour beyond 2-hour base
   - **Additional Services**: $325 for extra locations/days
   - **Add-ons**: Photography ($400), A/V Support ($200), etc.

### **Save & Payment Flow**
The calculator supports two paths:

1. **Save for Later** ([saveAndPayLater](cci:1://file:///c:/Users/sanch/Tweb-083125-import-1/081925-SvelteTweb/frontend/src/routes/app/calculator/+page.server.ts:55:1-226:2) action)
   - Saves configuration to Firestore with status: 'saved'
   - Redirects to owner portal
   - Allows editing later

2. **Immediate Payment** ([continueToPayment](cci:1://file:///c:/Users/sanch/Tweb-083125-import-1/081925-SvelteTweb/frontend/src/routes/app/calculator/+page.server.ts:227:1-275:2) action)
   - Creates Stripe PaymentIntent
   - Saves config with status: 'pending_payment'
   - Integrates with Stripe for processing

## **🔥 Firestore Collections Structure**

Based on the code analysis, your application uses these key collections:

### **1. `memorials`** - Core memorial data
```typescript
{
  id: string,
  lovedOneName: string,
  slug: string,
  fullSlug: string,
  creatorUid: string,        // Links to Firebase Auth user
  creatorEmail: string,
  isPublic: boolean,
  content: string,
  photos: string[],
  livestream: boolean,
  // ... additional memorial details
}
```

### **2. `livestreamConfigurations`** - Calculator data
```typescript
{
  id: memorialId,            // Uses memorial ID as document ID
  formData: CalculatorFormData,
  bookingItems: BookingItem[],
  total: number,
  userId: string,
  status: 'saved' | 'pending_payment' | 'paid',
  memorialId: string,
  createdAt: Timestamp
}
```

### **3. `invitations`** - Family member access
```typescript
{
  id: string,
  memorialId: string,
  inviteeEmail: string,
  roleToAssign: 'family_member',
  status: 'pending' | 'accepted' | 'declined',
  createdAt: Timestamp
}
```

### **4. `memorials/{id}/embeds`** - Subcollection for memorial embeds
### **5. `memorials/{id}/followers`** - Subcollection for viewer access

## **🔄 Data Flow Integration**

### **Authentication → Portal → Calculator Chain**
1. User logs in → Session created with role claims
2. Portal loads role-appropriate memorials from Firestore
3. "Schedule Livestream" links to calculator with `memorialId`
4. Calculator loads existing config or creates new one
5. Save/payment updates `livestreamConfigurations` collection
6. Portal reflects updated livestream status

### **Security & Access Control**
- **Server-side verification**: All Firestore operations use Admin SDK
- **Role-based queries**: Users only see data they're authorized for
- **Memorial ownership**: Enforced through `creatorUid` field
- **Invitation system**: Controls family member access via `invitations` collection

This architecture provides a secure, scalable system where Firebase Auth handles authentication, Firestore manages data persistence, and SvelteKit coordinates the user experience across login, portal management, and payment processing.