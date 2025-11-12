# Tributestream Schedule Calculator Refactor Plan

## Executive Summary

This document outlines a comprehensive refactor plan to unify the schedule/calculator system, fix payment processing, and ensure proper email notifications. The current system has critical architectural issues that prevent proper data flow and Firestore integration.

---

## Current State Analysis

### 🚨 Critical Issues Identified

1. **Dual Data Storage Systems**
   - Schedule page uses localStorage
   - Calculator component uses Firestore
   - No communication between systems

2. **Data Structure Incompatibility**
   - Different schemas between schedule and calculator
   - Missing memorial context in schedule page
   - Broken save/restore flow

3. **Payment Integration Gaps**
   - Mock Stripe webhook implementation
   - No actual payment processing
   - Missing email service integration

4. **Email System Not Implemented**
   - Mock email sending only
   - No actual SMTP/service integration
   - Missing confirmation templates

---

## Phase 1: Data Architecture Unification

### 1.1 Standardize Data Structure

**Target Schema:**
```typescript
interface UnifiedCalculatorData {
  // Memorial context
  memorialId: string;
  lovedOneName: string;
  
  // Service configuration
  selectedTier: 'solo' | 'live' | 'legacy';
  mainService: {
    location: { name: string; address: string; isUnknown: boolean };
    time: { date: string | null; time: string | null; isUnknown: boolean };
    hours: number;
  };
  
  // Additional services
  additionalLocation: {
    enabled: boolean;
    location: { name: string; address: string; isUnknown: boolean };
    startTime: string | null;
    hours: number;
  };
  additionalDay: {
    enabled: boolean;
    location: { name: string; address: string; isUnknown: boolean };
    startTime: string | null;
    hours: number;
  };
  
  // Contact information
  funeralDirectorName: string;
  funeralHome: string;
  
  // Add-ons
  addons: {
    photography: boolean;
    audioVisualSupport: boolean;
    liveMusician: boolean;
    woodenUsbDrives: number;
  };
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  autoSaved: boolean;
}
```

### 1.2 Update Firestore Collection Structure

**Collection: `memorials/{memorialId}`**
```javascript
{
  // Existing memorial fields...
  
  // Unified calculator data
  calculatorConfig: {
    formData: UnifiedCalculatorData,
    bookingItems: BookingItem[],
    total: number,
    lastModified: Timestamp,
    lastModifiedBy: string,
    status: 'draft' | 'saved' | 'paid' | 'confirmed'
  },
  
  // Payment tracking
  paymentHistory: {
    paymentIntentId: string,
    status: 'pending' | 'succeeded' | 'failed',
    amount: number,
    createdAt: Timestamp
  }[]
}
```

### 1.3 Files to Modify

**Priority 1 - Core Data Layer:**
- [ ] `src/lib/types/livestream.ts` - Update type definitions
- [ ] `src/lib/composables/useAutoSave.ts` - Enhance with unified schema
- [ ] `src/routes/api/memorials/[memorialId]/schedule/auto-save/+server.ts` - Update endpoints

**Priority 2 - UI Components:**
- [ ] `src/routes/schedule/+page.svelte` - Remove localStorage, add memorial context
- [ ] `src/lib/components/calculator/Calculator.svelte` - Align with unified schema
- [ ] `src/lib/components/calculator/BookingForm.svelte` - Update form fields

---

## Phase 2: Schedule Page Refactor

### 2.1 Add Memorial Context

**New Route Structure:**
```
/schedule/{memorialId} - Memorial-specific calculator
/schedule/new - New memorial creation flow
```

### 2.2 Remove localStorage Dependencies

**Current Issues:**
```javascript
// REMOVE: localStorage usage
localStorage.setItem('scheduleFormData', JSON.stringify(formData));

// REPLACE WITH: Firestore auto-save
autoSave.triggerAutoSave(formData);
```

### 2.3 Integrate useAutoSave Composable

**Implementation:**
```javascript
// Add to schedule page
import { useAutoSave } from '$lib/composables/useAutoSave';

const autoSave = memorialId ? useAutoSave({
  memorialId,
  delay: 2000,
  onSave: (success, error) => {
    saveStatus = success ? 'saved' : 'error';
  }
}) : null;
```

### 2.4 Files to Create/Modify

- [ ] `src/routes/schedule/[memorialId]/+page.svelte` - New memorial-specific route
- [ ] `src/routes/schedule/[memorialId]/+page.server.ts` - Server-side data loading
- [ ] `src/routes/schedule/new/+page.svelte` - New memorial creation
- [ ] Update existing `/schedule/+page.svelte` to redirect appropriately

