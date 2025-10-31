# Checkout & Payment System Fix Plan

**Status**: Draft for Review  
**Created**: October 31, 2024  
**Priority**: High - Payment system critical for revenue

---

## 🎯 Executive Summary

Your payment system currently uses **Stripe Checkout Sessions** but has code referencing **Payment Intents**, causing confusion and potential bugs. The webhook handler listens for wrong events, and payment success doesn't properly update memorial/user payment status.

---

## ❓ Clarifying Questions (PLEASE ANSWER FIRST)

### 1. Payment Flow Preference
**Question**: Do you want to keep using **Stripe Checkout Sessions** (current) or switch to **Payment Intents** (embedded)?

- **Option A - Checkout Sessions (Recommended)**
  - ✅ Pros: Stripe-hosted, PCI compliant out of box, easier maintenance
  - ❌ Cons: Less control over UI, redirects user away from site
  - Current implementation mostly uses this

- **Option B - Payment Intents (Embedded)**
  - ✅ Pros: Full UI control, better UX, no redirects
  - ❌ Cons: More complex, requires PCI compliance consideration
  - You have `StripeCheckout.svelte` component ready but unused

**Your Answer**: _______________

### 2. Success Page Experience
**Question**: After payment, where should users land?

- **Option A**: Simple confirmation page with order summary
- **Option B**: Redirect to memorial page
- **Option C**: Redirect to profile with success banner
- **Option D**: Custom experience based on user role

**Your Answer**: _______________

### 3. Payment Restrictions Priority
**Question**: Do you want to enforce the "one unpaid memorial" restriction immediately?

- Currently memorial payment status doesn't update properly
- User's `hasPaidForMemorial` flag not being set
- This affects ability to create additional memorials

**Your Answer**: Yes / No / Later

### 4. Email Notifications
**Question**: Are the email templates working? Do they need updates?

- Confirmation emails sent after successful payment
- Failure emails for declined cards
- Action required emails for 3D Secure

**Your Answer**: _______________

### 5. Webhook Secret
**Question**: Do you have the Stripe Webhook Secret configured in production?

- Currently falls back to empty string (security risk)
- Needed for webhook signature verification

**Your Answer**: Yes / No / Need Help Setting Up

---

## 📋 Phase 1: Critical Fixes (Week 1 - Days 1-3)

### Priority: 🔴 URGENT - Payment System Broken

#### Task 1.1: Fix Webhook Event Handlers (2 hours)
**File**: `frontend/src/routes/api/webhooks/stripe/+server.ts`

**Current Problem**:
```typescript
case 'payment_intent.succeeded':  // ❌ Wrong event for Checkout Sessions
```

**Fix Required**:
```typescript
case 'checkout.session.completed':  // ✅ Correct event
  const session = event.data.object as Stripe.Checkout.Session;
  // Extract payment intent from session
  const paymentIntentId = session.payment_intent;
  await handlePaymentSuccess(session);
  break;
```

**Steps**:
1. Update webhook event listeners
2. Modify `handlePaymentSuccess` to accept session object
3. Extract payment intent ID from session
4. Test with Stripe CLI webhook forwarding

**Testing**:
```bash
stripe listen --forward-to localhost:5173/api/webhooks/stripe
stripe trigger checkout.session.completed
```

---

#### Task 1.2: Fix Memorial Payment Status Updates (1.5 hours)
**File**: `frontend/src/routes/api/webhooks/stripe/+server.ts` line 73-85

**Current Problem**:
- Only updates `calculatorConfig.status`
- Doesn't update `memorial.isPaid`
- Doesn't update `user.hasPaidForMemorial`

**Fix Required**:
```typescript
// Update memorial
await memorialRef.update({
  isPaid: true,
  paidAt: Timestamp.now(),
  'calculatorConfig.status': 'paid',
  'calculatorConfig.paidAt': Timestamp.now(),
  'calculatorConfig.checkoutSessionId': session.id,
  'calculatorConfig.paymentIntentId': paymentIntentId
});

// Update user
const userRef = adminDb.collection('users').doc(uid);
await userRef.update({
  hasPaidForMemorial: true,
  memorialCount: FieldValue.increment(1)
});
```

**Files to Update**:
- `frontend/src/routes/api/webhooks/stripe/+server.ts`

---

#### Task 1.3: Fix Webhook Secret Validation (30 minutes)
**File**: `frontend/src/routes/api/webhooks/stripe/+server.ts` line 9

**Current Problem**:
```typescript
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';
```

**Fix Required**:
```typescript
import { STRIPE_WEBHOOK_SECRET } from '$env/static/private';

if (!STRIPE_WEBHOOK_SECRET) {
  throw new Error('STRIPE_WEBHOOK_SECRET environment variable must be set');
}
```

**Steps**:
1. Add to `.env` file
2. Add validation on server startup
3. Update error handling

---

#### Task 1.4: Rename Misleading API Endpoint (1 hour)
**Current**: `frontend/src/routes/api/create-payment-intent/+server.ts`  
**Should Be**: `frontend/src/routes/api/create-checkout-session/+server.ts`

**Impact**: 
- Better code clarity
- Easier debugging
- Matches actual behavior

