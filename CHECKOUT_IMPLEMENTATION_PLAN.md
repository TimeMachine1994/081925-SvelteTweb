# Checkout & Payment Implementation Plan
## Based on User Decisions

**Status**: Ready to Implement  
**Created**: October 31, 2024  
**Estimated Time**: 3-5 days for critical fixes

---

## ✅ User Decisions Made

1. **Payment Flow**: Keep Stripe Checkout Sessions ✓
2. **Success Page**: Use existing `/payment/receipt` page ✓
3. **Email Templates**: Working ✓
4. **Webhook Secret**: Configured ✓
5. **Payment Restrictions**: Enforce now ✓

---

## 💡 What Are "Payment Restrictions"?

**Payment restrictions** means enforcing the rule that owners can only create **one unpaid memorial**.

### Current Problem
According to your existing code:
- Users register as "owners" to create memorials for loved ones
- System tracks `hasPaidForMemorial: false` and `memorialCount: 0`
- After first memorial creation, they should pay before creating more
- **But**: Payment success doesn't update these flags!

### What Happens When We Fix It
```typescript
// When webhook receives payment success:
1. Memorial gets marked: isPaid: true ✓
2. User gets marked: hasPaidForMemorial: true ✓
3. User can now create additional memorials ✓
```

**Without the fix**: Users might hit payment walls or create unlimited unpaid memorials  
**With the fix**: Proper monetization and user experience

---

## 🎯 Implementation Order

### **Phase 1: Critical Webhook Fixes** (Day 1-2)
Must complete these first - payment system is broken without them

### **Phase 2: Success Page Integration** (Day 3)
Connect webhook success to your existing receipt page

### **Phase 3: Testing & Verification** (Day 4-5)
Ensure everything works end-to-end

---

## 📋 Detailed Task List

### **PHASE 1: Fix Webhook Handler** (Day 1-2, ~5 hours)

#### Task 1.1: Update Webhook Event Listeners (1.5 hours)
**File**: `frontend/src/routes/api/webhooks/stripe/+server.ts`

**Changes**:
```typescript
// Line 34-52: REPLACE THIS
switch (event.type) {
  case 'payment_intent.succeeded':
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    await handlePaymentSuccess(paymentIntent);
    break;
  // ... rest
}

// WITH THIS
switch (event.type) {
  case 'checkout.session.completed':
    const session = event.data.object as Stripe.Checkout.Session;
    await handleCheckoutSuccess(session);
    break;

  case 'checkout.session.async_payment_succeeded':
    const asyncSession = event.data.object as Stripe.Checkout.Session;
    await handleCheckoutSuccess(asyncSession);
    break;

  case 'checkout.session.async_payment_failed':
    const failedSession = event.data.object as Stripe.Checkout.Session;
    await handleCheckoutFailure(failedSession);
    break;

  // Keep these for direct payment intent updates
  case 'payment_intent.payment_failed':
    const failedPayment = event.data.object as Stripe.PaymentIntent;
    await handlePaymentFailure(failedPayment);
    break;

  default:
    console.log(`Unhandled event type: ${event.type}`);
}
```

---

#### Task 1.2: Update Payment Success Handler (2 hours)
**File**: `frontend/src/routes/api/webhooks/stripe/+server.ts`

**Current function** `handlePaymentSuccess` needs to become `handleCheckoutSuccess`