---

## Phase 3: Payment System Implementation

### 3.1 Stripe Integration Setup

**Environment Variables Required:**
```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

**Dependencies to Install:**
```bash
npm install stripe @stripe/stripe-js
```

### 3.2 Payment Intent Creation

**File: `src/routes/api/create-payment-intent/+server.ts`**
```typescript
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export const POST: RequestHandler = async ({ request, locals }) => {
  const { amount, memorialId, customerInfo } = await request.json();
  
  // Create payment intent
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amount * 100, // Convert to cents
    currency: 'usd',
    metadata: {
      memorialId,
      userId: locals.user.uid
    }
  });
  
  // Save payment intent to Firestore
  await adminDb.collection('memorials').doc(memorialId).update({
    'paymentHistory': FieldValue.arrayUnion({
      paymentIntentId: paymentIntent.id,
      status: 'pending',
      amount,
      createdAt: Timestamp.now()
    })
  });
  
  return json({ clientSecret: paymentIntent.client_secret });
};
```

### 3.3 Webhook Implementation

**File: `src/routes/api/webhooks/stripe/+server.ts`**
```typescript
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export const POST: RequestHandler = async ({ request }) => {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature')!;
  
  let event: Stripe.Event;
  
  try {
    event = stripe.webhooks.constructEvent(
      body, 
      signature, 
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    return json({ error: 'Invalid signature' }, { status: 400 });
  }
  
  switch (event.type) {
    case 'payment_intent.succeeded':
      await handlePaymentSuccess(event.data.object as Stripe.PaymentIntent);
      break;
    case 'payment_intent.payment_failed':
      await handlePaymentFailure(event.data.object as Stripe.PaymentIntent);
      break;
  }
  
  return json({ received: true });
};

async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
  const memorialId = paymentIntent.metadata.memorialId;
  
  // Update memorial status
  await adminDb.collection('memorials').doc(memorialId).update({
    'calculatorConfig.status': 'paid',
    'paymentHistory': FieldValue.arrayUnion({
      paymentIntentId: paymentIntent.id,
      status: 'succeeded',
      amount: paymentIntent.amount / 100,
      paidAt: Timestamp.now()
    })
  });
  
  // Send confirmation email
  await sendConfirmationEmail(memorialId, paymentIntent);
  
  // Lock schedule
  await lockSchedule(memorialId);
}
```

### 3.4 Files to Implement

- [ ] `src/routes/api/create-payment-intent/+server.ts` - Real Stripe integration
- [ ] `src/routes/api/webhooks/stripe/+server.ts` - Webhook handling
- [ ] `src/lib/components/calculator/StripeCheckout.svelte` - Enhanced checkout form
- [ ] `src/lib/utils/stripe.ts` - Stripe utility functions

---

## Phase 4: Email System Implementation

### 4.1 Email Service Setup

**Recommended: Resend.com Integration**
```bash
npm install resend
```

**Environment Variables:**
```env
RESEND_API_KEY=re_...
FROM_EMAIL=noreply@tributestream.com
```

### 4.2 Email Templates

**File: `src/lib/email/templates/confirmation.ts`**
```typescript
export function generateConfirmationEmail(data: {
  customerName: string;
  lovedOneName: string;
  serviceDate: string;
  total: number;
  bookingItems: BookingItem[];
}) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Tributestream Confirmation</title>
      </head>
      <body>
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
          <h1>Service Confirmation</h1>
          <p>Dear ${data.customerName},</p>
          <p>Thank you for choosing Tributestream for ${data.lovedOneName}'s memorial service.</p>
          
          <div style="background: #f5f5f5; padding: 20px; margin: 20px 0;">
            <h3>Service Details</h3>
            <p><strong>Date:</strong> ${data.serviceDate}</p>
            <p><strong>Total:</strong> $${data.total}</p>
          </div>
          
          <div style="background: #f9f9f9; padding: 20px; margin: 20px 0;">
            <h3>What's Next?</h3>
            <ul>
              <li>Your schedule has been locked and confirmed</li>
              <li>Our team will contact you within 24 hours</li>
              <li>Access your booking anytime in your Tributestream portal</li>
            </ul>
          </div>
        </div>
      </body>
    </html>
  `;
}
```

### 4.3 Email Service Implementation

