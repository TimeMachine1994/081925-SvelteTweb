# WBS: Calculator System

**Created:** January 30, 2026  
**Purpose:** Document the memorial service booking calculator system - components, files, data flow, and architecture for future modifications.

---

## Executive Summary

The Calculator System is a multi-step booking wizard that allows users to:
1. Select a service tier (Record, Live, Legacy)
2. Configure main and additional memorial services (location, date/time, hours)
3. Add optional add-ons (photography, A/V support, live musician, USB drives)
4. View real-time pricing summary
5. Save schedule or proceed to Stripe payment

The system integrates with:
- **Firestore** for persistence (memorials, livestreamConfigurations)
- **Stripe** for payment processing
- **Stream creation** for auto-generating livestream records

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CALCULATOR SYSTEM OVERVIEW                          │
└─────────────────────────────────────────────────────────────────────────────┘

User Entry Points:
  /app/calculator?memorialId=xxx     → Direct calculator access
  /schedule/[memorialId]             → Schedule page with embedded calculator

                              ┌─────────────────────┐
                              │   Calculator.svelte │  ← Main orchestrator
                              │   (628 lines)       │
                              └─────────────────────┘
                                        │
              ┌─────────────┬───────────┼───────────┬─────────────┐
              ▼             ▼           ▼           ▼             ▼
    ┌──────────────┐ ┌────────────┐ ┌────────┐ ┌────────────┐ ┌──────────────┐
    │TierSelector  │ │BookingForm │ │Summary │ │StripeCheck-│ │ useAutoSave  │
    │.svelte       │ │.svelte     │ │.svelte │ │out.svelte  │ │ composable   │
    │(77 lines)    │ │(332 lines) │ │(129 ln)│ │(162 lines) │ │(142 lines)   │
    └──────────────┘ └────────────┘ └────────┘ └────────────┘ └──────────────┘
              │             │           │           │
              ▼             ▼           ▼           ▼
    ┌──────────────────────────────────────────────────────────────────────────┐
    │                            SHARED RESOURCES                              │
    ├──────────────────────────────────────────────────────────────────────────┤
    │  Types:        $lib/types/livestream.ts, $lib/types/memorial.ts          │
    │  Pricing:      $lib/config/pricing.ts                                    │
    │  Utilities:    $lib/utils/streamMapper.ts                                │
    └──────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
    ┌──────────────────────────────────────────────────────────────────────────┐
    │                            API ENDPOINTS                                 │
    ├──────────────────────────────────────────────────────────────────────────┤
    │  PATCH /api/memorials/[memorialId]/schedule        → Save schedule       │
    │  POST  /api/memorials/[memorialId]/schedule/auto-save → Auto-save draft  │
    │  POST  /api/memorials/[memorialId]/sync-calculator → Sync stream→calc    │
    │  POST  /api/memorials/[memorialId]/streams         → Create streams      │
    │  POST  /api/create-payment-intent                  → Stripe payment      │
    │  POST  /app/calculator (action)                    → Server actions      │
    └──────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
    ┌──────────────────────────────────────────────────────────────────────────┐
    │                         FIRESTORE COLLECTIONS                            │
    ├──────────────────────────────────────────────────────────────────────────┤
    │  memorials                  → services, calculatorConfig fields          │
    │  livestreamConfigurations   → Saved booking configurations               │
    │  streams                    → Auto-created stream records                │
    └──────────────────────────────────────────────────────────────────────────┘
