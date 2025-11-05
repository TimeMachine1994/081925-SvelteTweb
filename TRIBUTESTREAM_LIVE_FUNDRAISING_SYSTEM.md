# Tributestream Live - Fundraising System Architecture

**Date**: November 4, 2025  
**Status**: Planning Phase

## Overview

Complete fundraising and donation system for Tributestream Live, enabling event owners to raise money for personal causes, charities, or celebrations.

---

## 1. System Architecture

### Payment Flow
```
Viewer → Donation Widget → API → Stripe → Webhook → Firestore → Event Owner
```

### Stripe Integration
- **Stripe Checkout**: Simple donation UI
- **Stripe Connect**: Platform payouts to event owners
- **Stripe Webhooks**: Real-time payment updates

---

## 2. Data Models

### Donation Schema
```typescript
interface Donation {
  id: string;
  eventId: string;
  eventOwnerId: string;
  
  // Donor info
  donorUserId?: string;
  donorEmail?: string;
  donorName?: string;
  isAnonymous: boolean;
  
  // Payment
  amount: number; // cents
  currency: string;
  platformFee: number;
  netAmount: number;
  
  stripePaymentIntentId: string;
  paymentStatus: 'pending' | 'succeeded' | 'failed' | 'refunded';
  payoutStatus: 'pending' | 'available' | 'paid';
  
  message?: string;
  createdAt: Date;
}
```

### Event Fundraising
```typescript
interface Event {
  fundraising?: {
    enabled: boolean;
    goal?: number;
    currentAmount: number;
    donorCount: number;
    causeType: CauseType;
    causeDescription: string;
    
    donationSettings: {
      minAmount?: number;
      suggestedAmounts: number[];
      showDonorNames: boolean;
      showDonorAmounts: boolean;
    };
    
    stripeConnectedAccountId?: string;
  };
}
```

---

## 3. Fee Structure

### Platform Fees (Recommended)
```
Platform Fee = (Amount × 5%) + $0.30
Stripe Fee = (Amount × 2.9%) + $0.30

Example: $100 donation
- Stripe Fee: $3.20
- Platform Fee: $5.30
- Net to Owner: $91.50
```

### Charitable Exception
501(c)(3) nonprofits: **Stripe fees only, no platform fee**

---

## 4. API Endpoints

### Donation Endpoints
```
POST /api/donations                          Create donation
GET  /api/donations/[id]                     Get donation
GET  /api/events/[eventId]/donations         List donations (owner)
GET  /api/events/[eventId]/donations/recent  Recent public donations
POST /api/donations/[id]/refund              Refund (admin)
```

### Fundraising Endpoints
```
GET  /api/events/[eventId]/fundraising/dashboard  Owner dashboard
PUT  /api/events/[eventId]/fundraising            Update settings
POST /api/events/[eventId]/fundraising/toggle     Enable/disable
```

### Payout Endpoints
```
POST /api/events/[eventId]/payouts    Request payout
GET  /api/events/[eventId]/payouts    Payout history
GET  /api/payouts/[id]                Payout details
```

### Stripe Connect
```
POST /api/stripe/connect/onboard   Start onboarding
GET  /api/stripe/connect/status    Account status
POST /api/stripe/connect/refresh   Refresh link
```

---

## 5. Donation Flow Implementation

### Step 1: Create Payment Intent
```typescript
// POST /api/donations
const paymentIntent = await stripe.paymentIntents.create({
  amount,
  currency: 'usd',
  application_fee_amount: platformFee,
  transfer_data: {
    destination: connectedAccountId
  },
  metadata: { eventId, donorEmail }
});
```

### Step 2: Process Webhook
```typescript
// POST /api/webhooks/stripe-donations
switch (event.type) {
  case 'payment_intent.succeeded':
    await updateDonation(paymentIntent.id, { 
      paymentStatus: 'succeeded' 
    });
    await incrementEventFundraising(eventId, amount);
    await sendConfirmationEmails();
    break;
}
```

---

## 6. Frontend Components

### DonationWidget.svelte
- Fundraising progress bar
- Amount selection (suggested + custom)
- Anonymous toggle
- Optional message
- Recent donors list
- Donate button → Stripe Checkout