**Changes Required**:
```typescript
// REPLACE handlePaymentSuccess function (lines 61-97)
async function handleCheckoutSuccess(session: Stripe.Checkout.Session) {
  try {
    console.log('💳 [WEBHOOK] Processing checkout session:', session.id);
    
    const memorialId = session.metadata?.memorialId;
    const uid = session.metadata?.uid;

    if (!memorialId || !uid) {
      console.error('Missing metadata in checkout session:', { memorialId, uid });
      return;
    }

    // Extract payment intent ID from session
    const paymentIntentId = typeof session.payment_intent === 'string' 
      ? session.payment_intent 
      : session.payment_intent?.id;

    // 1. Update Memorial
    const memorialRef = adminDb.collection('memorials').doc(memorialId);
    await memorialRef.update({
      isPaid: true,  // ✅ NEW - Enable payment restrictions
      paidAt: Timestamp.now(),
      'calculatorConfig.status': 'paid',
      'calculatorConfig.paidAt': Timestamp.now(),
      'calculatorConfig.checkoutSessionId': session.id,
      'calculatorConfig.paymentIntentId': paymentIntentId,
      'calculatorConfig.lastModified': Timestamp.now(),
      paymentHistory: FieldValue.arrayUnion({
        checkoutSessionId: session.id,
        paymentIntentId: paymentIntentId,
        status: 'succeeded',
        amount: session.amount_total ? session.amount_total / 100 : 0,
        paidAt: Timestamp.now(),
        createdBy: uid
      })
    });

    console.log('✅ [WEBHOOK] Memorial updated:', memorialId);

    // 2. Update User - Enable payment restrictions ✅
    const userRef = adminDb.collection('users').doc(uid);
    await userRef.update({
      hasPaidForMemorial: true,
      lastPaymentDate: Timestamp.now()
    });

    console.log('✅ [WEBHOOK] User updated:', uid);

    // 3. Send confirmation email
    await sendConfirmationEmail({
      memorialId,
      checkoutSessionId: session.id,
      paymentIntentId: paymentIntentId,
      customerEmail: session.customer_details?.email || session.metadata?.customerEmail,
      lovedOneName: session.metadata?.lovedOneName,
      amount: session.amount_total ? session.amount_total / 100 : 0
    });

    console.log('✅ [WEBHOOK] Confirmation email sent');
  } catch (error) {
    console.error('❌ [WEBHOOK] Failed to handle checkout success:', error);
    throw error; // Re-throw to trigger Stripe retry
  }
}
```

---

#### Task 1.3: Add Checkout Failure Handler (1 hour)
**File**: `frontend/src/routes/api/webhooks/stripe/+server.ts`

**Add new function** after `handleCheckoutSuccess`:
```typescript
async function handleCheckoutFailure(session: Stripe.Checkout.Session) {
  try {
    console.log('❌ [WEBHOOK] Processing failed checkout session:', session.id);
    
    const memorialId = session.metadata?.memorialId;
    const uid = session.metadata?.uid;

    if (!memorialId) {
      console.error('Missing memorialId in failed checkout session');
      return;
    }

    const memorialRef = adminDb.collection('memorials').doc(memorialId);
    await memorialRef.update({
      'calculatorConfig.status': 'payment_failed',
      'calculatorConfig.paymentFailedAt': Timestamp.now(),
      'calculatorConfig.checkoutSessionId': session.id,
      'calculatorConfig.lastModified': Timestamp.now(),
      paymentHistory: FieldValue.arrayUnion({
        checkoutSessionId: session.id,
        status: 'failed',
        amount: session.amount_total ? session.amount_total / 100 : 0,
        failedAt: Timestamp.now(),
        failureReason: 'Checkout session failed',
        createdBy: uid
      })
    });

    // Send failure notification email
    await sendPaymentFailureEmail({
      memorialId,
      checkoutSessionId: session.id,
      customerEmail: session.customer_details?.email || session.metadata?.customerEmail,
      lovedOneName: session.metadata?.lovedOneName,
      failureReason: 'Payment was not completed'
    });

    console.log('✅ [WEBHOOK] Failure handling complete');
  } catch (error) {
    console.error('❌ [WEBHOOK] Failed to handle checkout failure:', error);
  }
}
```

---

#### Task 1.4: Update Existing handlePaymentFailure (30 min)
**File**: `frontend/src/routes/api/webhooks/stripe/+server.ts`