```

---

## File Inventory

### 1. UI Components

| File | Purpose | Lines | Key Exports |
|------|---------|-------|-------------|
| `src/lib/components/calculator/Calculator.svelte` | Main orchestrator component | 628 | Default export |
| `src/lib/components/calculator/TierSelector.svelte` | Package tier selection UI | 77 | Default export |
| `src/lib/components/calculator/BookingForm.svelte` | Service details form (location, time, add-ons) | 332 | Default export |
| `src/lib/components/calculator/Summary.svelte` | Pricing summary & action buttons | 129 | Default export |
| `src/lib/components/calculator/StripeCheckout.svelte` | Stripe card element integration | 162 | Default export |

### 2. Route Files

| File | Purpose | Lines |
|------|---------|-------|
| `src/routes/app/calculator/+page.svelte` | Calculator page wrapper | 645 |
| `src/routes/app/calculator/+page.server.ts` | Load memorial/config, server actions | 287 |
| `src/routes/schedule/+page.svelte` | Schedule landing page | ~32k |
| `src/routes/schedule/[memorialId]/+page.svelte` | Memorial-specific schedule | Uses calculator |

### 3. API Endpoints

| File | Method | Purpose |
|------|--------|---------|
| `src/routes/api/memorials/[memorialId]/schedule/+server.ts` | PATCH | Save schedule to memorial |
| `src/routes/api/memorials/[memorialId]/schedule/auto-save/+server.ts` | GET/POST | Auto-save draft data |
| `src/routes/api/memorials/[memorialId]/sync-calculator/+server.ts` | POST | Sync stream changes back to calculator |
| `src/routes/api/memorials/[memorialId]/streams/+server.ts` | GET/POST | Create/list streams for memorial |
| `src/routes/api/create-payment-intent/+server.ts` | POST | Create Stripe payment intent |

### 4. Type Definitions

| File | Key Types |
|------|-----------|
| `src/lib/types/livestream.ts` | `Tier`, `CalculatorFormData`, `BookingItem`, `TierInfo`, `LivestreamConfig` |
| `src/lib/types/memorial.ts` | `Memorial`, `ServiceDetails`, `AdditionalServiceDetails` |
| `src/lib/types/stream.ts` | `Stream`, `StreamCreateRequest`, `StreamSyncResult` |

### 5. Configuration & Utilities

| File | Purpose |
|------|---------|
| `src/lib/config/pricing.ts` | All pricing constants, calculation functions, custom pricing support |
| `src/lib/utils/streamMapper.ts` | Maps schedule data to stream creation requests |
| `src/lib/composables/useAutoSave.ts` | Auto-save composable for schedule data |

### 6. Tests

| File | Coverage |
|------|----------|
| `src/lib/components/calculator/Calculator.test.ts` | Main component tests |
| `src/lib/components/calculator/Calculator.simple.test.ts` | Simplified tests |
| `src/lib/components/__tests__/Calculator.test.ts` | Additional tests |
| `src/routes/schedule/page.test.ts` | Schedule page tests |
| `src/routes/schedule/schedule.test.ts` | Schedule functionality tests |

---

## Data Structures

### Service Tiers

```typescript
type Tier = 'record' | 'live' | 'legacy' | 'standard' | 'premium';

// Current Pricing (from pricing.ts)
TIER_PRICES = {
  record: 699,    // DIY recording kit
  live: 1299,     // Professional videographer + tech
  legacy: 1599    // Full package + editing + USB
}
```

### Services Data Model

```typescript
// Stored in memorial.services
interface Services {
  main: {
    location: { name: string; address: string; isUnknown: boolean };
    time: { date: string | null; time: string | null; isUnknown: boolean };
    hours: number;  // Default: 2
  };
  additional: Array<{
    type: 'location' | 'day';
    location: { name: string; address: string; isUnknown: boolean };
    time: { date: string | null; time: string | null; isUnknown: boolean };
    hours: number;
  }>;
}
```

### Calculator Form Data

```typescript
interface CalculatorFormData {
  selectedTier: Tier;
  memorialId?: string;
  hours?: number;
  additionalLocation?: boolean;
  additionalDay?: boolean;
  addons: {
    photography?: boolean;        // $400
    audioVisualSupport?: boolean; // $200
    liveMusician?: boolean;       // $500
    woodenUsbDrives?: number;     // $300 first, $100 additional
  };
}
```

### Booking Items (Line Items)

```typescript
interface BookingItem {
  id?: string;
  name: string;
  package?: string;    // Grouping label
  price: number;
  quantity?: number;
  total?: number;
}
```

---

## Pricing Logic

### Base Packages
| Tier | Price | Includes |
|------|-------|----------|
| Record | $699 | 2 hours, DIY kit, custom link, 1 year hosting |
| Live | $1,299 | 2 hours, professional videographer + tech |
| Legacy | $1,599 | Live + video editing + 1 USB drive |

### Add-on Pricing
| Add-on | Price |
|--------|-------|
| Photography | $400 |
| Audio/Visual Support | $200 |
| Live Musician | $500 |
| First USB Drive | $300 |
| Additional USB Drives | $100 each |

### Overage & Fees
| Item | Price |
|------|-------|
| Hourly Overage (after 2 hrs) | $125/hour |
| Additional Location Fee | $325 base |
| Additional Day Fee | $325 base |

### Custom Pricing Support
The system supports per-memorial custom pricing via `memorial.customPricing`:
```typescript
interface CustomPricing {
  enabled: boolean;
  tiers?: Partial<Record<Tier, number>>;
  addons?: { ... };
  rates?: { hourlyOverage?: number; additionalServiceFee?: number };
  notes?: string;
}
```

---

## Key Flows

### 1. Load Calculator
```
1. User navigates to /app/calculator?memorialId=xxx
2. +page.server.ts loads:
   - memorial from Firestore
   - livestreamConfigurations (if exists)
3. Calculator.svelte receives data via props
4. onMount() restores:
   - Memorial metadata (lovedOneName, funeralDirectorName)
   - Existing calculatorConfig (tier, addons)
   - Services data (locations, times)
   - Auto-saved draft (if newer, prompts user)
```

### 2. Price Calculation (Reactive)
```
bookingItems = $derived.by(() => {
  1. Add base package item
  2. Add main service hourly overage (if hours > 2)
  3. Add additional location fee + overage
  4. Add additional day fee + overage
  5. Add selected add-ons
  Return array of BookingItem
})