**Files to Update**:
1. Rename folder: `create-payment-intent` → `create-checkout-session`
2. Update imports in:
   - `frontend/src/routes/payment/+page.svelte` line 24
   - `frontend/src/routes/schedule/[memorialId]/+page.svelte` (if used)

**Migration Steps**:
```typescript
// OLD: /api/create-payment-intent
// NEW: /api/create-checkout-session
```

---

## 📋 Phase 2: Fix User Experience (Week 1 - Days 4-5)

### Priority: 🟡 HIGH - User-Facing Issues

#### Task 2.1: Fix Success Page Data Display (2 hours)
**File**: `frontend/src/routes/app/checkout/success/+page.svelte`

**Current Problem**:
```svelte
<p><strong>Package:</strong> {data.config.basePackage}</p>
<!-- ❌ These fields don't exist in LivestreamConfig -->
```

**Fix Options**:

**Option A - Simple Confirmation**:
```svelte
<h1>✅ Payment Successful!</h1>
<p>Thank you for your purchase.</p>
<p><strong>Memorial:</strong> {data.config.formData.lovedOneName}</p>
<p><strong>Total:</strong> ${data.config.total}</p>
<a href="/memorials/{data.config.memorialId}">View Memorial</a>
```

**Option B - Detailed Receipt**:
```svelte
<h2>Order Summary</h2>
{#each data.config.bookingItems as item}
  <div class="line-item">
    <span>{item.name}</span>
    <span>${item.total}</span>
  </div>
{/each}
<div class="total">
  <strong>Total: ${data.config.total}</strong>
</div>
```

---

#### Task 2.2: Fix Success Page Routing (1 hour)
**File**: `frontend/src/routes/api/create-payment-intent/+server.ts` line 65

**Current**:
```typescript
success_url: `${origin}/payment/success?session_id={CHECKOUT_SESSION_ID}`
// ❌ This route doesn't exist
```

**Fix**:
```typescript
success_url: `${origin}/app/checkout/success?session_id={CHECKOUT_SESSION_ID}`
// ✅ Matches actual route
```

---

#### Task 2.3: Create Proper Success Page Handler (2 hours)
**File**: `frontend/src/routes/app/checkout/success/+page.server.ts`

**Current Problem**:
- Uses `configId` from URL (not present)
- Should use `session_id` from Stripe

**Fix Required**:
```typescript
export const load: PageServerLoad = async ({ url, locals }) => {
  if (!locals.user) {
    throw error(401, 'Unauthorized');
  }

  const sessionId = url.searchParams.get('session_id');
  if (!sessionId) {
    throw error(400, 'Missing session ID');
  }

  // Retrieve session from Stripe
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  
  // Get memorial data
  const memorialId = session.metadata.memorialId;
  const memorial = await getMemorial(memorialId);
  
  return {
    session,
    memorial,
    config: memorial.calculatorConfig
  };
};
```

---

## 📋 Phase 3: Clean Up Dead Code (Week 2 - Days 1-2)

### Priority: 🟢 MEDIUM - Code Quality

#### Task 3.1: Remove Unused StripeCheckout Component (30 minutes)
**File to Delete**: `frontend/src/lib/components/calculator/StripeCheckout.svelte`

**Why**: 
- Never imported or used
- Uses Payment Intents (you use Checkout Sessions)
- Confusing for future developers

**Steps**:
1. Search codebase for any imports
2. Delete component file
3. Delete test file if exists

---

#### Task 3.2: Remove Unused Calculator Payment Action (30 minutes)
**File**: `frontend/src/routes/app/calculator/+page.server.ts` lines 237-285

**Action to Remove**: `continueToPayment`

**Why**:
- Creates Payment Intents
- Not used in actual flow
- Duplicates functionality

---

#### Task 3.3: Standardize Stripe API Version (15 minutes)
**Files**:
- `frontend/src/routes/api/webhooks/stripe/+server.ts` line 12
- `frontend/src/routes/api/create-payment-intent/+server.ts` line 10

**Current**:
```typescript
apiVersion: '2023-10-16'  // In webhooks
apiVersion: '2025-08-27.basil'  // In payment creation
```

**Fix**: Use same version everywhere
```typescript
apiVersion: '2024-10-28.acacia'  // Latest stable
```

---

## 📋 Phase 4: Enhance & Optimize (Week 2 - Days 3-5)

### Priority: 🔵 LOW - Nice to Have

#### Task 4.1: Direct Email Service Calls (2 hours)
**File**: `frontend/src/routes/api/webhooks/stripe/+server.ts` lines 176-222

**Current Problem**:
```typescript
await fetch('/api/send-confirmation-email', {
  // ❌ Internal HTTP call inside webhook
```

**Better Approach**:
```typescript
import { sendConfirmationEmail } from '$lib/server/email';

await sendConfirmationEmail({
  // ✅ Direct function call
});
```

**Benefits**:
- Faster execution
- Better error handling
- No unnecessary HTTP overhead

---

#### Task 4.2: Add Checkout Session Webhook Events (1 hour)
**File**: `frontend/src/routes/api/webhooks/stripe/+server.ts`

