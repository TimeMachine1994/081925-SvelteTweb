# TributeStream Pricing Quick Reference

## 📍 Location
All pricing is now centralized in: **`/lib/config/pricing.ts`**

## 💰 Current Pricing (December 2025)

### Base Packages (2 hours included)
| Tier | Price | Features |
|------|-------|----------|
| **Record** | $699 | Recording service, custom link, 1-year hosting |
| **Live** | $1,299 | Live streaming, professional videographer & tech |
| **Legacy** | $1,599 | Premium: editing, USB drive, keepsake box |

### Add-ons
| Service | Price | Notes |
|---------|-------|-------|
| Photography | $400 | Professional service |
| Audio/Visual Support | $200 | Technical support |
| Live Musician | $500 | Live performance |
| USB Drives | $300 | First drive ($100 each additional) |

### Additional Fees
- **Hourly Overage**: $125/hour (beyond 2 hours included)
- **Additional Location**: $325 base fee + hourly overages
- **Additional Day**: $325 base fee + hourly overages

### Special Rules
- **Legacy Tier**: Includes 1 USB drive FREE
- **All Packages**: Include 2 hours of coverage
- **Additional Services**: Each gets 2 hours included, then overage rates apply

## 🔧 How to Use

### Import Constants
```typescript
import {
  TIER_PRICES,
  ADDON_PRICES,
  HOURLY_OVERAGE_RATE,
  ADDITIONAL_SERVICE_FEE,
  TIER_FEATURES
} from '$lib/config/pricing';
```

### Use Helper Functions
```typescript
import {
  calculateHourlyOverage,
  calculateUsbDriveCost,
  getTierDisplayName,
  calculateTotalPrice
} from '$lib/config/pricing';
```

### Quick Example
```typescript
// Get a tier price
const price = TIER_PRICES.live; // $1,299

// Calculate overage (5 hours total, 2 included = 3 overage)
const overage = calculateHourlyOverage(5); // $375

// Calculate USB drives (2 drives, Legacy tier has 1 free)
const usbCost = calculateUsbDriveCost(2, 'legacy'); // $100

// Get display name
const name = getTierDisplayName('record'); // "Tributestream Record"
```

## 🚫 Don't Do This Anymore
```typescript
// ❌ OLD WAY - Don't hardcode pricing
const TIER_PRICES = {
  record: 699,
  live: 1299,
  legacy: 1599
};
```

```typescript
// ✅ NEW WAY - Import from centralized config
import { TIER_PRICES } from '$lib/config/pricing';
```

## 📝 Updating Prices

### To change pricing:
1. Open `/lib/config/pricing.ts`
2. Update the relevant constant
3. Save and build
4. All pages update automatically

### To add a new tier:
1. Update `Tier` type in `/lib/types/livestream.ts`
2. Add tier to `TIER_PRICES` in `/lib/config/pricing.ts`
3. Add features to `TIER_FEATURES` in `/lib/config/pricing.ts`
4. Update UI components to display new tier

### To add a new add-on:
1. Add to `ADDON_PRICES` in `/lib/config/pricing.ts`
2. Update `Addons` interface in component
3. Update UI to display new add-on

## 🔍 Files Using Pricing

### Production Files
- ✅ `/routes/schedule/[memorialId]/+page.svelte`
- ✅ `/routes/schedule/+page.svelte`
- ✅ `/lib/components/calculator/Calculator.svelte`
- ✅ `/lib/types/livestream.ts` (deprecated constant)

### Test Files
- `/lib/components/calculator/Calculator.simple.test.ts`
- `/lib/components/calculator/Calculator.test.ts`
- `/routes/schedule/schedule.test.ts`
- `/routes/schedule/page.test.ts`

## 📊 Example Calculations

### Example 1: Basic Record Package
```
Base: Record ($699)
Hours: 2 (included)
Add-ons: None
TOTAL: $699
```

### Example 2: Live with Extras
```
Base: Live ($1,299)
Hours: 4 (2 included, 2 overage @ $125/hr = $250)
Add-ons: Photography ($400), 1 USB ($300)
TOTAL: $2,249
```

### Example 3: Legacy with Multiple Services
```
Base: Legacy ($1,599)
Main Service: 3 hours (1 overage @ $125 = $125)
Additional Location: $325 + 2.5 hours (0.5 overage @ $125 = $62.50)
Add-ons: 2 USB drives (1 free with Legacy, 1 @ $100 = $100)
TOTAL: $2,211.50
```

### Example 4: Complex Scenario
```
Base: Live ($1,299)
Main Service: 5 hours (3 overage @ $125 = $375)
Additional Day: $325 + 3 hours (1 overage @ $125 = $125)
Add-ons:
  - Photography ($400)
  - A/V Support ($200)
  - Live Musician ($500)
  - 3 USB drives ($300 + $200 = $500)
TOTAL: $3,724
```

## 🎯 Key Takeaways

1. **Single Source**: All pricing in `/lib/config/pricing.ts`
2. **Type Safe**: Full TypeScript support
3. **Helper Functions**: Use provided calculators
4. **Easy Updates**: Change once, updates everywhere
5. **Well Documented**: Clear comments and examples

---

**Last Updated**: December 3, 2025  
**Version**: 1.0  
**Maintained By**: Development Team