**File: `src/lib/email/emailService.ts`**
```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendConfirmationEmail(
  to: string,
  subject: string,
  html: string
) {
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.FROM_EMAIL!,
      to,
      subject,
      html
    });
    
    if (error) {
      console.error('Email send error:', error);
      throw new Error(error.message);
    }
    
    console.log('✅ Email sent successfully:', data?.id);
    return { success: true, id: data?.id };
  } catch (error) {
    console.error('💥 Email service error:', error);
    throw error;
  }
}
```

### 4.4 Files to Implement

- [ ] `src/lib/email/emailService.ts` - Email service integration
- [ ] `src/lib/email/templates/confirmation.ts` - Email templates
- [ ] `src/routes/api/send-confirmation-email/+server.ts` - Update with real implementation
- [ ] `src/lib/email/templates/reminder.ts` - Service reminder emails

---

## Phase 5: Testing & Validation

### 5.1 End-to-End User Flow Tests

**Test Scenarios:**
1. **New Memorial Creation**
   - Create memorial → Configure service → Save draft → Return later → Data persists

2. **Payment Processing**
   - Configure service → Proceed to payment → Complete payment → Receive confirmation

3. **Auto-save Functionality**
   - Make changes → Verify auto-save → Refresh page → Data restored

4. **Email Notifications**
   - Complete payment → Verify confirmation email sent → Check email content

### 5.2 Integration Tests

**Files to Create:**
- [ ] `src/routes/schedule/schedule.integration.test.ts`
- [ ] `src/lib/composables/useAutoSave.integration.test.ts`
- [ ] `src/lib/email/emailService.test.ts`
- [ ] `tests/e2e/payment-flow.spec.ts`

### 5.3 Error Handling & Edge Cases

**Scenarios to Test:**
- Network failures during auto-save
- Payment failures and retry logic
- Email delivery failures
- Concurrent editing conflicts
- Browser refresh during payment

---

## Phase 6: Deployment & Monitoring

### 6.1 Environment Configuration

**Production Environment Variables:**
```env
# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email
RESEND_API_KEY=re_...
FROM_EMAIL=noreply@tributestream.com

# Firebase
FIREBASE_ADMIN_SDK_KEY=...
```

### 6.2 Monitoring Setup

**Metrics to Track:**
- Auto-save success/failure rates
- Payment completion rates
- Email delivery rates
- User session duration in calculator
- Form abandonment points

**Files to Create:**
- [ ] `src/lib/analytics/calculatorTracking.ts`
- [ ] `src/lib/monitoring/errorReporting.ts`

---

## Implementation Timeline

### Week 1: Foundation
- [ ] Phase 1.1-1.2: Data structure standardization
- [ ] Phase 2.1-2.2: Schedule page memorial context

### Week 2: Core Functionality
- [ ] Phase 2.3-2.4: Auto-save integration
- [ ] Phase 3.1-3.2: Basic Stripe setup

### Week 3: Payment & Email
- [ ] Phase 3.3-3.4: Webhook implementation
- [ ] Phase 4.1-4.3: Email service setup

### Week 4: Testing & Polish
- [ ] Phase 5.1-5.2: Comprehensive testing
- [ ] Phase 6.1: Production configuration

---

## Risk Mitigation

### High-Risk Areas
1. **Data Migration**: Existing localStorage data needs migration path
2. **Payment Processing**: Stripe webhook reliability in production
3. **Email Deliverability**: Ensure emails don't go to spam

### Mitigation Strategies
1. **Gradual Rollout**: Feature flags for new functionality
2. **Backup Systems**: Fallback to manual processes if automation fails
3. **Monitoring**: Real-time alerts for critical failures

---

## Success Criteria

### Technical Metrics
- [ ] 100% data consistency between schedule and calculator
- [ ] <2s auto-save response time
- [ ] >99% payment success rate
- [ ] >95% email delivery rate

### User Experience Metrics
- [ ] Seamless data persistence across sessions
- [ ] Zero data loss during form completion
- [ ] Clear payment confirmation flow
- [ ] Timely email notifications

---

## Post-Implementation Maintenance

### Regular Tasks
- Monitor Stripe webhook delivery
- Review email bounce rates
- Update payment processing logic as needed
- Maintain data structure compatibility

### Future Enhancements
- Real-time collaborative editing
- Advanced payment options (installments)
- SMS notifications
- Calendar integration for service scheduling

---

*This refactor plan ensures a robust, production-ready system with proper data flow, payment processing, and communication systems.*
