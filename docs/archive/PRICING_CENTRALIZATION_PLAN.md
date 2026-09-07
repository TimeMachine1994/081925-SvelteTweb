# Pricing Centralization Implementation Plan

## 🎯 Objective
Centralize all pricing constants currently duplicated across multiple files into a single source of truth to eliminate duplication and simplify maintenance.

## 📊 Current State Analysis

### Locations with Hardcoded Pricing
1. **`/routes/schedule/[memorialId]/+page.svelte`** (Lines 139-154)
2. **`/lib/components/calculator/Calculator.svelte`** (Lines 139-153)
3. **`/lib/types/livestream.ts`** (Lines 29-62) - OUTDATED VALUES
4. Multiple test files with duplicate constants

### Current Pricing Values (Correct)
```typescript
TIER_PRICES = {
    record: 699,
    live: 1299,
    legacy: 1599
}

ADDON_PRICES = {
    photography: 400,
    audioVisualSupport: 200,
    liveMusician: 500,
    woodenUsbDrives: 300
}

HOURLY_OVERAGE_RATE = 125
ADDITIONAL_SERVICE_FEE = 325
```

### Outdated Values (In livestream.ts)
```typescript
// ❌ INCORRECT - Need to update or remove
record: { price: 99 }      // Should be 699
standard: { price: 199 }   // Tier not used
premium: { price: 299 }    // Tier not used
legacy: { price: 149 }     // Should be 1599
```

## 🔧 Implementation Steps

### Step 1: Create Centralized Pricing Config
**File**: `/lib/config/pricing.ts`

**Contents**:
- Base tier pricing constants
- Addon pricing constants
- Hourly overage rate
- Additional service fee
- Helper functions for price calculations
- TypeScript interfaces for type safety

### Step 2: Update Component Files
**Files to Update**:
1. `/routes/schedule/[memorialId]/+page.svelte`
   - Remove hardcoded constants (lines 139-154)
   - Import from centralized config
   - Verify calculations still work

2. `/lib/components/calculator/Calculator.svelte`
   - Remove hardcoded constants (lines 139-153)
   - Import from centralized config
   - Verify calculations still work

### Step 3: Fix Type Definitions
**File**: `/lib/types/livestream.ts`
- Update `TIER_PRICING` constant with correct values OR
- Remove `TIER_PRICING` entirely and use centralized config
- Update `TierInfo` interface if needed

### Step 4: Update Test Files (If Needed)
- Check test files for hardcoded pricing
- Update to import from centralized config
- Ensure tests still pass

## ✅ Verification Checklist

### Functional Testing
- [ ] Schedule calculator displays correct prices
- [ ] Calculator component displays correct prices
- [ ] Booking items calculate correctly
- [ ] Total prices match expected values
- [ ] Add-on pricing works correctly
- [ ] Hourly overage calculations work
- [ ] Additional service fees apply correctly

### Code Quality
- [ ] No duplicate pricing constants remain
- [ ] All imports resolve correctly
- [ ] TypeScript types are correct
- [ ] No build errors
- [ ] ESLint passes (if applicable)

### Edge Cases
- [ ] USB drive pricing (first vs additional)
- [ ] Legacy tier includes 1 USB drive free
- [ ] Multiple additional services calculate correctly
- [ ] Hour overages beyond 2 hours calculate correctly

## 🎁 Benefits

### Maintainability
- **Single source of truth** for all pricing
- **One place to update** when prices change
- **No risk of inconsistent pricing** across pages

### Developer Experience
- **Easy to find** pricing information
- **Type-safe** with TypeScript interfaces
- **Well-documented** with comments

### Business Flexibility
- **Quick price updates** without searching multiple files
- **Easy to add** new tiers or addons
- **Audit trail** when combined with version control

## 🚀 Future Enhancements (Not in This PR)

### Phase 2: Database Storage
- Move pricing to Firestore
- Admin interface for price management
- Price history and audit trail

### Phase 3: Memorial-Specific Pricing
- Custom pricing per funeral director
- Promotional pricing
- Volume discounts
- Seasonal pricing

### Phase 4: Advanced Features
- Currency support
- Tax calculations
- Discount codes
- Package bundling

## 📝 Implementation Notes

### Backwards Compatibility
- Existing memorial records will continue to work
- No database migrations required
- Price changes only affect new bookings

### Testing Strategy
1. Run existing tests
2. Manual testing of calculator
3. Manual testing of schedule page
4. Verify price calculations in console logs

### Rollback Plan
If issues are discovered:
1. Git revert the changes
2. Restore original hardcoded values
3. Debug and re-implement

## 📅 Timeline
- **Planning**: 5 minutes (This document)
- **Implementation**: 15 minutes
- **Testing**: 10 minutes
- **Total**: ~30 minutes

## 🔍 Files to Modify

### Create New Files
- `/lib/config/pricing.ts` (NEW)

### Modify Existing Files
- `/routes/schedule/[memorialId]/+page.svelte`
- `/lib/components/calculator/Calculator.svelte`
- `/lib/types/livestream.ts`
- Test files (if needed)

---

**Status**: Ready to implement
**Assignee**: AI Assistant
**Priority**: High (eliminates technical debt)
**Estimated Effort**: 30 minutes
