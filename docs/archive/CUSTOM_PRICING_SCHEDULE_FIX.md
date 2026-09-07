# Custom Pricing Schedule Page Fix 🔧

## 🐛 Issue Identified

**Problem**: Custom pricing was set in admin panel but NOT showing on the schedule/calculator page.

**Root Cause**: The schedule page server load function was **not passing** the `customPricing` field from Firestore to the client-side page component.

## 🔍 How We Found It

### The Evidence Chain

1. **Admin Panel** ✅ Working
   - Custom pricing was being saved correctly to Firestore
   - API endpoint `/api/admin/memorials/[id]/pricing` was functioning
   - CustomPricingEditor component was displaying and updating data

2. **Schedule Page** ❌ Broken
   - Custom pricing was NOT appearing in calculator
   - Default prices showing instead of custom prices
   - "Special Pricing Applied" badge not showing

3. **Investigation**
   - Checked schedule page component: Uses `getPricingForMemorial(data?.memorial?.customPricing)`
   - Checked server load: **Missing `customPricing` field in return statement!**

## 🛠️ The Fix

### File: `+page.server.ts`

**Location**: `src/routes/schedule/[memorialId]/+page.server.ts`

#### Before (Broken):
```typescript
return sanitizeData({
	memorial: {
		id: memorialId,
		lovedOneName: memorial?.lovedOneName || 'Unnamed Memorial',
		ownerUid: memorial?.ownerUid,
		funeralDirectorUid: memorial?.funeralDirectorUid,
		services: memorial?.services || null,
		isPaid: memorial?.isPaid || false,
		paymentStatus: memorial?.paymentStatus || 'unpaid',
		paidAt: memorial?.paidAt || null,
		manualPayment: memorial?.manualPayment || null,
		fullSlug: memorial?.fullSlug || null
		// ❌ customPricing was MISSING!
	},
	calculatorConfig: memorial?.calculatorConfig || null,
	role: locals.user.role,
	user: {
		email: locals.user.email,
		uid: locals.user.uid
	}
});
```

#### After (Fixed):
```typescript
const responseData = sanitizeData({
	memorial: {
		id: memorialId,
		lovedOneName: memorial?.lovedOneName || 'Unnamed Memorial',
		ownerUid: memorial?.ownerUid,
		funeralDirectorUid: memorial?.funeralDirectorUid,
		services: memorial?.services || null,
		isPaid: memorial?.isPaid || false,
		paymentStatus: memorial?.paymentStatus || 'unpaid',
		paidAt: memorial?.paidAt || null,
		manualPayment: memorial?.manualPayment || null,
		fullSlug: memorial?.fullSlug || null,
		customPricing: memorial?.customPricing || null  // ✅ NOW INCLUDED!
	},
	calculatorConfig: memorial?.calculatorConfig || null,
	role: locals.user.role,
	user: {
		email: locals.user.email,
		uid: locals.user.uid
	}
});

return responseData;
```

## 📊 Data Flow (Now Working)

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. ADMIN SETS CUSTOM PRICING                                    │
│    Admin Panel → POST /api/admin/memorials/[id]/pricing         │
│    ✅ Saves to Firestore: memorials/[id]/customPricing          │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. SCHEDULE PAGE LOAD (SERVER)                                  │
│    +page.server.ts → Load memorial from Firestore               │
│    ✅ NOW includes customPricing in response                     │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. SCHEDULE PAGE (CLIENT)                                       │
│    +page.svelte → Receives data.memorial.customPricing          │
│    ✅ Passes to getPricingForMemorial(customPricing)            │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. PRICING RESOLUTION                                           │
│    pricing.ts → getPricingForMemorial()                         │
│    ✅ Merges custom pricing with defaults                        │
│    ✅ Returns: { tiers: { record: 699, live: 1000, ... }, ... } │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. CALCULATOR DISPLAY                                           │
│    ✅ Shows "✨ Special Pricing Applied" badge                   │
│    ✅ Displays custom prices (e.g., Live: $1,000)               │
│    ✅ All calculations use custom rates                          │
└─────────────────────────────────────────────────────────────────┘
```

## 🔊 Console Logging Added

We added **extensive console logging** throughout the custom pricing flow to make debugging easy.

### Server-Side Logs (Node.js Console)

**Schedule Page Load** - `+page.server.ts`:
```
📅 [SCHEDULE LOAD] Starting load for memorial: abc123
✅ [SCHEDULE LOAD] Memorial loaded: John Doe
🛡️ [SCHEDULE LOAD] Permission Check:
   - User ID: xyz789, Role: admin
   - Memorial Owner UID: owner123
   - Memorial FD UID: undefined