total = $derived(bookingItems.reduce(sum))
```

### 3. Save and Pay Later
```
1. Validate: tier selected, location name provided
2. Build payload: { services, calculatorData, bookingItems, totalPrice }
3. PATCH /api/memorials/[memorialId]/schedule
4. API updates memorial.services + memorial.calculatorConfig
5. Call createStreamsFromScheduleLocal() → auto-create stream records
6. Clear auto-save draft
```

### 4. Proceed to Payment
```
1. Save configuration (same as above)
2. POST /api/create-payment-intent with amount
3. Receive clientSecret from Stripe
4. Mount Stripe card element
5. User completes payment
6. Redirect to /app/checkout/success
```

### 5. Stream ↔ Calculator Sync
```
When stream date/time changed:
  POST /api/memorials/[memorialId]/sync-calculator
  → Updates memorial.services with new date/time

When schedule changed:
  streamMapper.createStreamsFromSchedule()
  → Creates/updates stream records
```

---

## Component Responsibilities

### Calculator.svelte (Main Orchestrator)
- **State Management**: `services`, `calculatorData`, `selectedTier`, `currentStep`
- **Price Calculation**: `bookingItems` derived state
- **Auto-save**: Integrates `useAutoSave` composable
- **Flow Control**: booking → payment → payNow steps
- **Stream Creation**: Calls `createStreamsFromSchedule()` after save

### TierSelector.svelte
- Displays 3 tier cards with features
- Emits `onchange(tier)` when selected
- Hardcoded tier data (could be refactored to use pricing.ts)

### BookingForm.svelte
- **Memorial Info**: lovedOneName, funeralDirectorName, funeralHome
- **Main Service**: date, time, hours, location name/address, "unknown" toggles
- **Additional Services**: location toggle, day toggle, with their own forms
- **Add-ons**: photography, A/V support, live musician, USB quantity

### Summary.svelte
- Groups `bookingItems` by package
- Displays line items with quantities and totals
- Sticky behavior when scrolling
- Action buttons: "Save and Pay Later", "Pay Now", "Continue to Payment"

### StripeCheckout.svelte
- Lazy-loads Stripe.js
- Creates payment intent via API
- Mounts Stripe card element
- Handles payment confirmation
- Redirects on success

---

## Known Issues & Technical Debt

### 1. Duplicated Tier Data
- `TierSelector.svelte` has hardcoded tier names/prices/features
- Should import from `$lib/config/pricing.ts` for consistency

### 2. Legacy Type Aliases
- `standard` and `premium` tiers exist for backwards compatibility
- Should be deprecated and migrated

### 3. Stream Deletion Disabled
- `streamMapper.ts` has commented-out deletion code
- Orphaned streams remain in database

### 4. Multiple Payment Flows
- "Continue to Payment" vs "Pay Now" have overlapping logic
- Could be consolidated

### 5. Verbose Logging
- Many console.log statements for debugging
- Should be wrapped in dev-mode checks

### 6. Form Validation
- Basic validation exists but not comprehensive
- No visual feedback for invalid states

---

## Modification Checklist

### To Change Pricing:
1. Update `src/lib/config/pricing.ts`
2. Update `TierSelector.svelte` tier data (currently duplicated)
3. Update any hardcoded prices in `BookingForm.svelte` add-on labels

### To Add New Add-on:
1. Add to `ADDON_PRICES` in `pricing.ts`
2. Add to `CalculatorFormData.addons` type in `livestream.ts`
3. Add checkbox/input in `BookingForm.svelte`
4. Add booking item calculation in `Calculator.svelte` `bookingItems` derived

### To Add New Tier:
1. Add to `Tier` type in `livestream.ts`
2. Add pricing in `pricing.ts`
3. Add card in `TierSelector.svelte`
4. Handle in USB drive logic if tier-specific rules apply

### To Modify Service Structure:
1. Update `Services` interface in `memorial.ts`
2. Update form fields in `BookingForm.svelte`
3. Update API endpoint `/api/memorials/[memorialId]/schedule`
4. Update `streamMapper.ts` if stream creation affected

---

## Future Enhancement Ideas

| Enhancement | Description | Effort |
|-------------|-------------|--------|
| **Pricing Admin UI** | Admin panel to modify prices without code changes | Medium |
| **Tier Comparison Modal** | Side-by-side feature comparison popup | Low |
| **Promo Codes** | Discount code system at checkout | Medium |
| **Multi-Memorial Discount** | Family package pricing | Medium |
| **Quote Generator** | PDF quote export for funeral directors | Medium |
| **Booking Calendar** | Visual calendar for date selection | High |
| **Address Autocomplete** | Google Places integration for locations | Medium |
| **Progress Indicator** | Step wizard UI for multi-step flow | Low |
| **Email Receipt** | Auto-send booking confirmation | Low |
| **Payment Plans** | Split payment option via Stripe | High |

---

## Related Documentation

- `DevDocs/ROUTES_WBS.md` - Route structure documentation
- `DevDocs/ProjectOverview.md` - System architecture
- `DevDocs/WBS_EMAIL_AUDIT_SYSTEM.md` - Email audit (sends booking confirmations)

---

*Document Version: 1.0*  
*Last Updated: January 30, 2026*