**Add Support For**:
```typescript
case 'checkout.session.async_payment_succeeded':
  // Handle delayed payment success (bank transfers, etc.)
  
case 'checkout.session.async_payment_failed':
  // Handle delayed payment failure
  
case 'checkout.session.expired':
  // Handle expired sessions (24 hour timeout)
```

---

#### Task 4.3: Add Payment History Dashboard (4 hours)
**New File**: `frontend/src/routes/admin/payments/+page.svelte`

**Features**:
- List all payments
- Filter by status
- Export to CSV
- Refund capability
- Revenue analytics

---

#### Task 4.4: Implement Retry Logic (2 hours)
**File**: `frontend/src/routes/api/webhooks/stripe/+server.ts`

**Add**:
```typescript
async function handleWebhookWithRetry(handler, data, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await handler(data);
      return;
    } catch (error) {
      if (attempt === maxRetries) throw error;
      await sleep(1000 * attempt); // Exponential backoff
    }
  }
}
```

---

## 📋 Testing Checklist

### Unit Tests
- [ ] Webhook event handlers
- [ ] Payment status updates
- [ ] Email sending functions
- [ ] Metadata extraction

### Integration Tests
- [ ] Full payment flow (schedule → checkout → success)
- [ ] Failed payment handling
- [ ] 3D Secure flow
- [ ] Webhook signature verification

### Manual Testing
- [ ] Test with Stripe test cards
- [ ] Test webhook forwarding
- [ ] Verify email delivery
- [ ] Check Firestore updates
- [ ] Test success page display
- [ ] Test payment restrictions

### Stripe Test Cards
```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
3D Secure: 4000 0025 0000 3155
```

---

## 🚀 Deployment Checklist

### Environment Variables Required
```env
# Production
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...

# Development
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### Stripe Dashboard Configuration
1. Create webhook endpoint in Stripe Dashboard
2. Set webhook URL: `https://yourdomain.com/api/webhooks/stripe`
3. Select events:
   - `checkout.session.completed`
   - `checkout.session.async_payment_succeeded`
   - `checkout.session.async_payment_failed`
   - `payment_intent.payment_failed`
4. Copy webhook secret to environment

### Database Indexes
```javascript
// Firestore indexes for payment queries
memorials:
  - isPaid (asc), paidAt (desc)
  - ownerUid (asc), isPaid (asc)

users:
  - hasPaidForMemorial (asc), createdAt (desc)
```

---

## 📊 Timeline Summary

| Phase | Days | Priority | Deliverable |
|-------|------|----------|-------------|
| Phase 1 | 3 | 🔴 Urgent | Payment system functional |
| Phase 2 | 2 | 🟡 High | User experience fixed |
| Phase 3 | 2 | 🟢 Medium | Clean codebase |
| Phase 4 | 3 | 🔵 Low | Enhanced features |
| **Total** | **10 days** | | Fully fixed payment system |

---

## 💰 Impact Assessment

### Current State
- ❌ Payments may not update memorial status
- ❌ User restrictions may not work
- ❌ Webhook events being missed
- ❌ Confusing code for maintenance

### After Phase 1
- ✅ Payments properly recorded
- ✅ Memorial status updated correctly
- ✅ User restrictions enforced
- ✅ All webhook events captured

### After Phase 2
- ✅ Users see correct confirmation
- ✅ Proper success page routing
- ✅ Better user experience

### After Phase 3
- ✅ Clean, maintainable code
- ✅ No dead code confusion
- ✅ Consistent API usage

### After Phase 4
- ✅ Admin payment dashboard
- ✅ Retry logic for reliability
- ✅ Better email performance

---

## 🤔 Decision Points

### 1. Payment Flow Architecture
Based on your answer to Question 1, we'll either:
- **Keep Checkout Sessions**: Remove dead Payment Intent code
- **Switch to Payment Intents**: Activate StripeCheckout.svelte component

### 2. Success Page Design
Based on your answer to Question 2, we'll create:
- Simple confirmation page
- Detailed receipt with line items
- Role-based redirect logic

### 3. Implementation Priority
Based on your answers to Questions 3-5:
- Adjust task priorities
- Add/remove features
- Focus on most critical path

---

## 📞 Next Steps

1. **Review this document** and answer the 5 clarifying questions
2. **Approve Phase 1** tasks for immediate implementation
3. **Schedule** time for testing after Phase 1
4. **Provide** Stripe webhook secret (or request setup help)
5. **Decide** on success page design preference

---

## 🛠️ Quick Start Commands

### Set up Stripe webhook testing
```bash
# Install Stripe CLI
scoop install stripe

# Login
stripe login

# Forward webhooks to local
stripe listen --forward-to localhost:5173/api/webhooks/stripe

# Trigger test events
stripe trigger checkout.session.completed
```

### Test payment flow locally
```bash
# Start dev server
npm run dev

# In another terminal, start webhook forwarding
stripe listen --forward-to localhost:5173/api/webhooks/stripe

# Use test card: 4242 4242 4242 4242
```

---

**Ready to start?** Please answer the 5 clarifying questions above, and I'll create detailed implementation tickets for each task! 🚀