✅ [SCHEDULE LOAD] Permission granted
💰 [SCHEDULE LOAD] Custom pricing detected!
   - Enabled: true
   - Custom tiers: { live: 1000 }
   - Custom addons: { photography: 350 }
   - Custom rates: { hourlyOverage: 100 }
   - Notes: Phone quote 12/3/25 - special discount
📤 [SCHEDULE LOAD] Sending data to page with customPricing: YES
```

### Client-Side Logs (Browser Console)

**Schedule Page Component** - `+page.svelte`:
```
📅 [SCHEDULE PAGE] Data received from server: {
  hasMemorial: true,
  memorialId: "abc123",
  lovedOneName: "John Doe",
  hasCustomPricing: true,
  customPricingEnabled: true
}
💰 [SCHEDULE PAGE] Custom Pricing Data: {
  enabled: true,
  tiers: { live: 1000 },
  addons: { photography: 350 },
  rates: { hourlyOverage: 100 },
  notes: "Phone quote 12/3/25 - special discount"
}
```

**Pricing Resolution** - `pricing.ts`:
```
🔧 [PRICING CONFIG] getPricingForMemorial called
   - Has customPricing: true
   - Is enabled: true
   → Merging CUSTOM pricing with defaults
   - Custom tiers: { live: 1000 }
   - Custom addons: { photography: 350 }
   - Custom rates: { hourlyOverage: 100 }
   ✅ Merged pricing: {
     tiers: { record: 699, live: 1000, legacy: 1599 },
     addons: { photography: 350, audioVisualSupport: 500, ... },
     hourlyOverage: 100,
     additionalService: 100
   }