Keep the existing `handlePaymentFailure` function but update it to match new pattern:
```typescript
// Update line 73 to use checkoutSessionId if available
'calculatorConfig.checkoutSessionId': paymentIntent.metadata?.checkoutSessionId || null,
```

---

### **PHASE 2: Connect to Receipt Page** (Day 3, ~3 hours)

#### Task 2.1: Update Checkout Session Success URL (30 min)
**File**: `frontend/src/routes/api/create-payment-intent/+server.ts`

**Current** (line 65):
```typescript
success_url: `${request.headers.get('origin')}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
```

**Change to**:
```typescript
success_url: `${request.headers.get('origin')}/payment/receipt?session_id={CHECKOUT_SESSION_ID}`,
```

---

#### Task 2.2: Create Receipt Page Server Handler (2 hours)
**New File**: `frontend/src/routes/payment/receipt/+page.server.ts`

```typescript
import { adminDb } from '$lib/server/firebase';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import Stripe from 'stripe';
import { STRIPE_SECRET_KEY } from '$env/static/private';

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2024-10-28.acacia'
});

export const load: PageServerLoad = async ({ url, locals }) => {
  // Don't require auth - receipt page can be accessed by anyone with session_id
  const sessionId = url.searchParams.get('session_id');
  
  if (!sessionId) {
    throw error(400, 'Missing session ID');
  }

  try {
    // Retrieve session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items', 'customer']
    });

    // Get memorial data
    const memorialId = session.metadata?.memorialId;
    if (!memorialId) {
      throw error(400, 'Missing memorial ID in session metadata');
    }

    const memorialDoc = await adminDb.collection('memorials').doc(memorialId).get();
    
    if (!memorialDoc.exists) {
      throw error(404, 'Memorial not found');
    }

    const memorial = memorialDoc.data();
    const config = memorial?.calculatorConfig;

    // Build receipt data
    const receiptData = {
      paymentDate: new Date().toISOString(),
      paymentIntentId: session.payment_intent,
      checkoutSessionId: sessionId,
      customerInfo: {
        firstName: session.customer_details?.name?.split(' ')[0] || 'Customer',
        lastName: session.customer_details?.name?.split(' ').slice(1).join(' ') || '',
        email: session.customer_details?.email || session.metadata?.customerEmail,
        phone: session.customer_details?.phone || null,
        address: session.customer_details?.address || {
          line1: '',
          line2: '',
          city: '',
          state: '',
          postal_code: ''
        }
      },
      bookingData: {
        items: config?.bookingItems || [],
        total: config?.total || (session.amount_total ? session.amount_total / 100 : 0)
      },
      memorial: {
        id: memorialId,
        lovedOneName: memorial?.lovedOneName || session.metadata?.lovedOneName
      }
    };

    return {
      receiptData
    };
  } catch (err) {
    console.error('Failed to load receipt data:', err);
    throw error(500, 'Failed to load receipt information');
  }
};
```

---

#### Task 2.3: Update Receipt Page to Use Server Data (30 min)
**File**: `frontend/src/routes/payment/receipt/+page.svelte`

**Change from URL params to server data**:

```svelte
<script lang="ts">
  // REPLACE lines 1-21 with:
  import { goto } from '$app/navigation';
  import {
    CheckCircle,
    Download,
    Mail,
    Calendar,
    MapPin,
    Phone,
    User,
    CreditCard
  } from 'lucide-svelte';

  // Get data from page server load instead of URL params
  let { data } = $props();
  let receiptData = $state(data.receiptData);
  let emailSent = $state(false);
  let sendingEmail = $state(false);

  // REMOVE the onMount function (lines 22-45)
  // Email will be sent by webhook, not client-side