### FundraisingDashboard.svelte
- Total raised / donor count stats
- Pending payout amount
- Request payout button
- Donations list with filters
- Export to CSV

---

## 7. Payout System

### Stripe Connect Onboarding
1. Event owner enables fundraising
2. Create Stripe Express account
3. Redirect to Stripe onboarding flow
4. User completes identity verification
5. Adds bank account
6. Account approved → ready for payouts

### Payout Options
- **Automatic**: Daily/weekly/monthly schedule
- **Manual**: Owner requests when ready
- **Instant** (optional): Higher fee, arrives in minutes

### Payout Timeline
```
Donation → [2-3 days processing] → Available Balance
Available → [Request Payout] → [2-5 days] → Bank Account
```

---

## 8. Security & Compliance

### PCI Compliance
- Stripe handles all card data
- No card numbers touch our servers
- Stripe Elements for secure input

### Fraud Prevention
- Rate limiting (10/hour, 50/day)
- IP reputation checks
- Stripe Radar automatic blocking
- Amount validation
- Email verification

### Tax Compliance
- 1099-K for owners earning >$600/year
- Automatic Stripe reporting
- Charitable receipt generation for 501(c)(3)

### Data Privacy
- Donation records: indefinite retention
- Personal data: 7-year retention
- IP addresses: 90 days only
- Right to anonymization

---

## 9. Email Notifications

### To Donor
- **Subject**: "Thank you for your donation!"
- Donation amount and details
- Tax receipt (if applicable)
- Link to watch event

### To Event Owner
- **Subject**: "💝 New donation received"
- Donor name (or anonymous)
- Amount and message
- Fundraising progress
- Dashboard link

### Milestones
- **Subject**: "🎉 You've reached 50% of your goal!"
- Current progress
- Donor count
- Share prompts

---

## 10. Analytics & Reporting

### Owner Dashboard Metrics
- Total raised / donor count / average donation
- Goal progress percentage
- Donations over time chart
- Donor segments (anonymous vs named)
- Amount distribution ranges
- Traffic sources
- Conversion rate (viewers to donors)

### Platform Metrics
- Total platform donations
- Monthly growth rate
- Revenue (platform fees)
- Events reaching goals
- Fundraising by event type

---

## 11. Testing Requirements

### Unit Tests
- Donation creation validation
- Fee calculation accuracy
- Webhook event handling
- Payout request logic

### Integration Tests
- Full donation flow (end-to-end)
- Stripe Connect onboarding
- Webhook processing
- Email delivery

### Security Tests
- Rate limiting enforcement
- Fraud detection triggers
- Unauthorized access prevention
- Data encryption validation

---

## 12. Implementation Phases

### Phase 1: Core Donation System (2 weeks)
- Donation API endpoints
- Stripe integration (Checkout)
- Basic donation widget
- Webhook handling
- Email notifications

### Phase 2: Stripe Connect & Payouts (1 week)
- Connect onboarding flow
- Payout request system
- Account verification
- Dashboard integration

### Phase 3: Advanced Features (1 week)
- Fundraising dashboard
- Analytics and reporting
- Donor recognition features
- Export capabilities
- Milestone celebrations

### Phase 4: Security & Compliance (1 week)
- Fraud prevention
- Rate limiting
- Tax compliance features
- Security audit
- Load testing

---

## 13. Success Metrics

### User Adoption
- % of events with fundraising enabled
- Average donations per event
- Donor conversion rate

### Financial
- Total volume processed
- Platform fee revenue
- Average donation amount

### User Satisfaction
- Payout success rate
- Support ticket volume
- Owner NPS score

---

## Next Steps

1. ✅ Review fundraising system architecture
2. Set up Stripe Connect platform account
3. Implement core donation API
4. Build donation widget component
5. Create owner dashboard
6. Test full flow end-to-end
7. Deploy to staging
8. Launch beta program

---

**Document Owner**: Backend & Payments Team  
**Last Updated**: November 4, 2025  
**Related Docs**: DATA_MODEL.md, UI_UX_CHANGES.md