```

**Pricing Display** - `+page.svelte`:
```
💰 [SCHEDULE PAGE] Pricing resolved: {
  isCustom: true,
  tiers: { record: 699, live: 1000, legacy: 1599 },
  addons: { photography: 350, audioVisualSupport: 500, ... },
  hourlyOverage: 100,
  additionalService: 100
}
```

## 🧪 Testing the Fix

### Step-by-Step Verification

1. **Set Custom Pricing in Admin**
   ```
   1. Navigate to /admin/services/memorials/[memorialId]
   2. Scroll to "Custom Pricing Override"
   3. Click "Set Custom Pricing"
   4. Enable checkbox
   5. Set Live tier to $1,000
   6. Add notes: "Test custom pricing"
   7. Click "Save Custom Pricing"
   8. ✅ Verify success message
   ```

2. **Check Server Logs**
   ```
   Open terminal running dev server
   Look for:
   📅 [SCHEDULE LOAD] Custom pricing detected!
   ```

3. **Open Schedule Page**
   ```
   1. Navigate to /schedule/[memorialId]
   2. Open browser console (F12)
   3. Look for logs:
      📅 [SCHEDULE PAGE] Custom Pricing Data: ...
      🔧 [PRICING CONFIG] getPricingForMemorial called
      💰 [SCHEDULE PAGE] Pricing resolved: ...
   ```

4. **Verify Display**
   ```
   ✅ "✨ Special Pricing Applied" badge appears
   ✅ Live tier shows $1,000 (not $1,299)
   ✅ All custom prices displayed correctly
   ✅ Calculations use custom rates
   ```

## 📁 Files Modified

### 1. Server Load Function
**File**: `src/routes/schedule/[memorialId]/+page.server.ts`
- ✅ Added `customPricing: memorial?.customPricing || null` to return object
- ✅ Added logging for load start, memorial loaded, permission check
- ✅ Added logging for custom pricing detection
- ✅ Added logging for data being sent to page

### 2. Schedule Page Component
**File**: `src/routes/schedule/[memorialId]/+page.svelte`
- ✅ Added logging when data received from server
- ✅ Added logging for custom pricing data check
- ✅ Added `$effect` to log resolved pricing

### 3. Pricing Config Function
**File**: `src/lib/config/pricing.ts`
- ✅ Added logging when `getPricingForMemorial()` is called
- ✅ Added logging for custom pricing check
- ✅ Added logging for default vs custom pricing decision
- ✅ Added logging for merged pricing result

## 🎯 What This Fixes

### Before Fix
```
Admin sets: Live tier = $1,000
Customer sees: Live tier = $1,299 (default)
❌ Custom pricing ignored
```

### After Fix
```
Admin sets: Live tier = $1,000
Customer sees: Live tier = $1,000 (custom)
✅ Custom pricing applied
✅ "Special Pricing Applied" badge shown
✅ All calculations use custom rates
```

## 🚀 Impact

### For Admins
- ✅ Custom pricing now works as expected
- ✅ Changes reflect immediately on calculator
- ✅ Easy debugging with console logs
- ✅ Confidence in phone quotes matching online prices

### For Customers
- ✅ See special pricing arrangements
- ✅ Clear indication when custom pricing active
- ✅ Accurate pricing calculations
- ✅ No confusion about phone vs online quotes

## 🔍 Debugging Tips

### If Custom Pricing Still Not Showing

**Check Server Logs:**
```bash
# Look for this line:
📤 [SCHEDULE LOAD] Sending data to page with customPricing: YES

# If it says "NO", custom pricing isn't saved in Firestore
# If missing entirely, server isn't loading the field
```

**Check Browser Console:**
```javascript
// Look for this line:
📅 [SCHEDULE PAGE] Custom Pricing Data: { enabled: true, ... }

// If missing, data isn't reaching the page
// If enabled: false, pricing isn't activated
```

**Check Firestore:**
```
1. Open Firebase Console
2. Navigate to Firestore
3. Find memorials/[memorialId]
4. Check if customPricing field exists
5. Verify enabled: true
```

## 📊 Console Log Legend

| Icon | Meaning | Where |
|------|---------|-------|
| 📅 | Schedule page activity | Server & Client |
| 💰 | Pricing-related activity | Server & Client |
| 🔧 | Pricing config function | pricing.ts |
| ✅ | Success / Positive state | All files |
| ❌ | Error / Missing data | All files |
| 🛡️ | Permission check | Server |
| 📤 | Data being sent | Server |

## 🎉 Success Criteria

After this fix, you should see:

1. ✅ Custom pricing saves in admin panel
2. ✅ Server loads customPricing from Firestore
3. ✅ Server sends customPricing to page
4. ✅ Page receives and logs customPricing
5. ✅ getPricingForMemorial() merges custom with defaults
6. ✅ Calculator displays custom prices
7. ✅ "Special Pricing Applied" badge shows
8. ✅ All calculations use custom rates
9. ✅ Console logs confirm each step

## 📝 Summary

**One Line Fix**: Added `customPricing: memorial?.customPricing || null` to server response

**Impact**: Custom pricing now flows from admin panel → Firestore → schedule page → calculator display

**Debugging**: Extensive console logging at every step makes issues easy to identify

**Result**: Admins can confidently set custom pricing and customers will see the correct prices immediately!

---

**Status**: ✅ FIXED AND TESTED  
**Date**: December 4, 2025  
**Issue**: Custom pricing not showing on schedule page  
**Solution**: Pass customPricing field from server to client  
**Logging**: Comprehensive logging added for debugging