</script>
```

---

### **PHASE 3: Testing** (Day 4-5, ~4 hours)

#### Task 3.1: Update Stripe Webhook Configuration (30 min)
**In Stripe Dashboard**:

1. Go to Developers → Webhooks
2. Add/Edit your webhook endpoint
3. Set URL: `https://yourdomain.com/api/webhooks/stripe`
4. Select events:
   - ✅ `checkout.session.completed`
   - ✅ `checkout.session.async_payment_succeeded`
   - ✅ `checkout.session.async_payment_failed`
   - ✅ `payment_intent.payment_failed`
5. Copy webhook signing secret to `.env`

---

#### Task 3.2: Local Testing with Stripe CLI (1 hour)
```bash
# Install Stripe CLI (if not already installed)
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:5173/api/webhooks/stripe

# In another terminal, trigger test events
stripe trigger checkout.session.completed

# Test the full flow
npm run dev
# Go to calculator, schedule service, pay with test card
```

---

#### Task 3.3: Test Payment Flow End-to-End (2 hours)

**Test Checklist**:
- [ ] Create memorial as owner
- [ ] Fill out calculator/schedule
- [ ] Click "Save and Pay Now"
- [ ] Redirects to Stripe Checkout
- [ ] Enter test card: `4242 4242 4242 4242`
- [ ] Completes payment
- [ ] Redirects to `/payment/receipt?session_id=...`
- [ ] Receipt shows correct data
- [ ] Check Firestore:
  - [ ] Memorial `isPaid: true`
  - [ ] Memorial `calculatorConfig.status: 'paid'`
  - [ ] User `hasPaidForMemorial: true`
- [ ] Check webhook logs
- [ ] Check email was sent

**Test Failed Payment**:
- [ ] Use declined card: `4000 0000 0000 0002`
- [ ] Check memorial status updated to `payment_failed`
- [ ] Check failure email sent

**Test 3D Secure**:
- [ ] Use 3DS card: `4000 0025 0000 3155`
- [ ] Complete 3D Secure challenge
- [ ] Verify payment completes

---

#### Task 3.4: Verify Payment Restrictions Work (30 min)

**Test Flow**:
1. Create account as owner
2. Create first memorial (free/unpaid)
3. Try to create second memorial
4. Should be blocked until payment
5. Complete payment for first memorial
6. Check `hasPaidForMemorial: true`
7. Try to create second memorial again
8. Should now be allowed ✅

---

## 🔧 Additional Small Fixes

### Fix API Endpoint Name (Optional but Recommended)
**Rename folder**:
- From: `frontend/src/routes/api/create-payment-intent/`
- To: `frontend/src/routes/api/create-checkout-session/`

**Update references**:
- `frontend/src/routes/payment/+page.svelte` line 24
- Any other files calling this endpoint

---

## 📊 Success Criteria

After implementation, you should have:

✅ **Webhooks listening to correct events**
- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`
- `checkout.session.async_payment_failed`

✅ **Payment status properly updated**
- Memorial: `isPaid: true`
- Memorial: `calculatorConfig.status: 'paid'`
- User: `hasPaidForMemorial: true`

✅ **Success page working**
- Redirects to `/payment/receipt?session_id=...`
- Shows correct order details
- Professional receipt display

✅ **Payment restrictions enforced**
- Owners limited to one unpaid memorial
- After payment, can create more
- Clear user messaging

✅ **Email notifications**
- Confirmation emails on success
- Failure emails on decline
- Sent via webhook (reliable)

---

## 🚀 Ready to Start?

I recommend implementing in this order:

**Day 1**: Phase 1, Task 1.1-1.2 (webhook event handlers)  
**Day 2**: Phase 1, Task 1.3-1.4 (failure handlers)  
**Day 3**: Phase 2 (receipt page integration)  
**Day 4**: Phase 3, Task 3.1-3.2 (webhook config & local testing)  
**Day 5**: Phase 3, Task 3.3-3.4 (end-to-end testing)

**Want me to start implementing now?** I can begin with Phase 1, Task 1.1 (webhook event listeners).
